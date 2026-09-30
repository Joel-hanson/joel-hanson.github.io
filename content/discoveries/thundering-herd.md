---
title: "Thundering herd on wakeups and retries"
date: 2026-09-30
draft: false
discoveryType: snippet
summary: "Too many waiters wake for one event — or too many clients retry at once. Waste, then collapse."
tags: ["Distributed Systems", "SRE", "Caching"]
codeLang: text
code: |
  Classic forms:
    - Many threads wake on one socket/event (OS)
    - Cache expires → all clients miss together
    - Outage ends → everyone reconnects / retries

  Mitigations:
    - Wake one waiter (epoll, leader-follower)
    - Jittered exponential backoff
    - Queue / lease / token so only N proceed
    - Request coalescing
---

**Scenario:** Cache TTL hits midnight; 10k pods miss Redis and stampede the origin. Origin melts, retries amplify. Stagger TTLs, single-flight the refresh, or serve stale while one worker recomputes — that’s the dogpile fix for the cache form of the herd.
