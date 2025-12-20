---
title: "Stream Wars: A Simple Game to Explain Kafka"
date: 2025-12-19T12:00:00+05:30
draft: false
ShowToc: false
summary: "I built Stream Wars as a tiny tap game to demo how Kafka works, by turning every tap in the browser into a real Kafka event you can inspect."
tags:
  [
    "Kafka",
    "WebSockets",
    "Real-time",
    "Event Streaming",
    "Next.js",
    "Redis",
    "Demo",
    "Game Development",
  ]
categories: ["Apache Kafka", "Real-time Applications"]
author: "Joel Hanson"
description: "Learn how Kafka works through a simple multiplayer tap game where every tap becomes a Kafka event you can see and inspect in real-time."
keywords:
  [
    "Kafka demo",
    "Event streaming",
    "Real-time game",
    "Kafka events",
    "WebSocket",
    "Next.js",
    "Event-driven architecture",
    "Kafka tutorial",
  ]
---

I started **Stream Wars** as a demo project to explain how **Kafka** works using something more fun than log lines.

Instead of having a producer script send fake JSON into a topic, every tap in the browser becomes a **real event** that flows through Kafka, Redis, and back to the UI in real time.

![Stream Wars](/images/25-stream-wars/stream-wars.png)
*Stream Wars - a simple game to explain Kafka*

## Why I Built It

The goal was to show three things:

- How **frontend actions** (taps) become **Kafka events**
- How topics are designed around **use-cases**, not tables
- How you can **see** those events both in the UI and in Kafka tooling

So I ended up with three main topics:

- `game-taps` – every tap from a player (userId, team, timestamp, sessionId)
- `game-updates` – processed game state (team scores, total taps, leaderboard)
- `user-metadata` – connection metadata (browser, IP, language) for analytics

## How a Tap Becomes an Event

The flow is deliberately simple:

1. The browser sends a POST to `/api/tap` when you tap.
2. The Next.js API publishes a message to the **`game-taps`** topic.
3. A Kafka **consumer** reads `game-taps`, updates Redis (scores, totals, user taps).
4. The consumer publishes a summarized state to **`game-updates`**.
5. A WebSocket server pushes that update to every connected client.

From Kafka's point of view, it's just:

- One **producer** writing tap events
- One **consumer** updating state
- One **real-time fan-out** via WebSockets

The nice part is that you can open the game in your browser, start tapping, and at the same time run:

```bash
docker exec -it kafka ./opt/kafka/bin/kafka-console-consumer.sh \
  --bootstrap-server localhost:9092 \
  --topic game-taps \
  --from-beginning
```

You literally see your taps as Kafka events in the terminal.

## The Architecture

```
┌─────────────┐    ┌─────────────┐    ┌─────────────┐
│   Browser   │    │   Next.js   │    │   Kafka     │
│   (Taps)    │───►│   Producer  │───►│  game-taps  │
└─────────────┘    └─────────────┘    └─────────────┘
                                              │
                                              ▼
                                      ┌─────────────┐
                                      │  Consumer   │
                                      │  (Updates   │
                                      │   Redis)    │
                                      └─────────────┘
                                              |
                                              ▼
                                      ┌─────────────┐
                                      │  WebSocket  │
                                      │  Broadcast  │
                                      └─────────────┘
```

## Try It Yourself

### Start the Game

```bash
# Clone and start
git clone https://github.com/joel-hanson/stream-wars
cd stream-wars
docker-compose up
```

Then open http://localhost:3000 and start tapping!

### Watch Events in Real-Time

In another terminal, watch the tap events flow:

```bash
# Watch game-taps topic
docker exec -it kafka ./opt/kafka/bin/kafka-console-consumer.sh \
  --bootstrap-server localhost:9092 \
  --topic game-taps \
  --from-beginning \
  --property print.key=true \
  --property print.timestamp=true
```

You'll see events like:

```json
{"userId":"abc123","username":"Player1","team":"blue","timestamp":1703001234567,"sessionId":"xyz"}
{"userId":"def456","username":"Player2","team":"red","timestamp":1703001234568,"sessionId":"abc"}
```

### Inspect Topics

```bash
# List all topics
docker exec -it kafka ./opt/kafka/bin/kafka-topics.sh \
  --bootstrap-server localhost:9092 \
  --list

# Check topic details
docker exec -it kafka ./opt/kafka/bin/kafka-topics.sh \
  --bootstrap-server localhost:9092 \
  --describe \
  --topic game-taps
```

## Key Learnings

### 1. Events as First-Class Citizens

Each tap is an **event** with:
- A unique ID
- A timestamp
- User context (userId, team, sessionId)

This makes it easy to replay, debug, and analyze later.

### 2. Single Source of Truth

Redis is the **authoritative state store**. The consumer:
- Reads tap events from Kafka
- Updates Redis atomically
- Broadcasts state via WebSocket

This eliminates race conditions and ensures accurate counts.

### 3. Decoupling Frontend and Backend

The frontend doesn't know about Kafka. It just:
- Sends HTTP requests
- Receives WebSocket updates

Kafka handles the event streaming behind the scenes.

## Using It as a Demo

This tiny game turned into a good way to:

- Explain **event-driven thinking** (state derived from a stream of taps)
- Talk about **idempotency and counting** (why Redis is the source of truth)
- Show how Kafka sits between a frontend and a backend without anyone noticing
- Demonstrate **real-time updates** across multiple clients

## The Tech Stack

- **Next.js 16** – Frontend and API routes
- **Kafka (KRaft mode)** – Event streaming (no Zookeeper needed!)
- **Redis** – Game state and leaderboard
- **WebSockets** – Real-time updates
- **TypeScript** – Type safety throughout

## Conclusion

Stream Wars shows that you don't need a complex system to demonstrate Kafka's power. Sometimes the best way to explain event streaming is to make it **tangible** – where every action you take becomes an event you can see.

If you want to try it or adapt it for your own demos, the code is here:

> ### [GitHub Repository](https://github.com/joel-hanson/stream-wars)

---

*For more Kafka tips and real-time application insights, follow the [blog series](/posts/)*

