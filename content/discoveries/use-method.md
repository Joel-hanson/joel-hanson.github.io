---
title: "USE method for resource checks"
date: 2026-09-29
draft: false
discoveryType: snippet
summary: "Brendan Gregg’s USE: Utilization, Saturation, Errors — ask all three for every resource."
tags: ["SRE", "Performance", "Debugging"]
codeLang: text
code: |
  For CPU / mem / disk / net / pools:

    Utilization  — how busy is it? (% busy, used/capacity)
    Saturation   — is work queued? (run queue, await, backlog)
    Errors       — is it failing? (retransmits, OOM, 5xx)

  High util + low saturation  → busy but keeping up
  High util + high saturation → bottleneck
  Errors                     → fix correctness before tuning
---

**Scenario:** “Is the DB slow?” Check CPU USE, disk USE, connection-pool USE separately. Pool at 100% util with a wait queue (saturation) while disk is quiet usually means you’re connection-starved, not I/O-bound. Pair with RED (Rate, Errors, Duration) for the service view.
