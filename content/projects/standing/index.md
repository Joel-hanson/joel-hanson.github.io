---
title: "Standing"
date: 2026-10-15
draft: false
featured: true
weight: 10
category: "personal"
demoUrl: "https://joelhanson.com/standing/"
summary: "Quiet macOS menu bar app that watches desk posture and nudges you when you’ve sat too long."
tags: ["Side Project", "macOS", "Swift", "Python", "AI"]
featureimage: "img/posts/standing.png"
showHero: true
heroStyle: "basic"
imagePosition: "center"
---

I sit too long at a desk job. Standing is a quiet menu bar app for Mac that watches posture (motion-gated locally), checks sit vs stand when it matters, and nudges you before one posture sticks.

Calibration is yours, the API key lives in Keychain, and shipping is DMG-first with optional Sparkle updates later.

**Links:** [Landing](https://joelhanson.com/standing/) · [GitHub](https://github.com/Joel-hanson/standing) · [Latest release](https://github.com/Joel-hanson/standing/releases/latest)

## What it does

- Menu bar shell (SwiftUI) over a Python worker for camera, motion gating, and posture checks
- Local motion gate so you only send a small JPEG when a check is worthwhile
- Sit / stand calibration, history, and gentle warnings after configurable minutes
- Optional one-time Support via Buy Me a Coffee — the app itself stays free

![Standing menu bar](/images/standing/menu.png)
_Menu bar — start tracking, check posture, open settings._

![Standing activity](/images/standing/activity.png)
_Activity history for sit vs stand stretches._
