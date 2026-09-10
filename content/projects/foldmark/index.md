---
title: "Foldmark"
date: 2026-09-05
draft: false
featured: true
weight: 4
category: "personal"
summary: "Printable bookmark maker. Pick a shape, type a line, download a PDF, fold."
tags: ["Side Project", "Next.js", "PDF", "Frontend"]
featureimage: "img/posts/foldmark.png"
showHero: true
heroStyle: "basic"
imagePosition: "center"
---

I wanted a bookmark I could print at home — not a craft project and not an account, just a PDF I could fold and stick in a book.

**Foldmark** does that in the browser. Pick a shape, type a line, pick a palette, download a PDF. The on-screen preview and the printed sheet share the same layout code, so what you see is what you fold.

**Links:** [Live app](https://foldmark.joelhanson.com/) · [GitHub](https://github.com/Joel-hanson/foldmark)

## Shapes

- **Accordion fold** — the whole sheet, fan-folded thick. Numbered fold lines, no scissors.
- **Corner pocket** — cut a square, fold twice, slide it over the page corner.

![Foldmark accordion fold maker](/images/foldmark/accordion.png)
_Accordion fold with the Printer ink palette — print, fan-fold, read._

![Foldmark corner pocket](/images/foldmark/corner.png)
_Corner pocket — a single square that becomes a triangular page-corner bookmark._

## What else

Five palettes (including a dark Night press), patterns or your own image, A4 / Letter / A5 / Legal, color or black & white, and a shareable design link in the URL. PDF generation is all client-side with `pdf-lib` — nothing is uploaded.

![Foldmark Night press palette](/images/foldmark/night.png)
_Night press — dark paper, light ink, still the same print-and-fold flow._
