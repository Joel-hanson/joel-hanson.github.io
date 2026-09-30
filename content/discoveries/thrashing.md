---
title: "Thrashing: busy CPU, no progress"
date: 2026-09-28
draft: false
discoveryType: snippet
summary: "Thrashing is when the machine spends its time swapping pages instead of running useful work."
tags: ["Linux", "Performance", "Memory"]
codeLang: bash
code: |
  free -h
  vmstat 1
  # si/so columns (swap in/out) climbing while apps crawl

  # Who is eating RSS?
  ps aux --sort=-%mem | head
---

**Scenario:** Load average is high, everything feels stuck. `vmstat` shows constant `si`/`so`; `iostat` shows swap device busy. The fix is reduce the working set (fewer replicas, smaller caches, kill the leak) or add RAM — tweaking CPU nice won’t help. Pathological cousin of resource contention: the system is fully utilized on the wrong work.
