---
title: "Filtering Tombstone Records in Kafka Connect"
date: 2025-03-11T12:19:08+05:30
description: "Learn how to properly configure Kafka Connect to drop tombstone records using the Filter transformation and predicates."
tags: ["Kafka Connect", "SMT", "Filter", "Predicates"]
categories: ["Kafka"]
---

Kafka Connect provides a flexible way to process streaming data using Single Message Transforms (SMTs). If you need to filter out tombstone records (records with `null` values), you should use the generic **Filter** transformation along with the **RecordIsTombstone** predicate.

Here’s the correct configuration:

```properties
# Define the predicate to detect tombstone records (i.e., records with null values)
predicates=dropTombstone
predicates.dropTombstone.type=org.apache.kafka.connect.transforms.predicates.RecordIsTombstone

# Configure the Filter transformation to drop records that match the predicate
transforms=dropTombstone
transforms.dropTombstone.type=org.apache.kafka.connect.transforms.Filter
transforms.dropTombstone.predicate=dropTombstone
```

## Explanation

### What is a Predicate?
A **predicate** in Kafka Connect is a condition that evaluates whether a given record meets certain criteria. It returns either `true` or `false`. If `true`, the transformation (such as filtering) is applied. In this case, the predicate named `dropTombstone` uses the built-in class `RecordIsTombstone`, which evaluates to `true` when a record’s value is `null`.

#### Predicate Setup
The predicate named `dropTombstone` uses the built-in class `RecordIsTombstone`, which evaluates to `true` when a record’s value is `null`.

### What is the Filter Transformation?
The **Filter** transformation allows records to be selectively included or excluded based on a predicate. If a record satisfies the specified predicate (i.e., evaluates to `true`), the **Filter** transformation removes it from the stream. This is useful for cleaning up unnecessary records before they reach downstream systems.

#### Filter Transformation
The **Filter** SMT is configured to drop any record for which the predicate evaluates to `true`, ensuring that tombstone records are filtered out before they reach downstream systems.

### How It Works in This Configuration
1. The `dropTombstone` predicate detects tombstone records (null values) in Kafka topics.
2. The **Filter** SMT is configured to drop any record where the predicate evaluates to `true`, effectively filtering out tombstone records.

![Filtering Tombstone Records in Kafka Connect](/images/tombstone-smt.jpg "Filtering Tombstone Records in Kafka Connect")

This setup aligns with the Kafka Connect documentation on predicates and transformations, allowing you to handle tombstone records effectively in your data pipeline.

