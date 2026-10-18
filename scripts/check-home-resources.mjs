// Build the baseline in outputs/p0-baseline first. All browser files stay in outputs/.
import fs from "node:fs";
import path from "node:path";
import http from "node:http";
import assert from "node:assert/strict";
import { gzipSync } from "node:zlib";
import { chromium } from "playwright";
const root = process.cwd(),
  work = path.resolve("outputs/home-resource-check");
fs.mkdirSync(path.join(work, "tmp"), { recursive: true });
process.env.TEMP = process.env.TMP = path.join(work, "tmp");
const types = {
  ".html": "text/html",
  ".js": "text/javascript",
  ".css": "text/css",
  ".svg": "image/svg+xml",
  ".woff2": "font/woff2",
  ".woff": "font/woff",
  ".jpg": "image/jpeg",
  ".json": "application/json",
};
const served = new Map();
const server = http.createServer((req, res) => {
  const url = new URL(req.url, "http://localhost"),
    parts = decodeURIComponent(url.pathname).split("/").filter(Boolean),
    target = parts.shift();
  const base = path.resolve(target === "baseline" ? "outputs/p0-baseline/docs" : "docs");
  const file = path.resolve(base, parts.join("/") || "index.html");
  if (!file.startsWith(base + path.sep) || !fs.existsSync(file)) {
    res.writeHead(404);
    res.end();
    return;
  }
  const bytes = fs.readFileSync(file);
  served.set(url.pathname, { raw: bytes.length, gzip: gzipSync(bytes).length });
  res.writeHead(200, {
    "Content-Type": types[path.extname(file)] ?? "application/octet-stream",
    "Cache-Control": "no-store",
  });
  res.end(bytes);
});
await new Promise((resolve) => server.listen(4180, "127.0.0.1", resolve));
let context;
try {
  context = await chromium.launchPersistentContext(path.join(work, "profile-" + Date.now()), {
    channel: "msedge",
    headless: true,
  });
  const records = [];
  for (const width of [1440, 390])
    for (const target of ["baseline", "current"]) {
      const page = await context.newPage();
      await page.setViewportSize({ width, height: width === 1440 ? 900 : 844 });
      const errors = [];
      page.on("pageerror", (e) => errors.push(e.message));
      page.on("console", (m) => {
        if (m.type() === "error") errors.push(m.text());
      });
      await page.goto(`http://127.0.0.1:4180/${target}/#/`);
      await page.getByRole("heading", { name: "声学基础", exact: true }).waitFor();
      await page.bringToFront();
      // Include every catalog preview in both builds, independent of Edge's lazy-load timing.
      await page.locator(".lecture-thumbnail").evaluateAll(async (imgs) => {
        imgs.forEach((img) => {
          img.loading = "eager";
        });
        await Promise.all(imgs.map((img) => img.decode()));
      });
      await page.waitForLoadState("networkidle");
      await page.evaluate(() => document.fonts.ready);
      assert.equal(await page.evaluate(() => document.documentElement.scrollWidth), width);
      if (target === "current") {
        await page.screenshot({
          path: `screenshots/p0/home-${width === 1440 ? "desktop" : "mobile"}.png`,
          fullPage: true,
        });
        await page.screenshot({ path: `outputs/home-current-${width}.png` });
      }
      const resources = await page.evaluate(() =>
        [
          ...performance.getEntriesByType("resource"),
          ...performance.getEntriesByType("navigation"),
        ].map((e) => new URL(e.name).pathname),
      );
      const paths = [...new Set(resources)].filter((p) => served.has(p));
      const sums = paths.reduce(
        (a, p) => ({ raw: a.raw + served.get(p).raw, gzip: a.gzip + served.get(p).gzip }),
        { raw: 0, gzip: 0 },
      );
      assert.deepEqual(errors, []);
      records.push({ target, width, ...sums, paths });
      await page.close();
    }
  fs.writeFileSync("outputs/home-resources.json", JSON.stringify(records, null, 2));
  for (const width of [1440, 390]) {
    const before = records.find((r) => r.target === "baseline" && r.width === width),
      after = records.find((r) => r.target === "current" && r.width === width);
    console.log(
      `${width}: raw ${before.raw} -> ${after.raw}; gzip ${before.gzip} -> ${after.gzip} bytes`,
    );
    assert.ok(
      after.raw <= before.raw && after.gzip <= before.gzip,
      "First viewport resources must not increase",
    );
  }
} finally {
  server.close();
  await Promise.race([context?.close(), new Promise((resolve) => setTimeout(resolve, 5000))]);
}
process.exit(0);
