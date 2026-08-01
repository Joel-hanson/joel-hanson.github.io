---
title: "Delete logs older than 7 days with find"
date: 2024-02-28
draft: false
discoveryType: snippet
summary: "find + -mtime + -delete is safer than a recursive rm when you scope the path."
tags: ["Unix", "CLI"]
codeLang: bash
code: |
  find /var/log/myapp -type f -name "*.log" -mtime +7 -print
  # review the list, then:
  find /var/log/myapp -type f -name "*.log" -mtime +7 -delete
relatedPost: "/posts/04-mastering-the-find-command-unleashing-unix-file-management-power/"
---

Always `-print` first. `-delete` only after you’ve confirmed the match set.
