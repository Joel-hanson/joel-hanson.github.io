---
title: "Abbreviated IPv4 expansion via inet_aton"
date: 2026-09-21
draft: false
discoveryType: snippet
summary: "Why curl 127.1 resolves to 127.0.0.1: BSD inet_aton treats a.b as class A (8.24 bits)."
tags: ["Networking", "C", "CLI"]
codeLang: c
code: |
  #include <stdio.h>
  #include <arpa/inet.h>

  int main(void) {
      struct in_addr addr;
      // "127.1" -> 127.0.0.1, "0177.1" -> 127.0.0.1, "1.0" -> 1.0.0.0
      if (inet_aton("127.1", &addr)) {
          printf("Resolved: %s\n", inet_ntoa(addr));
      }
      return 0;
  }
externalUrl: "https://github.com/apple-oss-distributions/Libc/blob/main/net/FreeBSD/inet_addr.c"
---

Legacy BSD `inet_aton()` supports 1, 2, 3, or 4 parts: in `a.b`, `b` is evaluated as the lower 24-bit host number `(a << 24) | b`. Octal (`0177.1`) and hex (`0x7f.1`) prefixes work too.
