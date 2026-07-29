---
title: "SSE Kafka Connector"
date: 2025-04-01
draft: false
featured: true
weight: 11
category: "platform"
summary: "Kafka Connect source that turns Server-Sent Events streams into Kafka topics — used in Event Streams demos."
tags: ["Kafka Connect", "SSE", "Java"]
---

**Problem:** Many systems push live updates over Server-Sent Events, but Kafka Connect needs a proper source to land that data on topics with Connect’s runtime, config, and failure handling.

**What it is:** A Kafka Connect source connector that consumes SSE streams and writes events into Kafka topics.

**Why it matters:** Adopted in IBM Event Streams demo and customer-briefing setups — a concrete bridge from web-style event feeds into the streaming platform.

**Links:** [GitHub](https://github.com/Joel-hanson/sse-kafka-connector) · [Blog post](/posts/21-sse-kafka-connector/)
