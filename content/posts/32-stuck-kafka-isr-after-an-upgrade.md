---
title: "Stuck Kafka ISR After an Upgrade? It's Probably Your leader-epoch-checkpoint File"
date: 2026-09-12T08:04:16+05:30
draft: true
---

{{< video src="/videos/stuck-kafka-isr.mp4" poster="/videos/stuck-kafka-isr.jpg" controls="true" caption="How a healthy Kafka partition gets permanently stuck after an upgrade — and how to fix it." >}}

About a year ago we hit the same failure on three IBM Event Streams clusters during operator upgrades that should have been routine. One partition stayed permanently under-replicated: ISR short of the replication factor for hours, while other partitions on that broker kept replicating normally.

The trigger was upgrade-related, tied to Kafka's default 30-second graceful shutdown window. That is still the default on a lot of Event Streams / Strimzi installs, so the same stuck ISR can show up again as clusters upgrade.

What follows is what that partition was doing, why the usual recovery steps miss it, and the fix, with pointers into the Kafka source and the KIP that explain the mechanism.

## Impact

Across the three clusters the symptoms were:

| Cluster | Partition | Symptom |
|---|---|---|
| 1 | `__consumer_offsets-1` | Brokers 6 and 7 stuck out of the ISR; `NotEnoughReplicasException` on writes |
| 2 | `__transaction_state-16`, `__transaction_state-45` | Corrupted on more than one replica |
| 3 | `__consumer_offsets-N` | Stuck ISR with a different, more severe endgame (see Path 3 below) |

Those two names are Kafka's internal coordination topics, not something applications create by hand:

- `__consumer_offsets` stores consumer-group membership and committed offsets. When a group joins, leaves, or commits, the coordinator writes here. Hash the group id and you land on one partition of this topic. If that partition cannot accept writes, affected groups cannot commit or rebalance cleanly.
- `__transaction_state` stores the status of idempotent and transactional producers (ongoing, prepare-commit, abort, and so on). Transactional producers consult it on begin/commit/abort. If a partition of it is stuck, those producers fail even when ordinary produce/consume on user topics still works.

Internal topics dominate this incident list for a mundane reason: every client touches them on the hot path, so a stuck replica there shows up quickly as consumer-group errors or transactional-producer failures. The mechanism is not limited to internal topics. It is about how a follower decides where to resume replicating after a restart, so any partition can hit it if the timing is bad enough.

By the time we were engaged, each customer had already tried, in order:

- Restarting the affected broker pods
- Triggering a partition reassignment (it stalled indefinitely)
- Deleting the partition directory on one broker and letting it re-sync (no change)
- Dropping `min.insync.replicas` from 3 to 1 (no change)

None of it worked. That is a useful diagnostic signal: you are not dealing with a replica that is merely behind; the replica has stopped trying to catch up.

## Root cause

Kafka followers do not blindly append whatever bytes the leader sends. Before a follower resumes fetching after a restart, it has to decide where to pick up, because the last leader it was talking to might not be the leader anymore.

That decision depends on how Kafka stores a partition on disk, what the high watermark is, and why a restarting follower truncates before it fetches.

### How a partition looks on disk

Each replica of a topic-partition is a directory on the broker. For `__consumer_offsets` partition 1 on broker 6, that looks roughly like:

```text
/var/lib/kafka/data/kafka-log6/__consumer_offsets-1/
  00000000000000000000.log          # record bytes (segment 0)
  00000000000000000000.index        # offset → byte position
  00000000000000000000.timeindex    # timestamp → offset
  000000000000001745000.log         # newer segment…
  000000000000001745000.index
  000000000000001745000.timeindex
  leader-epoch-checkpoint           # epoch → first offset map
  producer-snapshot-*.snapshot      # transactional producer state
  partition.metadata                # topic id, etc.
```

The `.log` files hold the actual messages. The checkpoint is a tiny text file next to them that records which leader wrote which offset range. When those two disagree, replication can stall even though the `.log` files look fine.

For a deeper walkthrough of segments, indexes, and replication, see Kafka's [replication design notes](https://kafka.apache.org/43/design/design/) and Confluent's [data replication course](https://developer.confluent.io/courses/architecture/data-replication/).

### High watermark, log end offset, and why truncate exists

Every replica tracks two offsets for a partition:

| Name | Meaning |
|---|---|
| Log end offset (LEO) | Next offset this replica will write. How far has this copy gotten? |
| High watermark (HW) | Highest offset known to be on every in-sync replica. Consumers only read up to HW. |

Sketch of a healthy leader with two followers in the ISR:

```text
Leader   LEO=106 │████████████████████│░░░░│  HW=104
Follower LEO=104 │████████████████████│     │  (caught up to HW)
Follower LEO=105 │█████████████████████│    │

Offsets:         100 … 103 104 105 106
                 ◄── committed (≤ HW) ──►◄─ not yet ─►
```

Records past the HW exist on the leader but are not yet safe to treat as durable. If that leader dies before followers catch up, those uncommitted tail records can disappear. A follower that kept them would diverge from the new leader.

So after a restart or a leadership change, a follower does not keep every byte it already has. It truncates: it deletes its local tail past an agreed offset, then fetches fresh data from the current leader. Truncation is intentional. It is how replicas reconverge when the previous leader's uncommitted tail is no longer authoritative.

Before [KIP-101](https://cwiki.apache.org/confluence/display/KAFKA/KIP-101+-+Alter+Replication+Protocol+to+use+Leader+Epoch+rather+than+High+Watermark+for+Truncation) (Kafka 0.11, 2017), a restarting follower truncated to its own high watermark and started fetching again. The KIP documents concrete cases where that either loses already-acknowledged messages or lets two replicas look identical by offset while holding different bytes. Offset alone is not enough history.

### Leader epochs: a version number for who was leader

The fix stamps every record batch with a leader epoch: an integer that goes up each time leadership for that partition changes. Broker 3 is leader, epoch 5. Broker 3 dies and broker 7 takes over, epoch 6. Same partition, new generation.

That epoch is written into the [record batch header](https://kafka.apache.org/43/implementation/message-format/) as `partitionLeaderEpoch`. Conceptually:

```text
offset:  100  101  102  103  104  105
epoch:     5    5    5    6    6    6
           ◄── broker 3 ──►  ◄─ broker 7 ─►
```

Every replica also keeps a durable map of `epoch → first offset written under that epoch` in `leader-epoch-checkpoint`. Healthy file after the timeline above:

```text
0          # format version
2          # number of entries
5 100      # epoch 5 starts at offset 100
6 103      # epoch 6 starts at offset 103
```

In the current codebase that file is written and read by [`LeaderEpochCheckpointFile`](https://github.com/apache/kafka/blob/trunk/storage/src/main/java/org/apache/kafka/storage/internals/checkpoint/LeaderEpochCheckpointFile.java); the in-memory view is [`LeaderEpochFileCache`](https://github.com/apache/kafka/blob/trunk/storage/src/main/java/org/apache/kafka/storage/internals/epoch/LeaderEpochFileCache.java). On restart, the follower asks the leader: for my last known epoch, where does your log say that epoch ended? (`OffsetsForLeaderEpoch`). The leader answers with a truncation point. The follower truncates there, then fetches. See [`truncateToEpochEndOffsets`](https://github.com/apache/kafka/blob/trunk/core/src/main/scala/kafka/server/AbstractFetcherThread.scala#L200-L229).

When the checkpoint's epoch history no longer matches the bytes in `.log`, that negotiation fails in one of two ways. We saw both.

{{< video src="/videos/stuck-kafka-isr-failure.mp4" poster="/videos/stuck-kafka-isr-failure.jpg" controls="true" caption="Failure mode A and B: wrong truncate → hard stop, or a retry loop that never advances." >}}

### Failure mode A: hard stop

Suppose the broken follower's checkpoint lies and says epoch 6 starts at 100, while the leader and healthy peers know epoch 6 starts at 103. The follower truncates to the wrong place, then tries to append batches whose first offset is behind its local LEO. Kafka refuses that append with `UnexpectedAppendOffsetException`, the same signature you will find in traces like [this Cloudera thread](https://community.cloudera.com/t5/Support-Questions/Kafka-Replica-out-of-sync-for-over-24-hrs/m-p/83089):

```text
Follower thinks:   next offset to write = 105
Leader sends:      batch starting at offset 100
Kafka:             "First offset 100 is less than the next offset 105" → fail
```

Thrown from [`UnifiedLog`](https://github.com/apache/kafka/blob/trunk/storage/src/main/java/org/apache/kafka/storage/internals/log/UnifiedLog.java#L1190-L1208):

```java
// https://github.com/apache/kafka/blob/trunk/storage/src/main/java/org/apache/kafka/storage/internals/log/UnifiedLog.java#L1190-L1208
if (appendInfo.firstOrLastOffsetOfFirstBatch() < localLog.logEndOffset()) {
    throw new UnexpectedAppendOffsetException(/* ... */);
}
```

The fetcher then [`markPartitionFailed`](https://github.com/apache/kafka/blob/trunk/core/src/main/scala/kafka/server/AbstractFetcherThread.scala#L494-L501) and stops monitoring that partition. You get one burst of errors, then silence. The ISR never fills back in.

### Failure mode B: a working, useless loop

Here the follower's `OffsetsForLeaderEpoch` request names an epoch the leader does not recognize for that offset range. The leader replies `UNKNOWN_LEADER_EPOCH`. That code is part of the fetch protocol from [KIP-320](https://cwiki.apache.org/confluence/display/KAFKA/KIP-320:+Allow+fetchers+to+detect+and+handle+log+truncation) (it means your epoch is newer than mine), and [`AbstractFetcherThread`](https://github.com/apache/kafka/blob/trunk/core/src/main/scala/kafka/server/AbstractFetcherThread.scala) treats it as retriable:

```scala
// https://github.com/apache/kafka/blob/trunk/core/src/main/scala/kafka/server/AbstractFetcherThread.scala#L422-L425
case Errors.UNKNOWN_LEADER_EPOCH =>
  debug(s"Remote broker has a smaller leader epoch for partition $topicPartition than " +
    s"this replica's current leader epoch of ${currentFetchState.currentLeaderEpoch}.")
  partitionsWithError += topicPartition
```

So the fetcher retries. If the bad checkpoint is never fixed, every retry hits the same wall: truncate, reload producer-state snapshot, fetch, `UNKNOWN_LEADER_EPOCH`, repeat. In one case this looped against a fixed offset (1745085) indefinitely. The thread is alive (logs are full of retry activity) but it makes zero forward progress.

Both failure modes share the same root cause: the `leader-epoch-checkpoint` file on disk no longer reflects what the log actually contains.

### How the file gets corrupted

The checkpoint is only trustworthy if it is written before the broker process dies. If Kubernetes sends `SIGKILL` before Kafka finishes flushing that metadata, which is what happens when the pod's graceful-shutdown window runs out mid-write, the follower comes back up with a checkpoint that is stale or inconsistent relative to its log segments.

Apache [KAFKA-13077](https://issues.apache.org/jira/browse/KAFKA-13077) (*"Replication failing after unclean shutdown of ZK and all brokers,"* Kafka 2.8.0, bitnami on EKS) is the issue people most often cite for this shape of failure. It is a useful illustration of checkpoint/log divergence after unclean shutdown, but it is not specific to `__transaction_state`, and it did not come from Event Streams or Strimzi. Cite it for the shutdown-safety pattern; for why the protocol behaves this way, KIP-101 and KIP-320 are the better sources.

## Why the standard playbook doesn't work here

Each of the steps below is the right move for some under-replication problems: a lagging follower, a dead pod, a brief network blip. They fail here because they assume the follower is still trying to catch up. In this failure the fetcher has either stopped (mode A) or is spinning on a bad epoch (mode B). The on-disk checkpoint is what needs fixing. Bouncing process state or relaxing write floors does not rewrite that file.

### Restarting the pod

People expect a fresh JVM to clear a stuck thread so replication resumes.

What actually happens: the broken `leader-epoch-checkpoint` lives on the persistent volume. Restart only reloads it.

```text
Before restart                    After restart
─────────────────                 ─────────────────
pod: Running                      pod: new PID, Running
  └─ volume:                      └─ same volume:
       leader-epoch-checkpoint         leader-epoch-checkpoint
         (bad epoch map)                 (unchanged, still bad)
       *.log (fine or not)               *.log (unchanged)

Fetcher: UnexpectedAppend…     →  Fetcher: same exception / same loop
```

Restarting is useful when the fetcher died for a transient reason and the checkpoint is still consistent. Here it hands the same broken map to a new process.

### Partition reassignment

Kafka reassignment (via `kafka-reassign-partitions` or an operator-driven move) adds a new replica, waits until it is fully caught up and in the ISR, then removes the old one. The catch-up step is the same fetcher path as normal replication.

```text
Desired:  Replicas [0,1,2]  →  [0,1,6]
Reality:  broker 6 is the one with the broken checkpoint / dead fetcher

Progress:
  1. Controller adds 6 to the replica set          ✓
  2. 6 must fetch until it joins the ISR           ✗ never completes
  3. Controller removes the retiring replica       ✗ never reached

UI / CR status: "in progress" indefinitely
```

If the broker doing the catching-up is the broken one, reassignment cannot finish by design. You are waiting on a fetcher that has already given up.

### Deleting the partition directory on one broker

This can work. Wiping `__consumer_offsets-1/` on the bad broker forces Kafka to recreate an empty directory and re-fetch the whole log from the leader. It only works when:

1. At least one healthy ISR member still has a good copy to fetch from
2. You delete the broken replica, not the last good one
3. The cluster operator is paused so it does not race you

```text
Safe case (Path 2 later):
  ISR: {0,1}     ← healthy leaders/followers stay up
  wipe broker 6's __consumer_offsets-1/
  6 restarts → empty dir → fetch from 0 → rejoins ISR

Unsafe race (operator still reconciling):
  you:   rm -rf …/__consumer_offsets-1/
  ops:   rolling restart / recreate pod mid-wipe
  result: pod comes back on a half-deleted dir, or the wipe
          lands on a different broker than you intended
```

Without pausing the operator first, recreates and rollouts interleave with the fix and can make state worse. With a healthy ISR and the operator paused, this is a valid recovery path. See Path 2 below.

### Lowering `min.insync.replicas`

That setting is a write-admission floor: refuse `acks=all` produces unless at least N replicas are in the ISR. It does not restart fetchers or repair checkpoints.

```text
Topic: RF=3, normally ISR={0,1,6}

Stuck:  ISR={0}     brokers 1 and 6 fetcher-dead / bad checkpoint

min.insync.replicas=3 → produces fail (NotEnoughReplicas…)
min.insync.replicas=1 → produces succeed to broker 0 alone
                         ISR still {0}; 1 and 6 never rejoin

acks=all still means "all members of the *current* ISR must ack."
Shrinking the floor does not grow the ISR.
```

One customer burned real time on this before we confirmed it cannot help. It may silence producer errors while you investigate; it does not heal the replica.

## Diagnosis

1. Find the stuck partitions and measure the ISR gap.

```bash
kafka-topics.sh --bootstrap-server <bootstrap> \
  --describe --under-replicated-partitions
```

`Leader: 0, Replicas: 0,1,2,6,7, Isr: 0` (four replicas missing) is a fundamentally different situation from one broker missing. It tells you whether the in-place repair path below is even viable.

2. Compare the checkpoint file across every replica.

```bash
oc exec <broker-pod> -- \
  cat /var/lib/kafka/data/kafka-log<id>/<topic>-<partition>/leader-epoch-checkpoint
```

Diff it across the ISR members and the out-of-sync broker. The broken one has an epoch entry pointing at an offset no healthy replica recognizes, or entries the others simply do not have.

3. Compare log size on disk.

```bash
oc exec <broker-pod> -- \
  wc -c /var/lib/kafka/data/kafka-log<id>/<topic>-<partition>/*.log
```

A `.log` file that is empty or a fraction of its healthy peers' size, paired with a suspicious checkpoint, is close to a confirmed diagnosis. If sizes and checkpoints agree across replicas, this is not the bug. Look at network partitioning, ACLs, or disk pressure instead.

4. Read the logs on the broken broker specifically, not the leader. The leader's logs look almost entirely normal in this failure. Look for `UnexpectedAppendOffsetException` or a repeating `UNKNOWN_LEADER_EPOCH` retry pattern.

5. Cross-check partition state via ZooKeeper (pre-KRaft clusters):

```bash
/opt/kafka/bin/zookeeper-shell.sh localhost:12181
get /brokers/topics/<topic>/partitions/<n>/state
```

This returns the current leader, leader epoch, and ISR list as JSON, which is ground truth before editing anything.

## Recovery

### Step 0: pause the operator

```bash
oc scale deployment eventstreams-cluster-operator --replicas=0 -n <namespace>
```

Do this before touching any partition directory or restarting any pod. If the operator is still reconciling while you are deleting data, it can recreate pods in the wrong order or kick off a rolling restart that races the fix. On the third incident, this alone was the difference. Scale it back to 1 only once the ISR is confirmed full.

### Path 1: repair the checkpoint file in place

Least destructive. It preserves log data on the affected broker when the log itself is otherwise fine and only the epoch history needs correcting.

1. Confirm the current leader and ISR (ZooKeeper or `kafka-topics --describe`).
2. Read `leader-epoch-checkpoint` on every replica holding the partition.
3. Find the highest epoch every ISR member agrees on, and the offset where that epoch starts.
4. Edit the broken broker's checkpoint file: strip the disagreeing entries, update the entry count on line 2.
5. Delete that broker's pod so Kafka reloads the corrected file on startup.

Check the ISR afterward. On one ticket this cleared on the first attempt. On another, one broker was still excluded after the edit, and we had to force a controller re-election (delete `/controller` in ZooKeeper) before re-applying the fix. The stale controller was still making decisions from outdated partition state.

### Path 2: delete the bad replica's partition directory

Faster when Path 1 does not resolve it, or when the divergence is too severe to hand-edit confidently.

```bash
# Operator must already be paused (Step 0)
oc exec <cluster>-kafka-<n> -- \
  rm -rf /var/lib/kafka/data/kafka-log<n>/<topic>-<partition>

oc exec <cluster>-kafka-<n> -- \
  ls /var/lib/kafka/data | grep <topic>-<partition>   # confirm it's gone

oc delete pod <cluster>-kafka-<n>
```

Kafka rebuilds the directory and re-fetches the entire log fresh from the leader. Only run this against the broken broker. The leader and other healthy followers stay up throughout.

### Path 3: wipe every replica (last resort, data loss)

This is what the third incident actually needed. By the time we got there, `min.insync.replicas` had already been dropped to 1 earlier in the investigation, the ISR had collapsed to a single suspect broker, and no healthy follower remained to rebuild from. A targeted repair was not an option. Wiping every replica and letting the operator rebuild from nothing was the only path, at the cost of the offset-commit history for whichever consumer groups hashed to that `__consumer_offsets` shard.

Order matters and is not arbitrary: delete followers first, leader last. Delete the leader first, and a follower carrying corrupted data can win the subsequent election and propagate the bad state to every replica you just rebuilt.

```bash
# Operator paused (Step 0). Followers first, leader last.
for pod in kafka-1 kafka-2 kafka-6 kafka-7; do
  oc exec <cluster>-${pod} -- \
    rm -rf /var/lib/kafka/data/kafka-log<id>/__consumer_offsets-1
  oc delete pod <cluster>-${pod}
done

oc exec <cluster>-kafka-0 -- \
  rm -rf /var/lib/kafka/data/kafka-log0/__consumer_offsets-1
oc delete pod <cluster>-kafka-0

oc scale deployment eventstreams-cluster-operator --replicas=1 -n <namespace>
```

Affected consumer groups reset on next startup. Coordinate with the owning application teams before this step, not after. Groups that process idempotently can reset to earliest safely; groups where reprocessing creates duplicates need a real plan, not a shrug.

## What we're changing

All three incidents trace back to the same root trigger: Kubernetes killing a broker pod before Kafka finished flushing its metadata. Kafka's default graceful-shutdown window is 30 seconds, and on a cluster with meaningful state to flush, that is frequently not enough. The process gets `SIGKILL`ed mid-write, and the checkpoint comes back inconsistent.

For an IBM Event Streams / Strimzi-based `EventStreams` custom resource, extending that window is a `strimziOverrides` pass-through to the underlying Strimzi `Kafka` pod template:

```yaml
spec:
  strimziOverrides:
    kafka:
      template:
        pod:
          terminationGracePeriodSeconds: 120
```

This does not eliminate the risk category. An unclean shutdown can still happen for other reasons. It does remove the single most common trigger we have seen. A clean shutdown essentially never leaves the epoch checkpoint in a broken state; a `SIGKILL` mid-write frequently does.

## Verifying the fix

- `kafka-topics --under-replicated-partitions` returns nothing for the affected partition, and stays empty.
- Log sizes on the recovered broker match its peers.
- Consumers rejoin and commit successfully; transactional producers succeed.
- No new `UnexpectedAppendOffsetException` or `UNKNOWN_LEADER_EPOCH` loops appear.
- If `__consumer_offsets` was wiped (Path 3), use `kafka-consumer-groups.sh --describe` to identify every affected group and confirm the reset strategy with each owning team.

Then watch the next upgrade window closely. A cluster still on the default 30-second `terminationGracePeriodSeconds` that recovered cleanly this time is a good candidate to hit this again.

## Summary

1. Pause the cluster operator before touching anything.
2. Diff `leader-epoch-checkpoint` across every replica. The broken broker's epoch history will not match its peers.
3. If healthy ISR members exist, repair the checkpoint in place first; fall back to deleting only the stuck replica's directory.
4. If the ISR has collapsed with no healthy replica left, wipe every replica (followers first, leader last) and let the operator rebuild.
5. Set `terminationGracePeriodSeconds: 120` before the next upgrade.

Every one of these incidents got harder the moment someone ran a recovery step before pausing the operator. Pause first. Fix. Confirm the ISR is full. Only then bring the operator back.

---

**Sources referenced directly**

- [Kafka replication design](https://kafka.apache.org/43/design/design/): ISR, committed writes, and why followers exist.
- [Confluent: data replication](https://developer.confluent.io/courses/architecture/data-replication/): high watermark and replica reconciliation with diagrams.
- [Message format (`partitionLeaderEpoch`)](https://kafka.apache.org/43/implementation/message-format/): where the epoch is stamped on each record batch.
- [KIP-101 — Alter Replication Protocol to use Leader Epoch rather than High Watermark for Truncation](https://cwiki.apache.org/confluence/display/KAFKA/KIP-101+-+Alter+Replication+Protocol+to+use+Leader+Epoch+rather+than+High+Watermark+for+Truncation): why HW-only truncation was unsafe, and what epochs replace.
- [KIP-320 — Allow fetchers to detect and handle log truncation](https://cwiki.apache.org/confluence/display/KAFKA/KIP-320:+Allow+fetchers+to+detect+and+handle+log+truncation): source of the `UNKNOWN_LEADER_EPOCH` / `FENCED_LEADER_EPOCH` fetch error codes.
- [`LeaderEpochCheckpointFile.java`](https://github.com/apache/kafka/blob/trunk/storage/src/main/java/org/apache/kafka/storage/internals/checkpoint/LeaderEpochCheckpointFile.java) and [`LeaderEpochFileCache.java`](https://github.com/apache/kafka/blob/trunk/storage/src/main/java/org/apache/kafka/storage/internals/epoch/LeaderEpochFileCache.java): reads, writes, and interprets the checkpoint file.
- [`UnifiedLog.java` (UnexpectedAppendOffsetException)](https://github.com/apache/kafka/blob/trunk/storage/src/main/java/org/apache/kafka/storage/internals/log/UnifiedLog.java#L1190-L1208): where a bad truncate offset becomes a hard fetcher failure.
- [`AbstractFetcherThread.scala`](https://github.com/apache/kafka/blob/trunk/core/src/main/scala/kafka/server/AbstractFetcherThread.scala): [`truncateToEpochEndOffsets`](https://github.com/apache/kafka/blob/trunk/core/src/main/scala/kafka/server/AbstractFetcherThread.scala#L200-L229), [`UNKNOWN_LEADER_EPOCH` retry](https://github.com/apache/kafka/blob/trunk/core/src/main/scala/kafka/server/AbstractFetcherThread.scala#L422-L425), and [`markPartitionFailed`](https://github.com/apache/kafka/blob/trunk/core/src/main/scala/kafka/server/AbstractFetcherThread.scala#L494-L501).
- [KAFKA-13077](https://issues.apache.org/jira/browse/KAFKA-13077): real, open, relevant as an illustration of unclean-shutdown replication failure; not `__transaction_state`-specific.

**Correction note:** an earlier draft of this post cited KAFKA-13077 as if it documented the `__transaction_state`-specific scenario directly. It doesn't. It documents the general unclean-shutdown replication failure family. That citation has been narrowed above, and KIP-101 / KIP-320 added as the primary sources for why the checkpoint and epoch mechanism, and the `UNKNOWN_LEADER_EPOCH` error, exist in the first place.
