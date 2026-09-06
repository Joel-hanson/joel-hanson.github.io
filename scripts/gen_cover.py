#!/usr/bin/env python3
"""Generate cover art for content pages in the joel-terminal palette.

Each cover is a 1200x630 SVG built from a seeded random generator, so the same
page always produces the same artwork. Run without arguments to fill in every
post and project that has no `featureimage` yet.

    scripts/gen_cover.py                              # everything missing a cover
    scripts/gen_cover.py content/posts/31-*.md        # one page
    scripts/gen_cover.py content/posts/31-*.md --style waves --force
    scripts/gen_cover.py --list-styles
"""

from __future__ import annotations

import argparse
import hashlib
import random
import re
import shutil
import subprocess
import sys
from pathlib import Path

REPO = Path(__file__).resolve().parent.parent
COVER_DIR = REPO / "assets" / "img" / "covers"
FEATURE_PREFIX = "img/covers"

WIDTH, HEIGHT = 1200, 630

BG = "#0a0a0a"
DIM = "#171717"
INK = "#262626"
INK_BRIGHT = "#404040"
ACCENT = "#dc143c"
ACCENT_ALT = "#22d3ee"


# --------------------------------------------------------------------------
# Style generators. Each returns a list of SVG fragments drawn over the background.
# --------------------------------------------------------------------------


def _group(children: list[str], attrs: str = "") -> str:
    open_tag = f"<g {attrs}>" if attrs else "<g>"
    return f"  {open_tag}\n    " + "".join(children) + "\n  </g>"


def bars(r: random.Random) -> list[str]:
    count = r.choice([12, 14, 16])
    gap = (WIDTH - 200) // count
    w = gap - 22
    baseline = 550
    accents = set(r.sample(range(count), k=r.choice([1, 2, 3])))
    rects = []
    for i in range(count):
        h = r.randrange(80, 340, 10)
        fill, opacity = (ACCENT, "0.95") if i in accents else (INK, "0.55")
        rects.append(
            f'<rect x="{100 + i * gap}" y="{baseline - h}" width="{w}" '
            f'height="{h}" fill="{fill}" opacity="{opacity}"/>'
        )
    return [
        _group(rects),
        f'  <line x1="80" y1="{baseline}" x2="1120" y2="{baseline}" '
        f'stroke="{INK_BRIGHT}" stroke-width="2"/>',
    ]


def waves(r: random.Random) -> list[str]:
    amp = r.choice([30, 40, 52])
    step = r.choice([32, 36, 44])
    every = r.choice([3, 4])
    paths = []
    y, i = r.randrange(80, 140), 0
    while y < HEIGHT - 40:
        stroke, opacity = (ACCENT, "0.7") if i % every == 0 else (INK, "0.35")
        paths.append(
            f'<path d="M0 {y} Q 150 {y - amp} 300 {y} T 600 {y} T 900 {y} T 1200 {y}" '
            f'stroke="{stroke}" opacity="{opacity}"/>'
        )
        y += step
        i += 1
    return [_group(paths, 'fill="none" stroke-width="2"')]


def circuit(r: random.Random) -> list[str]:
    traces, pads = [], []
    for _ in range(r.choice([3, 4])):
        x, y = 80, r.randrange(100, 540, 20)
        d = [f"M{x} {y}"]
        while x < 1120:
            x = min(1120, x + r.randrange(140, 300, 20))
            d.append(f"H{x}")
            if x < 1120:
                y = max(80, min(550, y + r.choice([-1, 1]) * r.randrange(60, 200, 20)))
                d.append(f"V{y}")
                pads.append((x, y))
        traces.append(f'<path d="{" ".join(d)}"/>')

    r.shuffle(pads)
    hot = pads[:1]
    quiet = pads[1 : 1 + r.choice([3, 4])]
    squares = [
        f'<rect x="{x - 20}" y="{y - 20}" width="40" height="40" rx="4"/>' for x, y in quiet
    ]
    out = [
        _group(traces, f'fill="none" stroke="{INK_BRIGHT}" stroke-width="2" stroke-linejoin="round"'),
        _group(squares, f'fill="{INK}"'),
    ]
    for x, y in hot:
        out.append(
            f'  <rect x="{x - 20}" y="{y - 20}" width="40" height="40" rx="4" fill="{ACCENT}"/>'
        )
    if quiet:
        cx, cy = quiet[-1]
        out.append(f'  <circle cx="{cx}" cy="{cy}" r="8" fill="{ACCENT_ALT}"/>')
    return out


def nodes(r: random.Random) -> list[str]:
    count = r.choice([5, 6])
    span = (1020 - 180) // (count - 1)
    rows = []
    for band in (r.randrange(140, 240, 20), r.randrange(360, 480, 20)):
        rows.append(
            [
                (180 + i * span + r.randrange(-30, 30, 10), band + r.randrange(-70, 70, 10))
                for i in range(count)
            ]
        )

    edges = []
    for row in rows:
        edges.append('<path d="' + "".join(f"{'M' if i == 0 else 'L'}{x} {y}" for i, (x, y) in enumerate(row)) + '"/>')
    cross = "".join(f"M{a[0]} {a[1]}L{b[0]} {b[1]}" for a, b in zip(rows[0][1:4], rows[1][1:4]))
    edges.append(f'<path d="{cross}"/>')

    points = [p for row in rows for p in row]
    circles = [f'<circle cx="{x}" cy="{y}" r="8"/>' for x, y in points]
    hot, cool = r.sample(points, k=2)
    return [
        _group(edges, f'fill="none" stroke="{INK_BRIGHT}" stroke-width="1.5"'),
        _group(circles, f'fill="{INK}"'),
        f'  <circle cx="{hot[0]}" cy="{hot[1]}" r="10" fill="{ACCENT}"/>',
        f'  <circle cx="{cool[0]}" cy="{cool[1]}" r="6" fill="{ACCENT_ALT}"/>',
    ]


def grid(r: random.Random) -> list[str]:
    cell = r.choice([32, 40, 48])
    bx, by = r.randrange(60, 200, 20), r.randrange(60, 200, 20)
    dx, dy = r.randrange(820, 1060, 20), r.randrange(400, 540, 20)
    return [
        "  <defs>\n"
        f'    <pattern id="g" width="{cell}" height="{cell}" patternUnits="userSpaceOnUse">\n'
        f'      <path d="M{cell} 0H0V{cell}" fill="none" stroke="{INK}" stroke-width="1"/>\n'
        "    </pattern>\n"
        "  </defs>",
        '  <rect width="100%" height="100%" fill="url(#g)"/>',
        f'  <rect x="{bx}" y="{by}" width="{r.choice([160, 200, 240])}" height="3" fill="{ACCENT}"/>',
        f'  <circle cx="{dx}" cy="{dy}" r="6" fill="{ACCENT}"/>',
        f'  <circle cx="{dx + 40}" cy="{dy + 40}" r="3" fill="{ACCENT_ALT}"/>',
    ]


def dots(r: random.Random) -> list[str]:
    step = r.choice([48, 55, 62])
    hot_x, hot_y = r.randrange(200, 1000), r.randrange(150, 480)
    circles = []
    for y in range(80, HEIGHT - 60, step):
        for x in range(80, WIDTH - 60, step):
            near = abs(x - hot_x) < 140 and abs(y - hot_y) < 120
            if near and r.random() < 0.55:
                fill, opacity, rad = ACCENT, "0.9", 4
            elif r.random() < 0.02:
                fill, opacity, rad = ACCENT_ALT, "0.6", 3
            else:
                fill, opacity, rad = INK, "0.8", 3
            circles.append(f'<circle cx="{x}" cy="{y}" r="{rad}" fill="{fill}" opacity="{opacity}"/>')
    return [_group(circles)]


def hash_lines(r: random.Random) -> list[str]:
    step = r.choice([40, 48, 56])
    skew = r.choice([-200, 200])
    lines, accents = [], []
    hot = set(r.sample(range(WIDTH // step + 8), k=r.choice([2, 3])))
    for i, x in enumerate(range(-abs(skew), WIDTH + abs(skew), step)):
        line = f'<line x1="{x}" y1="0" x2="{x + skew}" y2="{HEIGHT}"/>'
        (accents if i in hot else lines).append(line)
    out = [_group(lines, f'stroke="{INK_BRIGHT}" stroke-width="1.5" opacity="0.7"')]
    if accents:
        out.append(_group(accents, f'stroke="{ACCENT}" stroke-width="3" opacity="0.9"'))
    return out


def rings(r: random.Random) -> list[str]:
    cx, cy = r.choice([420, 600, 780]), r.choice([250, 315, 380])
    step = r.choice([24, 28, 34])
    circles = [
        f'<circle cx="{cx}" cy="{cy}" r="{rad}" '
        f'stroke="{INK_BRIGHT if i % 2 == 0 else INK}" opacity="0.7"/>'
        for i, rad in enumerate(range(40, 300, step))
    ]
    return [
        _group(circles, 'fill="none" stroke-width="3"'),
        f'  <circle cx="{cx}" cy="{cy}" r="{r.choice([14, 18, 22])}" fill="{ACCENT}"/>',
        f'  <circle cx="{cx}" cy="{cy}" r="{r.choice([96, 120, 152])}" fill="none" '
        f'stroke="{ACCENT_ALT}" stroke-width="2" opacity="0.7"/>',
    ]


def scanlines(r: random.Random) -> list[str]:
    step = r.choice([6, 8])
    lines = [f'<line x1="0" y1="{y}" x2="{WIDTH}" y2="{y}"/>' for y in range(0, HEIGHT, step)]
    band_y = r.randrange(120, 460, step)
    band_h = r.choice([40, 60, 80])
    return [
        _group(lines, f'stroke="{DIM}" stroke-width="2"'),
        f'  <rect x="0" y="{band_y}" width="{WIDTH}" height="{band_h}" fill="{ACCENT}" opacity="0.12"/>',
        f'  <line x1="0" y1="{band_y}" x2="{WIDTH}" y2="{band_y}" stroke="{ACCENT}" stroke-width="3"/>',
        f'  <line x1="0" y1="{band_y + band_h}" x2="{WIDTH}" y2="{band_y + band_h}" '
        f'stroke="{ACCENT_ALT}" stroke-width="1.5" opacity="0.6"/>',
    ]


def slash(r: random.Random) -> list[str]:
    step = r.choice([80, 90, 110])
    width = r.choice([32, 40, 48])
    lines = []
    xs = list(range(0, WIDTH + 400, step))
    for x in xs:
        lines.append(f'<line x1="{x}" y1="-40" x2="{x - 400}" y2="700"/>')
    hot = r.choice(xs[2:-4] or xs)
    return [
        _group(lines, f'stroke="{INK}" stroke-width="{width}" opacity="0.5"'),
        f'  <line x1="{hot}" y1="-40" x2="{hot - 400}" y2="700" stroke="{ACCENT}" '
        f'stroke-width="{width}" opacity="0.9"/>',
    ]


def triangles(r: random.Random) -> list[str]:
    size = r.choice([100, 120, 140])
    half = size // 2
    outline, filled = [], []
    hot_row = r.randrange(0, HEIGHT // (size - 10) + 1)
    for row, y in enumerate(range(40, HEIGHT, size - 10)):
        offset = 80 + (half if row % 2 else 0)
        for x in range(offset, WIDTH + size, size):
            tri = f'<path d="M{x} {y} l{half} {size - 20} h-{size} z"/>'
            if row == hot_row and r.random() < 0.25:
                filled.append(tri)
            else:
                outline.append(tri)
    out = [_group(outline, f'fill="none" stroke="{INK_BRIGHT}" stroke-width="1.5"')]
    if filled:
        out.append(_group(filled, f'fill="{ACCENT}" opacity="0.9"'))
    return out


def binary(r: random.Random) -> list[str]:
    cols = r.choice([26, 28, 32])
    rows = r.choice([14, 16])
    spans = []
    for _ in range(rows):
        bits = " ".join(r.choice("01") for _ in range(cols))
        fill = ACCENT if r.random() < 0.15 else INK
        spans.append(f'<tspan x="60" dy="36" fill="{fill}">{bits}</tspan>')
    return [
        '  <text x="60" y="0" font-family="ui-monospace,monospace" font-size="28" '
        f'fill="{INK}">\n    ' + "".join(spans) + "\n  </text>"
    ]


def bricks(r: random.Random) -> list[str]:
    bw, bh = r.choice([100, 120]), r.choice([48, 55, 64])
    outline, filled = [], []
    for row, y in enumerate(range(80, HEIGHT - 40, bh + 10)):
        offset = -(bw // 2) if row % 2 else 0
        for x in range(offset, WIDTH, bw + 10):
            brick = f'<rect x="{x}" y="{y}" width="{bw}" height="{bh}" rx="2"/>'
            if r.random() < 0.06:
                filled.append(brick)
            else:
                outline.append(brick)
    out = [_group(outline, f'fill="none" stroke="{INK_BRIGHT}" stroke-width="1.5"')]
    if filled:
        out.append(_group(filled, f'fill="{ACCENT}" opacity="0.85"'))
    return out


def chevron(r: random.Random) -> list[str]:
    step = r.choice([80, 90, 110])
    depth = r.choice([60, 80, 100])
    stroke = r.choice([14, 18, 22])
    xs = list(range(100, WIDTH - 60, step))
    paths = [f'<path d="M{x} 80 L{x + depth} 315 L{x} 550"/>' for x in xs]
    hot = r.choice(xs)
    return [
        _group(paths, f'fill="none" stroke="{INK_BRIGHT}" stroke-width="{stroke}" stroke-linecap="square"'),
        f'  <path d="M{hot} 80 L{hot + depth} 315 L{hot} 550" fill="none" '
        f'stroke="{ACCENT}" stroke-width="{stroke}"/>',
    ]


def mosaic(r: random.Random) -> list[str]:
    size = r.choice([48, 58, 70])
    gap = 2
    cols = WIDTH // (size + gap) + 1
    rows = HEIGHT // (size + gap) + 1
    # A single contiguous block of accent tiles reads better than scattered noise.
    block_w, block_h = r.randrange(3, 6), r.randrange(2, 5)
    block_x, block_y = r.randrange(0, max(1, cols - block_w)), r.randrange(0, max(1, rows - block_h))
    squares = []
    for row in range(rows):
        for col in range(cols):
            x, y = col * (size + gap), row * (size + gap)
            in_block = block_x <= col < block_x + block_w and block_y <= row < block_y + block_h
            if in_block:
                fill, opacity = ACCENT, "0.85"
            elif r.random() < 0.45:
                fill, opacity = INK, r.choice(["0.4", "0.6", "0.8"])
            else:
                continue
            squares.append(
                f'<rect x="{x}" y="{y}" width="{size}" height="{size}" fill="{fill}" opacity="{opacity}"/>'
            )
    edge_x = (block_x + block_w) * (size + gap)
    edge_y = (block_y + block_h - 1) * (size + gap)
    return [
        _group(squares),
        f'  <rect x="{edge_x}" y="{edge_y}" width="{size}" height="{size}" '
        f'fill="{ACCENT_ALT}" opacity="0.5"/>',
    ]


STYLES = {
    "bars": bars,
    "binary": binary,
    "bricks": bricks,
    "chevron": chevron,
    "circuit": circuit,
    "dots": dots,
    "grid": grid,
    "hash": hash_lines,
    "mosaic": mosaic,
    "nodes": nodes,
    "rings": rings,
    "scanlines": scanlines,
    "slash": slash,
    "triangles": triangles,
    "waves": waves,
}

# Keywords from a page's title, tags and categories steer the style choice.
STYLE_HINTS = {
    "nodes": {"kafka", "mcp", "distributed", "connect", "connector", "cluster", "graph", "network", "broker"},
    "circuit": {"docker", "devops", "infrastructure", "kubernetes", "deployment", "pipeline", "ci"},
    "bars": {"performance", "benchmark", "metrics", "monitoring", "partitions", "analytics", "scaling", "throughput"},
    "waves": {"flink", "stream", "streaming", "realtime", "real-time", "async", "events", "sse", "websockets"},
    "binary": {"c", "cpython", "encoding", "bytes", "compression", "serialization", "binary", "protocol"},
    "hash": {"git", "hashing", "versioning", "commits"},
    "scanlines": {"terminal", "cli", "shell", "bash", "unix", "scripting", "command-line"},
    "rings": {"restate", "retry", "durable", "celery", "queue", "orchestration", "workflow", "resilience"},
    "grid": {"database", "sql", "postgres", "table", "storage", "schema", "registry"},
    "mosaic": {"testing", "integration", "coverage", "quality"},
    "triangles": {"algorithm", "dsa", "math", "puzzle", "optimization"},
    "dots": {"ai", "ml", "machine-learning", "rag", "embeddings", "llm", "nlp", "vector"},
    "bricks": {"template", "boilerplate", "architecture", "framework", "django", "flask"},
    "slash": {"debugging", "troubleshooting", "incident", "failure", "outage"},
    "chevron": {"tutorial", "guide", "workflow", "migration", "productivity"},
}


# --------------------------------------------------------------------------
# Page handling
# --------------------------------------------------------------------------


class Page:
    def __init__(self, path: Path):
        self.path = path
        self.text = path.read_text(encoding="utf-8")
        self.front_matter = self._front_matter()

    def _front_matter(self) -> str:
        match = re.match(r"^---\n(.*?)\n---", self.text, re.DOTALL)
        return match.group(1) if match else ""

    @property
    def slug(self) -> str:
        if self.path.stem in {"index", "_index"}:
            return self.path.parent.name
        return self.path.stem

    @property
    def title(self) -> str:
        match = re.search(r"^title:\s*(.+)$", self.front_matter, re.MULTILINE)
        return match.group(1).strip().strip("\"'") if match else self.slug

    @property
    def feature_image(self) -> str | None:
        match = re.search(r"^featureimage:\s*(.+)$", self.front_matter, re.MULTILINE | re.IGNORECASE)
        return match.group(1).strip().strip("\"'") if match else None

    def keywords(self) -> set[str]:
        words = set(re.findall(r"[a-z0-9\-]+", self.title.lower()))
        for field in ("tags", "categories", "series"):
            inline = re.search(rf"^{field}:\s*\[(.*?)\]", self.front_matter, re.MULTILINE | re.DOTALL)
            if inline:
                words |= set(re.findall(r"[a-z0-9\-]+", inline.group(1).lower()))
                continue
            block = re.search(rf"^{field}:\s*\n((?:\s+-\s+.*\n?)+)", self.front_matter, re.MULTILINE)
            if block:
                words |= set(re.findall(r"[a-z0-9\-]+", block.group(1).lower()))
        return words

    def pick_style(self) -> str:
        keywords = self.keywords()
        scored = [(len(keywords & hints), name) for name, hints in STYLE_HINTS.items()]
        best = max(score for score, _ in scored)
        if best == 0:
            return sorted(STYLES)[seed_int(self.slug) % len(STYLES)]
        candidates = sorted(name for score, name in scored if score == best)
        return candidates[seed_int(self.slug) % len(candidates)]

    def set_feature_image(self, value: str) -> bool:
        if not self.front_matter:
            return False
        line = f'featureimage: "{value}"'
        if re.search(r"^featureimage:", self.front_matter, re.MULTILINE | re.IGNORECASE):
            new_fm = re.sub(
                r"^featureimage:.*$", line, self.front_matter, count=1, flags=re.MULTILINE | re.IGNORECASE
            )
        else:
            new_fm = self.front_matter.rstrip("\n") + "\n" + line
        self.text = self.text.replace(f"---\n{self.front_matter}\n---", f"---\n{new_fm}\n---", 1)
        self.front_matter = new_fm
        self.path.write_text(self.text, encoding="utf-8")
        return True


def seed_int(text: str) -> int:
    return int.from_bytes(hashlib.sha256(text.encode()).digest()[:8], "big")


def render(style: str, seed: str) -> str:
    body = STYLES[style](random.Random(seed_int(seed)))
    return (
        f'<svg xmlns="http://www.w3.org/2000/svg" width="{WIDTH}" height="{HEIGHT}" '
        f'viewBox="0 0 {WIDTH} {HEIGHT}" role="img">\n'
        f'  <rect width="100%" height="100%" fill="{BG}"/>\n' + "\n".join(body) + "\n</svg>\n"
    )


def rasterize(svg_path: Path, png_path: Path) -> bool:
    """Social platforms do not render SVG previews, so keep a PNG twin."""
    converter = shutil.which("rsvg-convert")
    if not converter:
        return False
    subprocess.run(
        [converter, "-w", str(WIDTH), "-h", str(HEIGHT), "-o", str(png_path), str(svg_path)],
        check=True,
    )
    return True


def discover() -> list[Path]:
    paths = sorted(REPO.glob("content/posts/*.md")) + sorted(REPO.glob("content/projects/*/index.md"))
    return [p for p in paths if not p.stem.startswith("_")]


def main() -> int:
    parser = argparse.ArgumentParser(description=__doc__, formatter_class=argparse.RawDescriptionHelpFormatter)
    parser.add_argument("paths", nargs="*", type=Path, help="markdown files (default: everything missing a cover)")
    parser.add_argument("--style", choices=sorted(STYLES), help="force a style instead of picking from tags")
    parser.add_argument("--seed", help="override the seed (default: the page slug)")
    parser.add_argument("--force", action="store_true", help="regenerate pages that already have a cover")
    parser.add_argument("--no-png", action="store_true", help="skip the PNG twin used for social previews")
    parser.add_argument("--no-frontmatter", action="store_true", help="write the file but leave the page alone")
    parser.add_argument("--dry-run", action="store_true", help="report what would change")
    parser.add_argument("--list-styles", action="store_true", help="print the available styles and exit")
    args = parser.parse_args()

    if args.list_styles:
        print("\n".join(sorted(STYLES)))
        return 0

    explicit = bool(args.paths)
    paths = args.paths if explicit else discover()
    if not paths:
        print("no pages found")
        return 1

    COVER_DIR.mkdir(parents=True, exist_ok=True)
    png_warned = False
    changed = 0

    for path in paths:
        if not path.exists():
            print(f"skip {path}: not found")
            continue
        page = Page(path)
        existing = page.feature_image
        if existing and not args.force:
            if explicit:
                print(f"skip {page.slug}: already has {existing} (use --force)")
            continue

        style = args.style or page.pick_style()
        svg_path = COVER_DIR / f"{page.slug}.svg"
        feature = f"{FEATURE_PREFIX}/{svg_path.name}"

        if args.dry_run:
            print(f"{page.slug}: {style} -> {feature}")
            changed += 1
            continue

        svg_path.write_text(render(style, args.seed or page.slug), encoding="utf-8")
        note = ""
        if not args.no_png:
            if rasterize(svg_path, svg_path.with_suffix(".png")):
                note = " (+png)"
            elif not png_warned:
                print("note: rsvg-convert not found, skipping PNG twins (brew install librsvg)")
                png_warned = True
        if not args.no_frontmatter and not page.set_feature_image(feature):
            note += " (no front matter — set featureimage yourself)"
        print(f"{page.slug}: {style} -> {feature}{note}")
        changed += 1

    if not changed:
        print("nothing to do")
    return 0


if __name__ == "__main__":
    sys.exit(main())
