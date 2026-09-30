---
title: "Dogpile / cache stampede protection"
date: 2026-09-30
draft: false
discoveryType: snippet
summary: "When a hot key expires, only one client should recompute. Everyone else waits or uses stale."
tags: ["Caching", "Distributed Systems", "SRE"]
codeLang: text
code: |
  Patterns:
    1. Mutex / lock around recompute (single-flight)
    2. Stale-while-revalidate (serve old, refresh in background)
    3. Probabilistic early expiration (jitter who refreshes first)

  Related: thundering herd on the cache miss path
---

**Scenario:** Product page cache key expires under Black Friday load. Without protection, every edge node hits the DB for the same SKU. With a lock or single-flight: one recomputes, others block briefly or keep serving stale. Same idea as stampede protection in Redis/memcached clients.
