---
title: "Reading iostat under load"
date: 2026-09-24
draft: false
discoveryType: snippet
summary: "%util and await tell different stories. High util + high await = disk is the bottleneck."
tags: ["Linux", "Performance", "CLI"]
codeLang: bash
code: |
  iostat -xz 1

  # %user / %system  — CPU in userspace vs kernel
  # %iowait         — CPU idle waiting on I/O (often disk-bound work)
  # await           — avg ms per I/O (queue + service)
  # %util           — % of time the device had work
---

**Scenario:** App “CPU is fine” but P99 is awful. `iostat -xz 1` shows `%iowait` up, `await` in hundreds of ms, `%util` near 100. That’s storage saturation, not a missing index in the app alone. Cache vs buffers (`free -h`): page cache speeds reads; buffers are block-device staging. More RAM for cache helps until the working set fits.
