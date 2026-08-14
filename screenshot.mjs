import puppeteer from "puppeteer";
import fs from "node:fs";
import path from "node:path";

const url = process.argv[2];
const label = process.argv[3];

if (!url) {
  console.error("Usage: node screenshot.mjs <url> [label]");
  process.exit(1);
}

const dir = "./temporary screenshots";
fs.mkdirSync(dir, { recursive: true });

let n = 1;
const existing = fs.readdirSync(dir).filter((f) => /^screenshot-(\d+)/.test(f));
if (existing.length) {
  n = Math.max(...existing.map((f) => parseInt(f.match(/^screenshot-(\d+)/)[1], 10))) + 1;
}

const suffix = label ? `-${label}` : "";
const filePath = path.join(dir, `screenshot-${n}${suffix}.png`);

const isMobile = label === "mobile";
const browser = await puppeteer.launch();
const page = await browser.newPage();
await page.setViewport(isMobile ? { width: 390, height: 844 } : { width: 1440, height: 900 });
await page.goto(url, { waitUntil: "networkidle0" });

// Scroll through the page so scroll-triggered reveal animations fire before capture
await page.evaluate(async () => {
  const step = 300;
  const height = document.body.scrollHeight;
  for (let y = 0; y < height; y += step) {
    window.scrollTo(0, y);
    await new Promise((r) => requestAnimationFrame(() => setTimeout(r, 100)));
  }
});

// Expand the viewport to the full document height so every reveal element is
// within the observed viewport, then give IntersectionObserver callbacks time
// to fire before the final capture (avoids a race with fullPage resize).
const fullHeight = await page.evaluate(() => document.body.scrollHeight);
await page.setViewport({
  width: isMobile ? 390 : 1440,
  height: fullHeight,
});
await new Promise((r) => setTimeout(r, 400));
await page.evaluate(() => window.scrollTo(0, 0));
await new Promise((r) => setTimeout(r, 100));

await page.screenshot({ path: filePath, fullPage: false });
await browser.close();

console.log(`Saved ${filePath}`);
