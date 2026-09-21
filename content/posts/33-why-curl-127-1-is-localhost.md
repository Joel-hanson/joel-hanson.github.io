---
title: "Why curl 127.1 Is the Same as curl 127.0.0.1"
date: 2026-09-21T21:00:00+05:30
draft: false
summary: "curl 127.1 lands on 127.0.0.1 because BSD inet_aton() still accepts abbreviated IPv4 — a.b is 8+24 bits, and hex, octal, and bare integers parse the same way."
description: "A walkthrough of why curl 127.1, 0x7F.1, 0x7F000001, 2130706433, and 0177.1 all resolve to 127.0.0.1, traced from arpa/inet.h into Apple/FreeBSD inet_aton()."
tags:
  - Networking
  - C
  - CLI
  - IPv4
  - libc
categories:
  - Debugging
  - Systems
author: "Joel Hanson"
showHero: true
heroStyle: "basic"
imagePosition: "center"
featureimage: "img/posts/abbreviated-ipv4-curl.jpg"
---

I typed `curl 127.1` while debugging an application and it still talked to localhost. Same machine as `curl 127.0.0.1`. That was weird enough to chase.

On macOS (and other BSD-descended systems) that string is not going through DNS as a hostname. Once the parser sees a `.`, it treats the input as an IPv4 address and runs the old `inet_aton()` rules. Those rules still allow abbreviated forms.

## What "abbreviated" means

A dotted IPv4 string can have 1, 2, 3, or 4 parts. The last part absorbs whatever bits are left in the 32-bit address:

| Form | Bit layout | Example input | Expands to |
|---|---|---|---|
| `a.b.c.d` | 8.8.8.8 | `8.8.8.8` | `8.8.8.8` |
| `a.b.c` | 8.8.16 | `8.8.16` | `8.8.0.16` |
| `a.b` | 8.24 | `8.24` | `8.0.0.24` |
| `a` | 32 | `2130706433` | `127.0.0.1` |

So for `127.1`:

```text
127 . 1
───   ─────────
8 bits  24-bit host number
```

`127` is the first octet. `1` fills the remaining 24 bits as `0.0.1`. Together that is `127.0.0.1`.

`127.0.1` is the three-part version: last piece is 16 bits, still `127.0.0.1`.

## Seeing it in curl

Ask curl for the remote IP it used, without dumping a response body:

```bash
curl -s -o /dev/null -w "%{remote_ip}\n" 127.1
curl -s -o /dev/null -w "%{remote_ip}\n" 0x7F.1
curl -s -o /dev/null -w "%{remote_ip}\n" 0x7F000001
curl -s -o /dev/null -w "%{remote_ip}\n" 2130706433
curl -s -o /dev/null -w "%{remote_ip}\n" 0177.1
```

All five print `127.0.0.1`:

![Five curl invocations with abbreviated, hex, decimal, and octal forms of localhost, each printing remote_ip 127.0.0.1](/images/33-abbreviated-ipv4/curl-abbreviated-ipv4.jpg "curl remote_ip for 127.1, 0x7F.1, 0x7F000001, 2130706433, and 0177.1")

Five spellings of the same 32-bit value:

| Input | How it is read |
|---|---|
| `127.1` | Decimal `a.b` → 8 + 24 bits |
| `0x7F.1` | Hex first octet (`0x7F` = 127), decimal host |
| `0x7F000001` | Single 32-bit hex integer |
| `2130706433` | Same value in decimal (`0x7F000001`) |
| `0177.1` | Octal first octet (`0177` = 127), decimal host |

Leading `0` means octal. Leading `0x` means hex. Same base rules C has used for decades; `inet_aton()` copies them.

## Where the behavior lives

I started from `<arpa/inet.h>`, then followed `inet_aton()` into the libc that ships on macOS. Apple's tree still carries the FreeBSD implementation:

[apple-oss-distributions/Libc `net/FreeBSD/inet_addr.c`](https://github.com/apple-oss-distributions/Libc/blob/main/net/FreeBSD/inet_addr.c)

After the parser has collected the dotted parts, the interesting bit is the `switch` on how many parts you gave it:

![Switch on part count in inet_aton: case 2 is a.b as 8.24 bits, case 3 is a.b.c as 8.8.16, case 4 is a.b.c.d as 8.8.8.8](/images/33-abbreviated-ipv4/inet-aton-switch.png "inet_aton switch on number of address parts")

For two parts (`127.1`), that is literally:

```c
case 2: /* a.b -- 8.24 bits */
    if (val > 0xffffffU)
        return (0);
    val |= parts[0] << 24;
    break;
```

`parts[0]` is `127`, shifted into the top byte. `val` still holds `1`. OR them, convert to network byte order, and you have `127.0.0.1`.

Three- and four-part forms do the same with 16-bit and 8-bit final pieces. One-part form means the whole address is already in `val`, which is why bare `2130706433` and `0x7F000001` work with no dots at all.

## Verify it with a tiny C program

curl is a convenient demo. The parser is easier to see alone:

```c
#include <stdio.h>
#include <arpa/inet.h>

int main(void) {
    const char *inputs[] = {
        "127.1",
        "0x7F.1",
        "0x7F000001",
        "2130706433",
        "0177.1",
        "8.8.16",
        "8.24",
        NULL
    };

    for (int i = 0; inputs[i] != NULL; i++) {
        struct in_addr addr;
        if (inet_aton(inputs[i], &addr)) {
            printf("%-14s -> %s\n", inputs[i], inet_ntoa(addr));
        } else {
            printf("%-14s -> FAIL\n", inputs[i]);
        }
    }
    return 0;
}
```

Compile and run:

```bash
cc -o inet_aton_demo inet_aton_demo.c
./inet_aton_demo
```

On macOS:

```text
127.1          -> 127.0.0.1
0x7F.1         -> 127.0.0.1
0x7F000001     -> 127.0.0.1
2130706433     -> 127.0.0.1
0177.1         -> 127.0.0.1
8.8.16         -> 8.8.0.16
8.24           -> 8.0.0.24
```

`inet_ntoa()` only prints the canonical dotted-quad. The expansion already happened inside `inet_aton()`.

## Why it bites

Usually this is a curiosity. Sometimes it is a footgun.

Allowlists that string-match `host == "127.0.0.1"` or `startswith("127.")` miss `127.1`, `0x7f.1`, and `2130706433`. If you need "is this loopback?", parse to an address and test the address. Do not pattern-match the original string.

Strict parsers and `inet_pton()` reject many of these forms. Loose parsers and BSD `inet_aton()` accept them. The same URL can look invalid in one layer and connect in another.

The comments in that file still describe classful layouts (`a.b` as 8.24). The internet moved on. The compatibility path did not.

I would not put `127.1` in a config on purpose. When a tool quietly accepts it, you are looking at libc history, not magic.

## Takeaway

`curl 127.1` works because the IPv4 parser never required four decimal octets. Abbreviated dotted forms, hex, octal, and a bare 32-bit integer are legal inputs to `inet_aton()`. On Apple/FreeBSD libc, `a.b` is still the first octet plus a 24-bit host number.

Full implementation: [`inet_addr.c` in Apple's Libc](https://github.com/apple-oss-distributions/Libc/blob/main/net/FreeBSD/inet_addr.c).
