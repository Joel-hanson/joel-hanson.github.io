---
title: "Reduce Kafka Integer Payload Size with Bijou Serializers"
date: 2026-06-06
updated: 2026-09-29
ctaProjects:
  - "bijou64"
aliases:
  - "/posts/shrink-kafka-integer-payloads-with-bijou64/"
summary: "Kafka LongSerializer always writes 8 bytes. Bijou encodes the same integers in fewer bytes for common counters and IDs (Bijou64 often lands around 3-4). Value payloads on sequential ints shrink by roughly 54-62%; full TCP captures closer to ~20%. Maven Central, drop-in SerDes."
tags:
  - Kafka
  - Java
  - Performance
  - Serialization
  - Open Source
categories:
  - Kafka
  - Developer Tools
featureimage: "img/covers/bars.svg"
showHero: true
heroStyle: "background"
imagePosition: "center"
---

{{< video src="/videos/bijou64-network.mp4" poster="/videos/bijou64-network.jpg" autoplay="true" muted="true" loop="true" caption="Same readings. Less on the wire." >}}

If you use Kafka to send numbers (like counters, IDs, or sequence numbers), the default `LongSerializer` always sends 8 bytes—even for small numbers like `1`.

That is fine until the topic is hot. Then those fixed-width longs show up in broker disk, replication, and egress.

I wrapped Ink & Switch's [bijou](https://github.com/inkandswitch/bijou) encodings as a Java library with Kafka SerDes. The idea is the same as their [bijou64 write-up](https://www.inkandswitch.com/tangents/bijou64/): variable length, one canonical encoding per value, swap the serializer and keep your `Long` (or `Integer` / `BigInteger`) app code.

**Repo:** [github.com/Joel-hanson/bijou](https://github.com/Joel-hanson/bijou) · **Maven Central:** `io.github.joel-hanson:bijou-kafka-serializers:0.4.1`

(Older `bijou64-kafka-serializers` stops at 0.3.0. Java package is still `org.bijou64`.)

## How the encoding works

For bijou64, values `0..247` are a single byte. From `248` up, a tag (`F8`..`FF`) says how many payload bytes follow; the payload is big-endian `(value - offset)` so each size range is unique.

|           Value | LongSerializer |                           Bijou64 |
| --------------: | -------------: | --------------------------------: |
|              42 |            8 B |                        1 B (`2A`) |
|             300 |            8 B |                     2 B (`F8 34`) |
|       1_000_000 |            8 B |                               4 B |
| near `u64::MAX` |            8 B |                           9 B (only here Bijou64 is larger) |

> On decode, check the first byte. If it is under 248 (`0xF8`), that single byte _is_ the number. If it is 248 or higher, it is a tag that says how many more bytes follow.

From **0.4.1** the library is a small family, not only Bijou64:

| Codec                                 | Java type                     |  Max bytes | Notes                                      |
| ------------------------------------- | ----------------------------- | ---------: | ------------------------------------------:|
| `Bijou32` / `Bijou64` / `Bijou128`    | `int` / `long` / `BigInteger` | 5 / 9 / 17 | unsigned on the wire                       |
| `Bijou32s` / `Bijou64s` / `Bijou128s` | same, signed                  | 5 / 9 / 17 | zigzag first so small negatives stay short |

Widths are not interchangeable on the wire. Pick one format per topic (or field) and use matching SerDes on both ends.

## What actually shrinks

For sequential integers from 1 to N, the average value shrinks from 8.0 bytes to about 3.0-3.7 bytes (about 54-62% smaller). Full TCP captures only drop about 20%, because keys and Kafka framing still take space.

Millisecond timestamps (around `1.7×10¹²`) take about 7 bytes with Bijou64. Still under 8, just not the cute 1-byte demo. Counters and sequences get the big savings.

Plain `Bijou64` treats Java `long` bits as unsigned. Negatives still round-trip, but they look huge on the wire and cost 9 bytes. Use `Bijou64s` (zigzag) when you need signed values that stay compact.

## When it is worth it

Use it when values are mostly integers, volume is high, and you own producer and consumer.

Skip it for JSON / Avro / Protobuf payloads (turn on Kafka compression first), or if you cannot change both ends. Existing `LongSerializer` topics need a coordinated cutover or a new topic.

## Drop it into Kafka

```xml
<dependency>
  <groupId>io.github.joel-hanson</groupId>
  <artifactId>bijou-kafka-serializers</artifactId>
  <version>0.4.1</version>
</dependency>
```

```properties
value.serializer=org.bijou64.kafka.serialization.Bijou64Serializer
value.deserializer=org.bijou64.kafka.serialization.Bijou64Deserializer
```

Same package for the siblings (`Bijou32Serializer`, `Bijou64sSerializer`, `Bijou128Serializer`, …).

There are two implementations under the hood: a pure Java encoder, and a native JNI path that calls the original [bijou](https://github.com/inkandswitch/bijou) package. I added both so I could compare performance, and both stayed. Native is the default when the library loads; set `bijou.useJava=true` to force Java. If the native library is missing, Java is used anyway.

```java
byte[] encoded = Bijou64.encode(300L); // F8 34
long value = Bijou64.decode(encoded);
```

Quick local demo:

```bash
cd examples/kafka-counter-app
mvn -B package && docker compose up -d
mvn exec:java -Dexec.mainClass=org.bijou64.examples.kafka.CounterProducer
```

## Numbers from CI

From a recent [CI producer run](https://github.com/Joel-hanson/bijou/actions/runs/36611281765) (sequential ints, no compression):

| Mode | Avg payload | Messages / sec |
| ---- | ----------: | -------------: |
| `LongSerializer` | 8.0 B | 91,442 |
| Bijou64 | 3.0 B | 95,181 |
| Bijou32 | 3.0 B | 105,055 |

Same integer values. About 62% less payload for Bijou vs Long. Throughput is in the same ballpark; Bijou32 edged ahead on this runner.

{{< chart >}}
type: 'bar',
data: {
  labels: ['LongSerializer', 'Bijou64', 'Bijou32'],
  datasets: [{
    label: 'Avg payload (bytes)',
    data: [8.0, 3.0, 3.0],
    backgroundColor: [
      'rgba(148, 163, 184, 0.7)',
      'rgba(34, 197, 94, 0.7)',
      'rgba(34, 197, 94, 0.5)'
    ],
    borderWidth: 0
  }]
},
options: {
  plugins: {
    title: {
      display: true,
      text: 'Average Kafka value size (sequential ints, no compression)'
    },
    legend: { display: false }
  },
  scales: {
    y: {
      beginAtZero: true,
      title: { display: true, text: 'bytes' }
    }
  }
}
{{< /chart >}}

{{< chart >}}
type: 'bar',
data: {
  labels: ['LongSerializer', 'Bijou64', 'Bijou32'],
  datasets: [{
    label: 'Messages / sec',
    data: [91442, 95181, 105055],
    backgroundColor: [
      'rgba(148, 163, 184, 0.7)',
      'rgba(59, 130, 246, 0.7)',
      'rgba(59, 130, 246, 0.5)'
    ],
    borderWidth: 0
  }]
},
options: {
  plugins: {
    title: {
      display: true,
      text: 'Producer throughput (same run)'
    },
    legend: { display: false }
  },
  scales: {
    y: {
      beginAtZero: true,
      title: { display: true, text: 'msg/s' }
    }
  }
}
{{< /chart >}}

Absolute rates depend on the machine and harness, so treat these as a rough shape, not a promise.

To reproduce: `perf/kafka` plus `./scripts/compare-benchmarks.sh`. For encode-only timing: `./scripts/run-jmh.sh`.

{{< video src="/videos/bijou64-after.mp4" poster="/videos/bijou64-after.jpg" autoplay="true" muted="true" loop="true" caption="After. Small numbers stay small." >}}

## Bottom line

For mixed payloads, turn on Kafka compression first. For integer-heavy topics, you are often sending 8-byte values that never needed 8 bytes, then compressing them anyway. Bijou shrinks them at the serializer instead.

The wire formats come from [Ink & Switch](https://www.inkandswitch.com/). This repo is the Java / Kafka layer. If it helps, star [the repo](https://github.com/Joel-hanson/bijou).
