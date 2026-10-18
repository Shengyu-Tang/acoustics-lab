// Full SPA route sweep plus independent cold-load measurements; all writes stay in this clone.
import fs from "node:fs";
import path from "node:path";
import http from "node:http";
import assert from "node:assert/strict";
import { chromium } from "playwright";
const evidence = "specs/redesign/screenshots/P6";
const work = path.resolve("outputs/P6/browser");
const site = work + "/site";
fs.cpSync("docs", site, { recursive: true });
fs.mkdirSync(work + "/tmp", { recursive: true });
fs.mkdirSync(evidence, { recursive: true });
fs.mkdirSync(work + "/full", { recursive: true });
process.env.TEMP = process.env.TMP = work + "/tmp";
const mime = {
  ".js": "text/javascript",
  ".css": "text/css",
  ".html": "text/html",
  ".svg": "image/svg+xml",
  ".jpg": "image/jpeg",
  ".woff2": "font/woff2",
};
const server = http.createServer((req, res) => {
  const u = new URL(req.url, "http://localhost");
  const parts = decodeURIComponent(u.pathname).split("/").filter(Boolean);
  const target = parts.shift();
  const base = path.resolve(target === "baseline" ? "outputs/p6-baseline" : site);
  const file = path.resolve(base, parts.join("/") || "index.html");
  if (!file.startsWith(base + path.sep) || !fs.existsSync(file)) {
    res.writeHead(404);
    res.end();
    return;
  }
  res.writeHead(200, {
    "Content-Type": mime[path.extname(file)] || "application/octet-stream",
    "Cache-Control": "no-store",
  });
  res.end(fs.readFileSync(file));
});
await new Promise((r) => server.listen(4186, "127.0.0.1", r));
const topics = JSON.parse(fs.readFileSync("src/topics.json", "utf8"));
const projects = JSON.parse(fs.readFileSync("src/projects.json", "utf8"));
const routes = [
  ["home", "#/"],
  ["calendar", "#/calendar"],
  ["teacher", "#/about"],
  ["feedback", "#/feedback"],
  ["mind-map", "#/map"],
  ["knowledge-graph", "#/map", "graph"],
  ["plot-demo", "#/plot-demo"],
  ...["layer", "array", "duct"].map((x) => ["compare-" + x, "#/compare?experiment=" + x]),
  ["cases", "#/cases"],
  ...projects.map((p) => ["case-" + p.id, "#/cases?project=" + p.id]),
  ...topics.map((t) => ["lecture-" + t.id, "#/lab?topic=" + t.id]),
];
let browser;
const results = [],
  errors = [],
  failures = [],
  resourceReview = [];
try {
  browser = await chromium.launch({ channel: "msedge", headless: true });
  for (const width of [1440, 390]) {
    const context = await browser.newContext({
      viewport: { width, height: width === 1440 ? 900 : 844 },
      reducedMotion: "reduce",
    });
    const page = await context.newPage();
    page.setDefaultTimeout(90000);
    let active = { name: "", resource: [] };
    page.on("pageerror", (e) => errors.push({ name: active.name, width, error: e.message }));
    page.on("console", (m) => {
      if (m.type() === "error") errors.push({ name: active.name, width, error: m.text() });
    });
    page.on("response", (r) => {
      const u = new URL(r.url());
      if (/\.(js|css|woff2?|jpg)$/.test(u.pathname)) active.resource.push(u.pathname);
    });
    for (const [name, hash, view] of routes) {
      active = { name, resource: [] };
      const resource = active.resource;
      await page.goto("http://127.0.0.1:4186/current/" + hash, { waitUntil: "domcontentloaded" });
      const expected = name.startsWith("lecture-")
        ? name.slice(8) + " " + topics.find((t) => t.id === name.slice(8)).title
        : name.startsWith("case")
          ? "综合工程案例"
          : name.startsWith("compare-")
            ? "对照实验"
            : {
                home: "声学基础",
                calendar: "教学日历",
                teacher: "教师主页",
                feedback: "建议与反馈",
                "mind-map": "课程知识导图",
                "knowledge-graph": "课程知识导图",
                "plot-demo": "绘图组件演示",
              }[name];
      await page.getByRole("heading", { level: 1, name: expected, exact: true }).waitFor();
      if (name.startsWith("case"))
        await page
          .locator(
            `.case-index a[aria-current][href="#/cases?project=${new URLSearchParams(hash.split("?")[1]).get("project") ?? "ocean"}"]`,
          )
          .waitFor();
      if (name.startsWith("compare-"))
        await page.waitForFunction(
          (hash) =>
            document.querySelector(".comparison-switch [aria-current]")?.getAttribute("href") ===
            hash,
          hash,
        );
      if (name.startsWith("lecture-")) await page.locator("#simulation").waitFor();
      if (view) await page.getByRole("button", { name: "知识图谱", exact: true }).click();
      if (view) await page.locator(".atlas-scene canvas").waitFor();
      await page.waitForLoadState("networkidle");
      await page.evaluate(() => document.fonts.ready);
      await page.waitForTimeout(100);
      const layout = await page.evaluate(() => {
        const visible = (el) => {
          for (let parent = el.parentElement; parent; parent = parent.parentElement)
            if (
              parent.matches("details:not([open])") &&
              !parent.querySelector(":scope > summary")?.contains(el)
            )
              return false;
          return el.getClientRects().length && getComputedStyle(el).visibility !== "hidden";
        };
        const controls = [...document.querySelectorAll("button,input,select,summary,a:not(svg a)")]
          .filter(visible)
          .map((el) => {
            const target = ["checkbox", "radio"].includes(el.type)
              ? (el.closest("label") ?? el)
              : el;
            const b = target.getBoundingClientRect();
            return {
              text: (el.getAttribute("aria-label") || el.textContent || el.id).slice(0, 70),
              height: b.height,
              width: b.width,
              type: el.type,
            };
          });
        const decorations = [...document.querySelectorAll("main *, .site-header *")]
          .filter((el) => visible(el) && !el.closest("svg"))
          .flatMap((el) => {
            const s = getComputedStyle(el);
            return s.boxShadow !== "none" ||
              /gradient/.test(s.backgroundImage) ||
              parseFloat(s.borderRadius) > 4
              ? [
                  {
                    tag: el.tagName,
                    class: el.className,
                    shadow: s.boxShadow,
                    background: s.backgroundImage,
                    radius: s.borderRadius,
                  },
                ]
              : [];
          });
        // Compare actual text fragments, including adjacent rows. Exclude SVG,
        // math scripts and intentional local scrolling viewports.
        const walker = document.createTreeWalker(
          document.querySelector("main"),
          NodeFilter.SHOW_TEXT,
        );
        const rects = [];
        while (walker.nextNode()) {
          const n = walker.currentNode,
            el = n.parentElement;
          if (
            !n.textContent.trim() ||
            !visible(el) ||
            el.closest("svg,.katex,script,style,.tree-viewport,.atlas-scene,select,.math-text")
          )
            continue;
          const range = document.createRange();
          range.selectNodeContents(n);
          for (const b of range.getClientRects())
            if (b.width > 2 && b.height > 2)
              rects.push({
                text: n.textContent.trim().slice(0, 35),
                left: b.left,
                right: b.right,
                top: b.top,
                bottom: b.bottom,
              });
        }
        const overlaps = [];
        for (let i = 0; i < rects.length; i++)
          for (let j = i + 1; j < rects.length; j++) {
            const a = rects[i],
              b = rects[j];
            if (
              Math.min(a.right, b.right) - Math.max(a.left, b.left) > 2 &&
              Math.min(a.bottom, b.bottom) - Math.max(a.top, b.top) > 3
            )
              overlaps.push([a.text, b.text]);
          }
        return {
          scrollWidth: document.documentElement.scrollWidth,
          controls,
          overlaps,
          decorations,
        };
      });
      const small = layout.controls.filter((c) => c.height < 31.5 || c.width < 31.5);
      if (
        layout.scrollWidth !== width ||
        small.length ||
        layout.overlaps.length ||
        layout.decorations.length
      )
        failures.push({
          name,
          width,
          scrollWidth: layout.scrollWidth,
          small,
          overlaps: layout.overlaps,
          decorations: layout.decorations,
        });
      await page.screenshot({ path: `${evidence}/${name}-${width}.jpg`, quality: 75 });
      await page.screenshot({
        path: `${work}/full/${name}-${width}.jpg`,
        quality: 65,
        fullPage: true,
      });
      if (name === "calendar") {
        await page.locator(".calendar-item").nth(5).locator("summary").click();
        await page
          .locator(".calendar-item")
          .nth(5)
          .screenshot({ path: `${evidence}/calendar-session6-${width}.png` });
      }
      if (
        ["lecture-2.3", "lecture-3.3.2", "lecture-6.2", "case-transport", "case-ocean"].includes(
          name,
        )
      )
        await page
          .locator(
            name.startsWith("lecture")
              ? "#simulation .matlab-figure"
              : ".calculation-example .matlab-figure",
          )
          .first()
          .screenshot({ path: `${evidence}/${name}-figure-${width}.png` });
      const js = resource.filter((f) => f.endsWith(".js"));
      results.push({
        name,
        hash,
        width,
        screenshot: `screenshots/P6/${name}-${width}.jpg`,
        scrollWidth: layout.scrollWidth,
        controls: layout.controls.length,
        small: small.length,
        overlaps: layout.overlaps.length,
        decorations: layout.decorations.length,
      });
      resourceReview.push({
        name,
        width,
        js: js.map((f) => ({
          file: f.split("/").at(-1),
          bytes: fs.statSync(site + "/" + f.split("/current/")[1]).size,
        })),
        fonts: resource.filter((f) => /woff/.test(f)),
      });
      if (name === "home") {
        const loaded = resourceReview.at(-1);
        assert.ok(
          loaded.js.reduce((sum, f) => sum + f.bytes, 0) < 300000,
          "homepage JS below 300 kB before gzip",
        );
        assert.deepEqual(loaded.fonts, [], "homepage does not request KaTeX fonts");
        assert.ok(
          !loaded.js.some((f) => /OrbitControls|Scene3D|ComparisonScene/.test(f.file)),
          "homepage does not load three.js scenes",
        );
      }
      if (results.length % 20 === 0)
        console.log("Captured and checked " + results.length + " route/viewports");
    }
    await context.close();
  }
  fs.mkdirSync("specs/redesign/evidence/P6", { recursive: true });
  fs.writeFileSync(
    "specs/redesign/evidence/P6/browser.json",
    JSON.stringify(
      { results, errors, failures, resourceReview, coldMeasurementsComplete: false },
      null,
      2,
    ) + "\n",
  );
  // Same browser and viewport, cold baseline versus current homepage.
  for (const target of fs.existsSync("outputs/p6-baseline/index.html")
    ? ["baseline", "current"]
    : ["current"])
    for (const width of [1440, 390]) {
      for (const [name, hash] of [
        ["home", "#/"],
        ["lecture-1.1.1", "#/lab?topic=1.1.1"],
        ["lecture-3.6.3", "#/lab?topic=3.6.3"],
        ["teacher", "#/about"],
        ["mind-map", "#/map"],
      ]) {
        const context = await browser.newContext({
          viewport: { width, height: width === 1440 ? 900 : 844 },
        });
        const page = await context.newPage();
        page.setDefaultTimeout(90000);
        console.log(`Measuring cold ${target} ${name} ${width}`);
        const resources = [];
        page.on("response", (r) => resources.push(new URL(r.url()).pathname));
        await page.goto(`http://127.0.0.1:4186/${target}/${hash}`, {
          waitUntil: "domcontentloaded",
        });
        await page.locator("main h1").waitFor();
        if (name.startsWith("lecture-")) await page.locator(".matlab-figure").first().waitFor();
        await page.waitForLoadState("networkidle");
        const files = [...new Set(resources)].map((f) => {
          const file =
            (target === "baseline" ? "outputs/p6-baseline/" : site + "/") +
            f.split(`/${target}/`)[1];
          return { file: f.split("/").at(-1), bytes: fs.statSync(file).size };
        });
        resourceReview.push({
          name,
          target,
          width,
          totalBytes: files.reduce((s, f) => s + f.bytes, 0),
          jsBytes: files.filter((f) => f.file.endsWith(".js")).reduce((s, f) => s + f.bytes, 0),
          files,
        });
        await context.close();
      }
    }
} finally {
  await browser?.close();
  server.close();
}
fs.mkdirSync("specs/redesign/evidence/P6", { recursive: true });
fs.writeFileSync(
  "specs/redesign/evidence/P6/browser.json",
  JSON.stringify(
    { results, errors, failures, resourceReview, coldMeasurementsComplete: true },
    null,
    2,
  ) + "\n",
);
assert.deepEqual(errors, [], "console errors");
assert.deepEqual(failures, [], "layout and tap targets");
for (const after of resourceReview.filter((r) => r.target === "current")) {
  const before = resourceReview.find(
    (r) => r.target === "baseline" && r.name === after.name && r.width === after.width,
  );
  if (before)
    assert.ok(
      after.totalBytes < before.totalBytes,
      `${after.name} ${after.width}: cold resources decreased`,
    );
}
console.log(
  `PASS: ${results.length} route/viewports, no overflow, overlapping text or undersized controls.`,
);
