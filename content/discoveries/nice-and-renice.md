---
title: "nice and renice for noisy neighbors"
date: 2026-09-25
draft: false
discoveryType: snippet
summary: "nice is CPU scheduling priority (−20 urgent … 19 meek). It does not cap memory or I/O by itself."
tags: ["Linux", "CLI"]
codeLang: bash
code: |
  # Start a batch job that shouldn’t steal CPU from the API
  nice -n 19 python /opt/jobs/reindex.py

  # Already running? bump it down
  renice -n 10 -p $(pgrep -n reindex.py)

  # Check: NI column in top / ps
  ps -o pid,ni,comm -p $(pgrep -n reindex.py)
---

**Scenario:** Nightly compaction fights daytime traffic. Wrap it in `nice -n 19` so interactive workers win CPU contention. For disk-heavy jobs pair with `ionice`; nice alone won’t stop an I/O storm.
