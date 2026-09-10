#!/usr/bin/env node
/**
 * Capture project-card screenshots: live apps when they exist, otherwise GitHub.
 *
 * Requires puppeteer-core and a local Chrome:
 *   npm install --prefix /tmp/project-shots puppeteer-core
 *   cd /tmp/project-shots && node this-script
 *   (or copy this file next to node_modules/puppeteer-core)
 */
import { mkdir } from "node:fs/promises";
import path from "node:path";
import { fileURLToPath } from "node:url";
import puppeteer from "puppeteer-core";

const here = path.dirname(fileURLToPath(import.meta.url));
const root = path.resolve(here, "..");
const outDir = path.join(root, "assets/img/posts");
const chrome =
  process.env.CHROME_PATH ||
  "/Applications/Google Chrome.app/Contents/MacOS/Google Chrome";

const shots = [
  {
    name: "markdown2medium.png",
    url: "https://markdown2medium.joelhanson.com/",
    width: 1440,
    height: 900,
  },
  {
    name: "leetok.png",
    url: "https://joel-hanson.github.io/leetok/",
    width: 430,
    height: 932,
  },
  {
    name: "github-data-platform.png",
    url: "https://joel-hanson.github.io/weather-api-project/",
    width: 1440,
    height: 900,
  },
  {
    name: "apicurio-registry.png",
    url: "https://github.com/Apicurio/apicurio-registry",
    github: true,
  },
  {
    name: "kafka-common-problems.png",
    url: "https://github.com/Joel-hanson/kafka-common-problems",
    github: true,
  },
  {
    name: "bijou64.png",
    url: "https://github.com/Joel-hanson/bijou64",
    github: true,
  },
  {
    name: "kafka-connector-template.png",
    url: "https://github.com/Joel-hanson/kafka-connector-template",
    github: true,
  },
  {
    name: "django-drf-mcp.png",
    url: "https://github.com/Joel-hanson/django-drf-mcp",
    github: true,
  },
  {
    name: "django-celery-restate.png",
    url: "https://github.com/Joel-hanson/django-celery-restate-example",
    github: true,
  },
];

async function dismissBanners(page) {
  await page
    .evaluate(() => {
      const labels = ["Accept", "Accept all", "Got it", "OK", "Close"];
      for (const btn of document.querySelectorAll("button")) {
        const text = (btn.textContent || "").trim();
        if (labels.includes(text)) btn.click();
      }
    })
    .catch(() => {});
}

async function shotOne(browser, spec) {
  const width = spec.width || 1440;
  const height = spec.height || 900;
  const page = await browser.newPage();
  await page.setViewport({ width, height, deviceScaleFactor: 2 });
  if (spec.github) {
    await page.setCookie({
      name: "color_mode",
      value: JSON.stringify({
        color_mode: "dark",
        light_theme: { name: "light", color_mode: "light" },
        dark_theme: { name: "dark", color_mode: "dark" },
      }),
      domain: ".github.com",
      path: "/",
    });
  }
  await page.goto(spec.url, { waitUntil: "networkidle2", timeout: 60000 });
  await dismissBanners(page);
  await new Promise((r) => setTimeout(r, 1200));
  const dest = path.join(outDir, spec.name);
  const clip = spec.github
    ? { x: 0, y: 64, width, height: 420 }
    : undefined;
  await page.screenshot({ path: dest, type: "png", clip });
  await page.close();
  console.log("wrote", path.relative(root, dest));
}

const browser = await puppeteer.launch({
  executablePath: chrome,
  headless: true,
  args: ["--hide-scrollbars", "--disable-gpu", "--no-first-run"],
});

try {
  await mkdir(outDir, { recursive: true });
  for (const spec of shots) {
    try {
      await shotOne(browser, spec);
    } catch (err) {
      console.error("FAILED", spec.name, spec.url, err.message);
    }
  }
} finally {
  await browser.close();
}
