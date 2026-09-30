---
title: "Where Is My Commit"
date: 2026-09-25
draft: false
featured: true
weight: 12
category: "personal"
demoUrl: "https://joelhanson.com/whereismycommit/"
summary: "Client-side GitHub tools for one question: when did this change ship?"
outcome: "SHA/PR → first tag · no server"
tags: ["Side Project", "GitHub", "Tooling", "Frontend"]
featureimage: "img/posts/whereismycommit.png"
---

Squash merges rewrite SHAs. Many projects tag releases without GitHub Releases. Release branches diverge. Searching “is this landed?” in those conditions is painful.

**Where Is My Commit** is a small suite of browser tools that talk to the GitHub API and answer that question: first release/tag for a commit or PR, whether a tag contains a change, which monorepo package version has a path, what’s between two tags, and what’s still unreleased.

No server — the token stays in the tab and is only sent to `api.github.com`.

**Links:** [Live tools](https://joelhanson.com/whereismycommit/) · [GitHub](https://github.com/Joel-hanson/whereismycommit)
