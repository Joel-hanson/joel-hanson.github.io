---
title: "Hacker News — open story links in a new tab"
date: 2026-11-07
draft: false
discoveryType: snippet
summary: "A tiny Tampermonkey script that sets target=_blank on HN story titles so you keep the list while reading."
tags: ["Userscript", "Hacker News", "Browser"]
codeLang: js
code: |
  // ==UserScript==
  // @name         Hacker News Open Links in New Tab
  // @match        https://news.ycombinator.com/*
  // @grant        none
  // ==/UserScript==

  document.querySelectorAll('.athing .titleline > a').forEach(link => {
    link.setAttribute('target', '_blank');
    link.setAttribute('rel', 'noopener noreferrer');
  });
externalUrl: "/hn-new-tab/hn-new-tab.user.js"
externalLabel: "install userscript →"
---

HN story clicks replace the listing by default. This userscript tags each `.titleline` link with `target="_blank"` (and `rel="noopener noreferrer"`) so the front page stays put.

Install [Tampermonkey](https://www.tampermonkey.net/), then open the [userscript file](/hn-new-tab/hn-new-tab.user.js).
