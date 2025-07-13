---
title: "Creating Tombstone Records Using kafka-console-producer.sh: A Quick Guide"
date: 2025-04-22T16:03:27+05:30
summary: "A practical guide to creating tombstone records for Kafka compacted topics using the kafka-console-producer.sh command-line tool with the null marker feature"
tags: ["Kafka", "Tombstone Records", "Log Compaction", "Kafka CLI", "Data Management"]
categories: ["Kafka"]
---

Tombstone records are a fundamental concept in Kafka, especially when working with compacted topics. These special records—consisting of a key and a null value—signal that a key should be removed during the compaction process. Let's explore how to create these tombstones using the Kafka console producer.

## What Are Tombstone Records?

A tombstone record in Kafka is simply a record with:

- A normal key (identifying which record to remove)
- A null value (signaling deletion)

When Kafka's log compaction runs, it sees these tombstones and removes all records with that key, including the tombstone itself (after a retention period).

## Creating Tombstones With kafka-console-producer.sh

[KIP-810](https://cwiki.apache.org/confluence/display/KAFKA/KIP-810) introduced a simple but powerful feature: the ability to explicitly mark values as null in the Kafka Console Producer using a special "null marker" string.

This feature allows you to directly produce records with null values from the command line, making operations like tombstoning much more straightforward.

The traditional challenge was that the console producer didn't have a straightforward way to specify null values. Thanks to the `null.marker` property, creating tombstones is now simple:

### Step 1: Start the Console Producer with Null Marker

```bash
bin/kafka-console-producer.sh --bootstrap-server localhost:9092 \
  --topic my-compacted-topic \
  --property parse.key=true \
  --property key.separator=: \
  --property null.marker=NULL
```

Let's break down these parameters:

- `--bootstrap-server`: Your Kafka broker address
- `--topic`: The target topic (typically a compacted topic)
- `parse.key=true`: Enables key-value parsing
- `key.separator=:`: Defines the character separating keys from values
- `null.marker=NULL`: Defines what string will be interpreted as a null value

### Step 2: Send Your Tombstone Records

Once the producer is running, you can send tombstone records by using your defined null marker:

```bash
# Format: key:value
user123:NULL
product456:NULL
order789:NULL
```

Each of these entries creates a tombstone record for the respective key.

## A Real-World Example

### Example 1: Tombstoning Records in a Compacted Topic

Let's see tombstones in action with a user database example:

```bash
# First, add some regular records
user1:{"name":"Alice","email":"alice@example.com"}
user2:{"name":"Bob","email":"bob@example.com"}
user3:{"name":"Charlie","email":"charlie@example.com"}

# Now, let's delete user2 with a tombstone
user2:NULL
```

After compaction runs, all records with the key "user2" will be removed from the topic.

Let's say you have a user-profiles topic that is compacted and contains the latest information about each user:

```bash
# Initial state of the topic
user1:{"name":"Alice","email":"alice@example.com"}
user2:{"name":"Bob","email":"bob@example.com"}
user3:{"name":"Charlie","email":"charlie@example.com"}
```

When a user deletes their account, you need to tombstone their record:

```bash
# Send a tombstone record to mark user456 for eventual deletion
user2:NULL
```

After compaction, user456's record will be removed entirely.

### Example 2: Clearing Values in a Schema Evolution Scenario

Imagine you're evolving your event schema and want to remove a field:

```bash
# Original records
order123:{"id":123,"customer":"Alice","deprecated_field":"value"}
order124:{"id":124,"customer":"Bob","deprecated_field":"value"}

# Clear the deprecated field with null
order123:{"id":123,"customer":"Alice","deprecated_field":null}
order124:{"id":124,"customer":"Bob","deprecated_field":null}
```

Using the console producer with null marker makes these operations simple.

## Verifying Your Tombstones

To confirm your tombstones were created correctly, you can consume from the topic with the `--from-beginning` flag and include null values:

```bash
bin/kafka-console-consumer.sh --bootstrap-server localhost:9092 \
  --topic my-compacted-topic \
  --from-beginning \
  --property print.key=true \
  --property print.value=true \
  --property key.separator=: \
  --property print.null.value=true
```

Note the important `print.null.value=true` parameter that ensures null values are displayed (typically as "null").

## Conclusion

Creating tombstone records from the Kafka console producer is straightforward with the null marker feature. This powerful capability lets you easily manage data deletion in compacted topics directly from the command line, making development and operational tasks much simpler.

Next time you need to clean up data in a compacted topic, remember this pattern—it's a clean, standard way to handle data removal in the Kafka ecosystem.

---

*For more Kafka Connect tips and open-source tools, follow the [blog series](/posts/)*
