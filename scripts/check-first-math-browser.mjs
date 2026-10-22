// Run against the production preview supplied by check-browser.mjs.
// Hold font downloads until AFTER capturing the first lecture content commit.
import assert from "node:assert/strict";
import fs from "node:fs";
import path from "node:path";
import { chromium } from "playwright";

const out = path.resolve("outputs/bug-audit-1/first-math");
fs.mkdirSync(path.join(out, "tmp"), { recursive: true });
process.env.TEMP = process.env.TMP = path.join(out, "tmp");
const context = await chromium.launchPersistentContext(path.join(out, `profile-${Date.now()}`), {
  channel: "msedge",
  headless: true,
});
const results = [];
try {
  for (const width of [1440, 390]) {
    for (const id of ["1.1.2", "1.2.4", "3.6.9"]) {
      const page = await context.newPage();
      await page.setViewportSize({ width, height: 900 });
      let releaseFonts;
      const fontGate = new Promise((resolve) => {
        releaseFonts = resolve;
      });
      let heldFonts = 0;
      await page.route(/\.(woff2?|ttf)(?:\?|$)/, async (route) => {
        heldFonts++;
        await fontGate;
        await route.continue();
      });
      await page.addInitScript(() => {
        const observer = new MutationObserver(() => {
          const principle = document.querySelector("#principle");
          if (!principle) return;
          // MutationObserver runs before the browser can paint this React commit.
          const rows = [...principle.querySelectorAll(".formula-line")];
          window.__firstMath = {
            rows: rows.length,
            rendered: rows.filter((row) => row.querySelector(".katex-html")?.textContent.trim())
              .length,
            visible: rows.every((row) => {
              const math = row.querySelector(".katex-html");
              if (!math) return false;
              const css = getComputedStyle(math);
              return (
                css.display !== "none" &&
                css.visibility === "visible" &&
                css.opacity !== "0" &&
                math.getBoundingClientRect().height > 0
              );
            }),
            fontDisplay: [...document.fonts]
              .filter((f) => f.family.includes("KaTeX"))
              .map((f) => f.display),
            pendingFonts: [...document.fonts].filter(
              (f) => f.family.includes("KaTeX") && f.status !== "loaded",
            ).length,
          };
          principle.scrollIntoView();
          observer.disconnect();
        });
        observer.observe(document, { childList: true, subtree: true });
      });
      try {
        await page.goto(
          `${process.env.FIRST_MATH_BASE ?? "http://127.0.0.1:4174/"}#/lab?topic=${id}`,
          {
            waitUntil: "domcontentloaded",
          },
        );
        await page.waitForFunction(() => window.__firstMath, {}, { polling: "raf" });
        const first = await page.evaluate(() => window.__firstMath);
        assert.ok(first.rows > 0, `${id}: formula rows in the first lecture commit`);
        assert.equal(first.rendered, first.rows, `${id}: no blank formula placeholders`);
        assert.ok(first.visible, `${id}: visible formula geometry at the first commit`);
        assert.ok(first.fontDisplay.length > 0 && first.fontDisplay.every((s) => s === "swap"));
        assert.ok(first.pendingFonts > 0, "cold formula check must precede font availability");
        // CDP captures immediately, without Playwright waiting for document.fonts.ready.
        const cdp = await context.newCDPSession(page);
        const png = await cdp.send("Page.captureScreenshot", { format: "png" });
        fs.writeFileSync(path.join(out, `${width}-${id}.png`), Buffer.from(png.data, "base64"));
        await cdp.detach();
        results.push({ id, width, ...first, heldFonts });
      } finally {
        releaseFonts();
        await page.close();
      }
    }
  }
  console.log(`PASS: ${results.length} cold first-commit formula captures with fonts held pending`);
} finally {
  fs.writeFileSync(path.join(out, "results.json"), JSON.stringify(results, null, 2));
  await context.close();
}
