---
title: "strace vs ltrace when a process hangs"
date: 2026-09-22
draft: false
discoveryType: snippet
summary: "strace = syscalls into the kernel. ltrace = library calls. Start with strace when the box is sick."
tags: ["Linux", "Debugging", "CLI"]
codeLang: bash
code: |
  # App stuck after deploy — is it waiting on the kernel?
  strace -p $(pgrep -n myapp) -f -e trace=network,file,desc

  # Or attach from start and follow children:
  strace -f -o /tmp/myapp.strace ./myapp

  # Library-level (malloc, pthread, libc):
  ltrace -p $(pgrep -n myapp) -e malloc+free+pthread_mutex_lock
---

**Scenario:** API latency spikes; CPU is idle. `strace` shows the worker blocked in `poll`/`recvfrom` on a DB socket — not a CPU bug. If `strace` is quiet but the process is busy, try `ltrace` for userspace lock contention.
