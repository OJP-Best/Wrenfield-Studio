// Captures high-resolution, cleanly cropped section screenshots of the Wrenfield
// Studio site for portfolio/Instagram use. Re-run any time the site changes:
//   node serve.mjs        (in one terminal)
//   node capture-portfolio-screenshots.mjs   (in another)
import { chromium } from "playwright";
import fs from "node:fs";
import path from "node:path";

const BASE_URL = "http://localhost:3000";
const OUT_DIR = "C:\\Users\\jomea\\OneDrive\\wrenfield studio images";
// Prefixed so these never collide with the unrelated (dental client) screenshots
// already sitting in this shared output folder.
const PREFIX = "wrenfield-";

fs.mkdirSync(OUT_DIR, { recursive: true });

const HIDE_SCROLLBAR_CSS = `
  ::-webkit-scrollbar { display: none !important; width: 0 !important; height: 0 !important; }
  html, body { scrollbar-width: none !important; -ms-overflow-style: none !important; }
`;

async function preparePage(page, url) {
  await page.emulateMedia({ reducedMotion: "reduce" });
  await page.goto(url, { waitUntil: "networkidle" });
  await page.addStyleTag({ content: HIDE_SCROLLBAR_CSS });
  await page.evaluate(() => document.fonts.ready);
  await page.waitForTimeout(250);
}

async function hideHeader(page) {
  await page.evaluate(() => {
    const nav = document.querySelector(".site-nav");
    if (nav) nav.style.display = "none";
  });
  await page.waitForTimeout(100);
}

// For the very top of a page: clip from y=0 down through the bottom of the
// given section, so the (still-visible) header is included with no gap or overlap.
async function captureTopClip(page, sectionLocator, viewportWidth, filePath) {
  const box = await sectionLocator.boundingBox();
  const targetHeight = Math.ceil(box.y + box.height);
  await page.setViewportSize({ width: viewportWidth, height: targetHeight });
  await page.waitForTimeout(150);
  await page.screenshot({
    path: filePath,
    clip: { x: 0, y: 0, width: viewportWidth, height: targetHeight },
  });
  console.log(`Saved ${filePath}`);
}

async function captureSection(sectionLocator, filePath) {
  await sectionLocator.scrollIntoViewIfNeeded();
  await sectionLocator.screenshot({ path: filePath });
  console.log(`Saved ${filePath}`);
}

// For a grid cell that gets stretched to match a taller sibling column (e.g. the
// portfolio grid), clip to just the visible content (mockup frame + caption)
// instead of the whole stretched cell, so there's no dead space at the bottom.
async function captureCardClip(page, wrapperLocator, filePath) {
  await wrapperLocator.scrollIntoViewIfNeeded();
  const rect = await wrapperLocator.evaluate((el) => {
    const children = Array.from(el.children);
    const rects = children.map((c) => c.getBoundingClientRect());
    const top = Math.min(...rects.map((r) => r.top));
    const left = Math.min(...rects.map((r) => r.left));
    const bottom = Math.max(...rects.map((r) => r.bottom));
    const right = Math.max(...rects.map((r) => r.right));
    return { x: left, y: top, width: right - left, height: bottom - top };
  });
  await page.screenshot({ path: filePath, clip: rect });
  console.log(`Saved ${filePath}`);
}

const results = [];

async function run() {
  const browser = await chromium.launch();

  // ---------- DESKTOP (1920x1080 @2x) ----------
  const desktopCtx = await browser.newContext({
    viewport: { width: 1920, height: 1080 },
    deviceScaleFactor: 2,
  });
  const page = await desktopCtx.newPage();

  // -- index.html --
  await preparePage(page, `${BASE_URL}/index.html`);
  const homeSections = page.locator("main > section");

  await captureTopClip(page, homeSections.nth(0), 1920, path.join(OUT_DIR, `${PREFIX}hero-section.png`));
  results.push("hero-section.png");

  // Reset viewport back to standard height before capturing the rest, then hide the header.
  await page.setViewportSize({ width: 1920, height: 1080 });
  await hideHeader(page);

  await captureSection(homeSections.nth(1), path.join(OUT_DIR, `${PREFIX}selected-work-section.png`));
  results.push("selected-work-section.png");

  await captureSection(homeSections.nth(3), path.join(OUT_DIR, `${PREFIX}every-touchpoint-section.png`));
  results.push("every-touchpoint-section.png");

  await captureSection(homeSections.nth(7), path.join(OUT_DIR, `${PREFIX}testimonials-section.png`));
  results.push("testimonials-section.png");

  await captureSection(homeSections.nth(8), path.join(OUT_DIR, `${PREFIX}cta-section.png`));
  results.push("cta-section.png");

  await captureSection(page.locator("footer.footer-duotone"), path.join(OUT_DIR, `${PREFIX}footer-section.png`));
  results.push("footer-section.png");

  // -- services.html --
  await preparePage(page, `${BASE_URL}/services.html`);
  await hideHeader(page);
  await captureSection(page.locator("#website-design"), path.join(OUT_DIR, `${PREFIX}services-section.png`));
  results.push("services-section.png");

  // -- portfolio.html --
  await preparePage(page, `${BASE_URL}/portfolio.html`);
  await hideHeader(page);
  const portfolioCard = page.locator("main > section").nth(1).locator(".grid > div").nth(0);
  await captureCardClip(page, portfolioCard, path.join(OUT_DIR, `${PREFIX}portfolio-section.png`));
  results.push("portfolio-section.png");

  // -- about.html --
  await preparePage(page, `${BASE_URL}/about.html`);
  await hideHeader(page);
  const aboutSections = page.locator("main > section");
  await captureSection(aboutSections.nth(4), path.join(OUT_DIR, `${PREFIX}about-section.png`));
  results.push("about-section.png");

  // -- contact.html --
  await preparePage(page, `${BASE_URL}/contact.html`);
  await hideHeader(page);
  await captureSection(page.locator("main > section").nth(1), path.join(OUT_DIR, `${PREFIX}contact-section.png`));
  results.push("contact-section.png");

  await desktopCtx.close();

  // ---------- MOBILE (390px wide @2x) ----------
  const mobileCtx = await browser.newContext({
    viewport: { width: 390, height: 844 },
    deviceScaleFactor: 2,
    isMobile: true,
    hasTouch: true,
  });
  const mobilePage = await mobileCtx.newPage();

  await preparePage(mobilePage, `${BASE_URL}/index.html`);
  const mobileHomeSections = mobilePage.locator("main > section");

  await captureTopClip(mobilePage, mobileHomeSections.nth(0), 390, path.join(OUT_DIR, `${PREFIX}mobile-homepage.png`));
  results.push("mobile-homepage.png");

  await mobilePage.setViewportSize({ width: 390, height: 844 });
  await hideHeader(mobilePage);
  await captureSection(mobileHomeSections.nth(7), path.join(OUT_DIR, `${PREFIX}mobile-testimonials.png`));
  results.push("mobile-testimonials.png");

  await mobileCtx.close();
  await browser.close();

  console.log(`\nDone. Captured ${results.length} screenshots into:\n${OUT_DIR}`);
}

run().catch((err) => {
  console.error(err);
  process.exit(1);
});
