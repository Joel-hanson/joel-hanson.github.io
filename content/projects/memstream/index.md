---
title: "Memstream"
date: 2026-08-14
draft: false
featured: true
weight: 7
category: "platform"
summary: "Turn CockroachDB writes into searchable agent memory — embeddings stay in the same database."
outcome: "Changefeed → Bedrock → MCP search · no separate vector DB"
tags: ["MCP", "CockroachDB", "AI", "TypeScript", "AWS"]
featureimage: "img/posts/memstream.png"
---

Apps already write rows to CockroachDB. Agents can query those tables with SQL or Cockroach MCP, but stitching lookups into a timeline of *what happened* is still awkward.

**Memstream** watches table changes via changefeeds, turns selected columns into plain sentences, embeds them with AWS Bedrock, and stores the vectors back in CockroachDB next to your app tables. Agents search that memory over MCP (`search_memory`). There is no separate vector database.

**Links:** [GitHub](https://github.com/Joel-hanson/memstream)
