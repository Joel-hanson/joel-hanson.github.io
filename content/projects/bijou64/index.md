---
title: "Bijou"
date: 2026-06-06
draft: false
featured: true
weight: 5
category: "platform"
summary: "Variable-length integer encodings with drop-in Kafka serializers for Java."
outcome: "1–9 byte Longs on the wire · Bijou32/64/128 + zigzag"
tags: ["Kafka", "Java", "Encoding"]
featureimage: "img/posts/bijou64.png"
blogPost: "/posts/26-shrink-kafka-integer-payloads-with-bijou64/"
---

Kafka’s `LongSerializer` always writes 8 bytes. Bijou encodes the same integers in 1–9 bytes (often about 3–4 for common counters and IDs), with sibling codecs for 32- and 128-bit widths plus signed zigzag variants.

Java bindings for the [Ink & Switch bijoux](https://github.com/inkandswitch/bijou) family — Maven artifacts `bijou` / `bijou-kafka-serializers` (0.4+). Older `bijou64` artifacts stop at 0.3.0; the Java package remains `org.bijou64`.

**Links:** [GitHub](https://github.com/Joel-hanson/bijou) · [Blog post](/posts/26-shrink-kafka-integer-payloads-with-bijou64/)
