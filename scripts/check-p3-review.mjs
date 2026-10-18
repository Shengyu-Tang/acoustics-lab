import fs from "node:fs";
import assert from "node:assert/strict";
import { models } from "./review-p3-models.mjs";
const { lectures, fmt } = await models();
const failures = [];
function check(name, fn) {
  try {
    fn();
    console.log("PASS " + name);
  } catch (e) {
    failures.push(name + ": " + e.message);
    console.log("FAIL " + name + ": " + e.message);
  }
}
check("A1 individually designed physical example plots", () => {
  for (const file of [
    "src/content/p2.ts",
    "src/content/p3.ts",
    ...lectures.map((l) => "src/content/lectures/" + l.id + ".ts"),
  ])
    assert.ok(
      !fs.readFileSync(file, "utf8").includes("answerCurve"),
      file + " still uses answerCurve",
    );
  const designs = new Set();
  for (const l of lectures)
    for (const e of l.examples) {
      const p = e.plot(e.defaults);
      assert.ok(
        !/qaRange|参考计算|参考解|本题数值/.test(JSON.stringify(p)),
        l.id + " uses generic sweep",
      );
      for (const d of e.given) {
        const v = e.defaults[d.key];
        if (v !== 0)
          assert.ok(
            !(Math.abs(p.xlim[0] / v - 0.9) < 0.03 && Math.abs(p.xlim[1] / v - 1.1) < 0.03),
            l.id + " sweeps known parameter ±10%",
          );
      }
      // Series meanings, axes and geometry must describe a different physical construction.
      const shape = JSON.stringify([
        p.xlabel,
        p.ylabel,
        p.series?.map((s) => [s.name.replace(/[-+]?\d+(\.\d+)?/g, "#"), s.kind, s.axis, s.style]),
        !!p.field,
        p.equalAspect,
      ]);
      assert.ok(!designs.has(shape), l.id + " duplicates another lecture design");
      designs.add(shape);
      assert.ok(p.matlabModel?.series.length === p.series.length, l.id + " missing editable model");
    }
});
check("A3 complementary time-averaged standing-wave energies", () => {
  const l = lectures.find((l) => l.id === "3.6.6");
  for (const pa of [0.1, 1, 3])
    for (const t of [0, 1 / (8 * l.defaults.f)]) {
      const p = { ...l.defaults, pa };
      const q = l.figures[1].plot(p, t)[0];
      const [potential, kinetic] = q.series;
      const expected = (pa * pa) / (p.Z1 * p.c);
      assert.ok(
        Math.max(...potential.points.map((pt) => pt[1])) > expected * 0.9,
        "potential energy is zero",
      );
      assert.ok(
        Math.max(...kinetic.points.map((pt) => pt[1])) > expected * 0.9,
        "kinetic energy is zero",
      );
      potential.points.forEach(([x, y], i) =>
        assert.ok(
          Math.abs(y + kinetic.points[i][1] - expected) < expected * 1e-9,
          "total energy depends on distance",
        ),
      );
      assert.equal(q.rightLabel, undefined, "unused intensity axis remains");
    }
});
check("A2 worksheet wrapper preserves physical axis definitions", () => {
  const l = lectures.find((l) => l.id === "3.6.6"),
    e = l.examples[0],
    q = e.plot(e.defaults);
  assert.equal(q.ylabel, "振速幅值 (m/s)", "an answer marker must not redefine the physical axis");
  const ray = lectures.find((l) => l.id === "3.6.11");
  assert.equal(ray.examples[0].plot(ray.examples[0].defaults).ylabel, "示意坐标 y (m)");
});
check("A4 binary fields are categorical throughout P2/P3", () => {
  for (const l of lectures)
    for (const f of l.figures)
      for (const p of f.plot(l.defaults, 0))
        if (p.field) {
          const vals = [...new Set(p.field.z.flat())];
          if (vals.length === 2 && vals.every((v) => v === 0 || v === 1))
            assert.equal(
              p.field.categories?.length,
              2,
              l.id + " binary field has continuous scale",
            );
        }
});
check("B1/B2 dimensionless and scientific answer titles/readouts", () => {
  for (const l of lectures)
    for (const e of l.examples) {
      const q = e.plot(e.defaults);
      assert.ok(!/[—]/.test(q.title), l.id + " dimensionless dash");
    }
  assert.equal(fmt(1.333333333e-6), "1.333×10⁻⁶");
  assert.ok(
    lectures
      .find((l) => l.id === "3.6.6")
      .examples[0].plot(lectures.find((l) => l.id === "3.6.6").examples[0].defaults)
      .title.includes("1.333×10⁻⁶"),
  );
});
check("B3 Lloyd mirror displays finite levels without artificial zero-depth floor", () => {
  const l = lectures.find((l) => l.id === "3.8.5"),
    q = l.figures[1].plot(l.defaults, 0)[0];
  const ys = q.series[0].points.map((pt) => pt[1]).filter(Number.isFinite);
  assert.ok(q.ylim[1] - q.ylim[0] < 100, "destructive boundary sentinel stretches y axis");
  assert.ok(ys.length > 700, "finite interior interference retained");
});
fs.writeFileSync("outputs/P3-1/regressions.json", JSON.stringify({ failures }, null, 2));
assert.deepEqual(failures, []);
