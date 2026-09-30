---
title: "fork, exec, and syscalls vs function calls"
date: 2026-09-27
draft: false
discoveryType: snippet
summary: "fork copies the process; exec replaces the image. Function calls stay in userspace; syscalls cross into the kernel."
tags: ["Linux", "Processes"]
codeLang: bash
code: |
  # Shell does roughly: fork → child execve("/bin/ls") → parent wait
  strace -f -e trace=clone,fork,vfork,execve ls /tmp

  # Function call: printf → libc (maybe buffered)
  # Syscall:      write(1, ...) actually hits the kernel
  # See the boundary:
  strace -e write python3 -c 'print("hi")'
---

**Scenario:** “Why does my supervisor show zombies?” Parent `fork`ed workers but never `wait`ed — children exited, slots remain until reaped. Syscall vs function call matters when debugging with `strace` (kernel boundary) vs `ltrace` (libc). A `malloc` is a function call; when the heap needs more memory it becomes a `brk`/`mmap` syscall.
