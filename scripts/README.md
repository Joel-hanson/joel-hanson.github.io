# scripts

## `gen_cover.py`

Generates cover art for posts and projects in the `joel-terminal` palette
(near-black `#0a0a0a`, neutral greys, crimson `#dc143c`, cyan `#22d3ee`).

Each cover is a 1200×630 SVG written to `assets/img/covers/<slug>.svg`, plus a
PNG twin of the same name because LinkedIn, X and friends will not render SVG as
a link preview. The page's `featureimage` is set to the SVG; `social-image-url.html`
picks up the PNG for Open Graph automatically.

Artwork is seeded from the page slug, so a page always regenerates to the same
image. Requires Python 3 (stdlib only) and `rsvg-convert` for the PNG twin
(`brew install librsvg`).

```bash
# every post/project that has no featureimage yet
python3 scripts/gen_cover.py

# preview the plan without writing anything
python3 scripts/gen_cover.py --dry-run

# a single page
python3 scripts/gen_cover.py content/posts/31-when-one-kafka-partition-takes-all-the-heat.md

# override the style, replacing an existing cover
python3 scripts/gen_cover.py content/posts/31-*.md --style waves --force

# try a different variant of the same style
python3 scripts/gen_cover.py content/posts/31-*.md --style waves --seed take-2 --force

python3 scripts/gen_cover.py --list-styles
```

The style is picked from the page's title, tags and categories — Kafka topics
lean towards `nodes`, performance towards `bars`, debugging towards `slash`, and
so on. Pass `--style` when the guess is wrong. Other flags: `--no-png`,
`--no-frontmatter`.
