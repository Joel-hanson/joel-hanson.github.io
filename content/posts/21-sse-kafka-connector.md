---
title: "SSE Kafka Connector: Stream Real-time Events into Kafka"
date: 2025-08-27T21:15:47+05:30
draft: false
tags:
  [
    "Kafka",
    "SSE",
    "Connector",
    "Open Source",
    "Java",
    "Real-time Data",
    "Event Streaming",
  ]
categories: ["Apache Kafka", "Data Streaming"]
author: "Joel Hanson"
description: "Learn how to stream Wikipedia changes, GitHub events, and financial data into Kafka using this open-source SSE Kafka Connector - no custom code required."
keywords:
  [
    "Server-Sent Events",
    "Kafka Connect",
    "SSE Connector",
    "Real-time data pipeline",
    "Kafka streaming",
    "Event-driven architecture",
    "Wikipedia streaming",
    "GitHub events",
    "Open source connector",
  ]
---

## The Problem: Getting Real-time Data into Kafka

Have you ever tried to stream Wikipedia changes or other real-time Server-Sent Events (SSE) updates into Kafka? If you have, you probably wrote custom Kafka producer and consumer code to handle these events, managed reconnections, and built your own error handling.

**There had to be a better way.**

## Introducing the SSE Kafka Connector

I'm excited to share my new open-source project: a **generic Kafka Connect connector for Server-Sent Events**. It lets you stream data from any SSE endpoint straight into Kafka topics—no custom code required.

## <!-- Repo link -->

> ### [Github Repository](https://github.com/Joel-hanson/sse-kafka-connector)

![SSE Kafka Connector Flow](/images/21-sse-kafka-connector/image.png)

## What Can You Do With It?

### Stream Wikipedia Changes

```json
{
  "sse.url": "https://stream.wikimedia.org/v2/stream/recentchange",
  "data.format": "json",
  "topic.strategy": "static",
  "kafka.topic": "wiki-changes"
}
```

Watch page edits, detect vandalism, or track trends across Wikipedia in real-time.

### Monitor GitHub Events

```json
{
  "sse.url": "https://github-events-proxy.example.com/events",
  "sse.headers": "Authorization:Bearer YOUR_TOKEN",
  "topic.strategy": "field",
  "topic.field": "$.repository.name"
}
```

Get notified about new issues, commits, and PRs as they happen.

### Track Financial Updates

```json
{
  "sse.url": "https://market-data.example.com/stocks",
  "json.key.field": "$.symbol",
  "json.value.fields": "$.price,$.change",
  "kafka.topic": "stock-updates"
}
```

Stream market data for real-time analytics and alerts.

## See It in Action

```bash
# Start the Docker environment
docker-compose up -d

# Deploy the connector with Wikimedia config
curl -X POST -H "Content-Type: application/json" \
  --data @config/json/wikimedia-sse-connector.json \
  http://localhost:8083/connectors

# Watch the data flow into Kafka
docker exec kafka kafka-console-consumer \
  --bootstrap-server kafka:9092 \
  --topic wikimedia-changes --from-beginning
```

## How It Works

The connector:

1. Establishes a connection to any SSE endpoint
2. Filters events based on what you're interested in
3. Processes the data (JSON, XML, plain text)
4. Routes events to the right Kafka topics

## Why I Built This

I wanted a simple, reusable way to integrate SSE streams with Kafka without reinventing the wheel each time. This connector abstracts away the complexity, letting you focus on building applications instead of plumbing. Also I wanted to tryout real world event streaming usecases with Kafka Connect especially the wikimedia stream which is a great source of real time data.

## Try It Today

Ready to simplify your event streaming? Check out the [GitHub repository](https://github.com/Joel-hanson/sse-kafka-connector) and give it a star if you find it useful!

Questions or ideas? Open an issue or contribute to the project. I'd love to hear how you're using it.

---

## Stay Connected

- **Blog**: [https://joel-hanson.github.io/](/)
- **GitHub**: [Joel-hanson](https://github.com/Joel-hanson)
- **LinkedIn**: [Joel-hanson](https://www.linkedin.com/in/joel-hanson/)

_For more Kafka Connect tips and open-source tools, follow the [blog series](https://joel-hanson.github.io/posts/) and star the [repository](https://github.com/Joel-hanson/sse-kafka-connector)._
