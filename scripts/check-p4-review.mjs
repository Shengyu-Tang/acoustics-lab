import assert from "node:assert/strict";
import fs from "node:fs";
import { models } from "./p4-models.mjs";
import { build, stop } from "esbuild";

const { lectures, matlab } = await models();
await build({
  entryPoints: ["src/plot/layout.ts"],
  bundle: true,
  platform: "node",
  format: "esm",
  outfile: "outputs/P4/layout.mjs",
});
stop();
const { labelLanes, textWidth } = await import("../outputs/P4/layout.mjs");
const failures = [],
  audit = [];
const check = (name, fn) => {
  try {
    fn();
  } catch (e) {
    failures.push(`${name}: ${e.message}`);
  }
};
const lecture = (id) => lectures.find((l) => l.id === id);

check("A1 no geometry-only filler panels", () => {
  for (const l of lectures)
    for (const f of l.figures)
      for (const p of f.plot(l.defaults, 0)) {
        if (p.field || p.schematic) continue;
        const s = p.series ?? [];
        const closed =
          s.length === 1 &&
          s[0].points.length > 20 &&
          Math.hypot(...s[0].points[0].map((v, i) => v - s[0].points.at(-1)[i])) < 1e-10;
        assert.ok(
          !(s.length === 1 && (s[0].geometry || (closed && /位置|坐标/.test(p.xlabel + p.ylabel)))),
          `${f.number}: ${p.title}`,
        );
      }
  assert.ok(!fs.readFileSync("src/content/p4.ts", "utf8").includes("function circle("));
});
check("A1 radius acts on physical data or is explained", () => {
  for (const id of ["4.1", "4.2.2", "4.4.3", "4.4.4", "5.2", "6.1"]) {
    const l = lecture(id);
    for (const f of l.figures) {
      if (f.independentOf?.includes("a")) {
        assert.ok(f.dimensionlessComparison);
        continue;
      }
      const physical = (p) =>
        f
          .plot(p, 0)
          .filter((q) => !q.schematic && !/示意坐标/.test(q.ylabel))
          .map((q) => [q.series?.filter((s) => !s.geometry).map((s) => s.points), q.annotations]);
      assert.notEqual(
        JSON.stringify(physical(l.defaults)),
        JSON.stringify(physical({ ...l.defaults, a: l.defaults.a * 1.4 })),
        f.number,
      );
    }
  }
});
check("A2 equivalent circuit and four impedance components", () => {
  const l = lecture("4.1"),
    panels = l.figures[0].plot(l.defaults, 0);
  assert.equal(panels[0].schematic, "force-voltage");
  for (const symbol of ["F", "M", "1/D", "Rₘ", "Zᵣ"])
    assert.ok(
      panels[0].textLabels.some((t) => t.text === symbol),
      symbol,
    );
  assert.ok(panels[1].xlabel.includes("Hz"));
  assert.equal(panels[1].series.length, 4);
  assert.ok(
    panels[1].annotations.some((a) => a.label.includes("ka = 1") && a.label.includes("Hz")),
  );
  const code = matlab(panels, 2, 1, "circuit");
  assert.ok(code.includes("axis off"));
});
check("A3 all default physical response panels vary by at least 5%", () => {
  for (const l of lectures)
    for (const f of [
      ...l.figures,
      ...l.examples.map((e) => ({
        number: l.id + "-E1",
        plot: (p) => [e.plot(p)],
        defaults: e.defaults,
      })),
    ]) {
      for (const [i, p] of f.plot(f.defaults ?? l.defaults, 0).entries()) {
        if (p.field || p.schematic || p.equalAspect || /示意坐标/.test(p.ylabel)) continue;
        const curves = (p.series ?? []).filter(
          (s) => !s.geometry && s.style !== "none" && s.points.length > 10,
        );
        const variations = curves.map((s) => {
          const ys = s.points
            .filter(([x, y]) => x >= p.xlim[0] && x <= p.xlim[1] && Number.isFinite(y))
            .map((pt) => pt[1]);
          return (Math.max(...ys) - Math.min(...ys)) / Math.max(1e-20, ...ys.map(Math.abs));
        });
        if (!variations.length) continue;
        audit.push({ figure: f.number, panel: i + 1, variations, decibels: /dB/.test(p.ylabel) });
        assert.ok(
          /dB/.test(p.ylabel) || variations.some((v) => v >= 0.05),
          `${f.number}[${i + 1}]: ${variations}`,
        );
      }
    }
});
check("A3 reciprocity curves coincide with visible directivity", () => {
  const l = lecture("6.2"),
    p = l.figures[1].plot(l.defaults, 0)[0];
  assert.deepEqual(p.series[0].points, p.series[1].points);
  const ys = p.series[0].points.map((p) => p[1]);
  assert.ok(Math.max(...ys) - Math.min(...ys) > 0.3);
});
check("B1 boundary gap excludes quadrature spikes", () => {
  const l = lecture("4.4.2"),
    p = l.examples[0].plot(l.examples[0].defaults),
    a = l.defaults.a;
  for (const s of p.series.filter((s) => s.points.length > 10)) {
    assert.ok(
      s.points.every(([x]) => x <= 0.8 * a + 1e-12) ||
        s.points.every(([x]) => x >= 1.2 * a - 1e-12),
      s.name,
    );
  }
});
check("B2 annotation and region labels never overlap", () => {
  const l = lecture("4.4.4");
  for (const a of [0.025, 0.05, 0.08])
    for (const f of [40000, 50000, 80000])
      for (const width of [280, 440, 1200]) {
        const p = l.figures[0].plot({ ...l.defaults, a, f }, 0)[0];
        const xs = (v) => Math.log(v / p.xlim[0]) / Math.log(p.xlim[1] / p.xlim[0]);
        const labels = labelLanes(p, 0, width, xs);
        for (const [i, u] of labels.entries())
          for (const v of labels.slice(i + 1))
            assert.ok(
              u.lane !== v.lane ||
                u.x + textWidth(u.text) + 7 <= v.x ||
                v.x + textWidth(v.text) + 7 <= u.x,
              `${a},${f},${width}: ${u.text}/${v.text}`,
            );
      }
});
check("B3 front hemisphere export", () => {
  const l = lecture("4.4.3"),
    p = l.figures[0].plot(l.defaults, 0)[0];
  assert.deepEqual(p.polarAngleLimits, [-90, 90]);
  assert.ok(matlab([p], 1, 1, "front").includes("thetalim([-90 90])"));
});
check("B4 dipole lobes retain colour detail", () => {
  const l = lecture("4.3"),
    p = l.figures[0].plot(l.defaults, 0)[0],
    f = p.field;
  assert.ok(f.label.includes("dB"));
  const z = f.z.flat(),
    saturated = z.filter((v) => v <= f.limits[0] || v >= f.limits[1]).length / z.length;
  assert.ok(saturated < 0.1, `saturated ${saturated}`);
});
check("B5 authoritative 17 lectures", () => {
  assert.equal(lectures.length, 17);
  const spec = fs.readFileSync("specs/redesign/00-总体需求与验收标准.md", "utf8");
  assert.match(spec, /4\.1–7\.3 共 17 讲/);
});
fs.writeFileSync("outputs/P4/review-default-audit.json", JSON.stringify(audit, null, 2));
if (failures.length) {
  console.error(failures.join("\n"));
  process.exitCode = 1;
} else console.log("PASS P4-1 A1–A3/B1–B5, including default response audit");
