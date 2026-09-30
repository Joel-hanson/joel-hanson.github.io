---
title: "Inodes vs file descriptors"
date: 2026-09-23
draft: false
discoveryType: snippet
summary: "Inode = the file on disk. FD = your process’s open handle to it. One inode, many FDs."
tags: ["Linux", "Filesystems"]
codeLang: bash
code: |
  # Same file, two opens → one inode, two FDs
  echo hello > /tmp/demo.txt
  exec 3<>/tmp/demo.txt
  exec 4<>/tmp/demo.txt
  ls -li /tmp/demo.txt          # inode number
  ls -l /proc/$$/fd/3 /proc/$$/fd/4
  # both point at the same inode; closing FD 3 doesn’t delete the file

  # “Too many open files” is an FD limit (ulimit -n), not inode exhaustion
  # Disk full of tiny files / no free inodes: df -i
---

**Scenario:** Service fails with `EMFILE`. `lsof -p <pid> | wc -l` climbs; sockets or log handles weren’t closed. Fix the leak or raise `nofile`. Separate failure: `df -h` shows free space but writes fail — `df -i` shows inode table full.
