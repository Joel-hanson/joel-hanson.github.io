---
title: "The Connector That Kept Retrying and Never Said So"
date: 2026-07-30 10:00:00 +0530
draft: false
series: ["Kafka Connect"]
series_order: 8
summary: "A Kafka Connect MQ Sink looked healthy while messages never reached MQ — RetriableException loops in put() sit outside errors.retry.timeout. How we added mq.retry.timeout.ms so silent retries become visible failures."
description: "Why Kafka Connect errors.retry.timeout does not cover connector put() retries, and how mq.retry.timeout.ms on the IBM MQ Sink turns endless RetriableException loops into real task failures."
tags:
  - Kafka Connect
  - MQ
  - Troubleshooting
  - Retries
  - Java
categories:
  - Kafka
  - Debugging
author: "Joel Hanson"
featureCode: |
  } catch (final RetriableException rte) {
      if (firstFailureTime == null) {
          firstFailureTime = System.nanoTime();
      }

      final long elapsedMs =
          (System.nanoTime() - firstFailureTime) / 1_000_000L;
      if (elapsedMs >= errorRetry) {
          firstFailureTime = null;
          throw new ConnectException(
              "Retry timeout of " + errorRetry + "ms exceeded. Killing task.",
              rte);
      }

      context.timeout(retryBackoffMs);
      throw rte;
  }
featureCodeFile: "MQSinkTask.java"
featureCodeLang: "java"
featureCodeMaxLines: 12
showHero: true
heroStyle: "code"
imagePosition: "center"
featureimage: "img/covers/29-the-connector-that-kept-retrying-and-never-said-so.svg"
---

A customer reported that their Kafka Connect MQ Sink connector looked completely healthy — no errors on the connector CR, no failed tasks — but no messages were reaching MQ. This had been going on for hours.

The logs told a different story: an MQ authentication failure, retried continuously, never escalated to the connector level.

The customer had already tried the usual levers — tuning the retry backoff, setting `errors.tolerance` to get the framework to give up after a while. Neither changed anything. They also opened a case with Confluent, who confirmed the underlying issue: `errors.retry.timeout` only governs the framework-managed stages of Kafka Connect (converters, SMTs). It has no visibility into a connector's own `put()` method. If `put()` throws a `RetriableException` without enforcing its own limit, Kafka Connect will keep redelivering the same batch indefinitely.

### Why the timeout never kicked in

`RetryWithToleranceOperator` — the class Kafka Connect uses to enforce `errors.retry.timeout` — only wraps the ingestion-side stages: consumer record extraction, key/value conversion, header transformation. `task.put()` runs outside that wrapper entirely, so nothing in the framework is tracking how long it's been failing.

Here's what was actually happening on every cycle:

```
Kafka Connect
     │
     │ put(records)
     ▼
┌─────────────┐  RetriableException   ┌──────────────────────┐
│  put(recs)  │──────────────────────▶│ context.timeout(60s)  │
└─────────────┘                       └──────────┬───────────┘
                                                  │
                                                  ▼
                                      context reset to -1
                                      (so it doesn't leak into
                                       future healthy batches)
                                                  │
                                                  ▼
                                    Connect wakes up after 60s,
                                    treats this as a fresh attempt
                                                  │
                                                  ▼
                                    same MQ auth failure recurs
                                    → back to put(records)
```

Each loop looks like the first attempt, because nothing carries elapsed time across executions. `errors.retry.timeout` never has a chance to trip.

### The fix

We added a new connector-level property, `mq.retry.timeout.ms`, that tracks the connector's own elapsed failure window instead of relying on the framework to do it:

| Property | Type | Default | Description |
|---|---|---|---|
| `mq.retry.timeout.ms` | `long` | `300000` | Max time to keep retrying after the first failure. `-1` disables the limit (previous behavior). |
| `mq.retry.backoff.ms` | `long` | `60000` | Existing setting — delay between retry attempts. |

The logic: on the first `RetriableException`, the task records a start time. Each subsequent failure checks the elapsed time against `mq.retry.timeout.ms`. Once that window is exceeded, the task throws a `ConnectException` instead of retrying again. That kills the task and surfaces it as a failure you can actually see, instead of a silent loop.

Shipped here: [ibm-messaging/kafka-connect-mq-sink#85](https://github.com/ibm-messaging/kafka-connect-mq-sink/pull/85)

### Takeaway

A connector reporting "healthy" only means the task hasn't crashed. It says nothing about whether it's making progress. If a sink connector can throw `RetriableException` from `put()`, the connector needs to own its own retry ceiling. The framework's `errors.*` configs won't do it for you.

### Further reading

- [Error/Retry Configuration in Kafka Connect](https://atchison.dev/error-retry-configuration-in-kafka-connect/)
- [Delayed retry mechanism in sink connector — Confluent Community Forum](https://forum.confluent.io/t/delayed-retry-mechanism-in-sink-connector/9191)
