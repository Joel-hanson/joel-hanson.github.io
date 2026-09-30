---
title: "du when df looks fine"
date: 2026-09-26
draft: false
discoveryType: snippet
summary: "df is the filesystem. du walks directories. Deleted-but-open files show in df, not under du."
tags: ["Linux", "CLI", "Disk"]
codeLang: bash
code: |
  df -h /var
  du -xh /var --max-depth=1 | sort -h

  # Biggest offenders under a tree
  du -xh /var/log | sort -h | tail -20

  # Space held by deleted open files (df high, du low):
  lsof +L1 | head
  # restart the process holding the FD, or truncate the path if it still exists
---

**Scenario:** `/var` is 95% full. `du` on `/var/log` doesn’t add up to `df`. A long-running Java process rotated logs with `rm` while keeping the FD open — disk stays full until restart. Find it with `lsof +L1`.
