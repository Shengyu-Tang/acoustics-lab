import assert from "node:assert/strict";
import fs from "node:fs";
import { createElement } from "react";
import { renderToStaticMarkup } from "react-dom/server";
import { auditData } from "./bug-audit-data.mjs";
const {
  lectures,
  engineeringCases,
  instrumentExample,
  bandwidthExample,
  grade,
  instrument,
  axisTicks,
  geometryY,
  Figure,
  ExampleWorksheet,
} = await auditData();
const flowExample = lectures.find((l) => l.id === "3.1.4").examples[0];
const flowHtml = renderToStaticMarkup(
  createElement(ExampleWorksheet, {
    example: { ...flowExample, id: "3.1.4-E1" },
    p: flowExample.defaults,
    setParameter() {},
    solution: {},
    steps: [],
    judgment: "",
    note: "",
    panel: flowExample.plot(flowExample.defaults),
    caption: "图 3.1.4-E1　质量流入与流出",
    exportScript() {},
  }),
);
assert.match(
  flowHtml.match(/<figcaption>[\s\S]*?<\/figcaption>/)?.[0] ?? "",
  /净流入/,
  "off-axis horizontal guide explanations belong in the worksheet caption",
);
assert.doesNotMatch(
  flowHtml,
  /data-annotation-label=/,
  "worksheet guide labels must not float beyond the plotted domain",
);
const matchedExample = lectures.find((l) => l.id === "3.6.5").examples[0];
const matchedPanel = matchedExample.plot({
  ...matchedExample.defaults,
  Z2: matchedExample.defaults.Z1,
});
assert.equal(matchedPanel.series[0].points[1][1], 0, "matched interface has zero reflected power");
assert.ok(
  !/NaN|Infinity|undefined/.test(
    renderToStaticMarkup(
      createElement(Figure, {
        panels: [matchedPanel],
        caption: "匹配边界",
        name: "matched-interface",
      }),
    ),
  ),
  "zero logarithmic bars render without nonfinite SVG geometry",
);
const report = {
  lectures: 0,
  states: 0,
  worksheets: 0,
  answers: 0,
  duplicateEngineeringText: [],
  failures: [],
};
function check(name, fn) {
  try {
    fn();
  } catch (error) {
    report.failures.push(`${name}: ${error.message}`);
  }
}
function panel(p) {
  for (const [key, lim] of Object.entries({ xlim: p.xlim, ylim: p.ylim, rightLim: p.rightLim })) {
    if (!lim) continue;
    assert.ok(lim.every(Number.isFinite) && lim[1] > lim[0], `${p.title}: ${key} ${lim}`);
  }
  if (p.field) assert.ok(p.field.z.flat().some(Number.isFinite), `${p.title}: empty field`);
  else
    assert.ok(
      p.series?.some((s) => s.points.some((pt) => pt.every(Number.isFinite))) || p.responseNote,
      `${p.title}: empty series without explanation`,
    );
  assert.ok(
    !/\b(?:NaN|Infinity|undefined|null)\b/.test(
      [p.title, p.xlabel, p.ylabel, p.responseNote ?? ""].join(" "),
    ),
    "invalid plot text",
  );
  if (!p.field && !geometryY(p) && !p.equalAspect && p.kind !== "polar" && !p.unboundedY) {
    for (const s of p.series ?? []) {
      if (s.style === "none" || s.geometry) continue;
      const lim = axisTicks(s.axis === "right" ? p.rightLim : p.ylim, p.yscale === "log").limits;
      for (const [x, y] of s.points)
        if (x >= p.xlim[0] && x <= p.xlim[1] && Number.isFinite(y) && (p.yscale !== "log" || y > 0))
          assert.ok(
            y >= lim[0] - 1e-8 * Math.max(1, Math.abs(lim[0])) &&
              y <= lim[1] + 1e-8 * Math.max(1, Math.abs(lim[1])),
            `${p.title}: clipped ${s.name} y=${y}, limits=${lim}`,
          );
    }
  }
}
for (const l of lectures) {
  report.lectures++;
  for (const e of l.defaults ? l.examples : []) {
    const normalize = (s) => s.replace(/[\s\p{P}\p{S}]/gu, "");
    const application = normalize(l.engineering.text),
      background = normalize(e.background);
    if (
      application &&
      background &&
      (application === background ||
        application.includes(background) ||
        background.includes(application))
    )
      report.duplicateEngineeringText.push({
        lecture: l.id,
        engineering: l.engineering.text,
        background: e.background,
      });
  }
  const defaults = l.defaults ?? { ...instrument, Rm: 400 };
  const params = l.parameters ?? l.figures[0].parameters;
  const states = [
    defaults,
    ...params.flatMap((d) => [d.min, d.max].map((n) => ({ ...defaults, [d.key]: n }))),
    Object.fromEntries(
      Object.entries(defaults).map(([k, v]) => [k, params.find((d) => d.key === k)?.min ?? v]),
    ),
    Object.fromEntries(
      Object.entries(defaults).map(([k, v]) => [k, params.find((d) => d.key === k)?.max ?? v]),
    ),
  ];
  for (const p of states) {
    report.states++;
    const name = `${l.id} ${JSON.stringify(p)}`;
    check(name, () => {
      for (const f of l.figures) for (const q of f.plot(p, l.defaults ? 0 : false)) panel(q);
      if (l.readouts)
        for (const [name, value] of l.readouts(p)) {
          // Intentional singular physical values are rendered as explanatory text by fmt.
          assert.notEqual(value, undefined, name);
        }
    });
  }
}
const examples = [
  ...lectures
    .filter((l) => l.defaults)
    .flatMap((l) => (l.examples ?? []).map((e) => ({ name: l.id + " " + e.title, e }))),
  ...engineeringCases.map((e) => ({ name: `case ${e.id}`, e })),
  ...[instrumentExample, bandwidthExample].map((e) => ({ name: e.id, e })),
];
for (const { name, e } of examples) {
  report.worksheets++;
  for (const p of [
    e.defaults,
    ...e.given.flatMap((d) =>
      [d.min, d.max].map((n) => {
        const p = { ...e.defaults, [d.key]: n };
        if (e === bandwidthExample) {
          if (p.f1 >= p.f2 && d.key === "f1") p.f2 = p.f1 + 0.1;
          if (p.f2 <= p.f1 && d.key === "f2") p.f1 = Math.max(0.1, p.f2 - 0.1);
        }
        return p;
      }),
    ),
  ])
    check(name + " " + JSON.stringify(p), () => {
      const solution = e.solve?.(p);
      for (const a of e.asks) {
        const expected = a.calc ? a.calc(p) : solution[a.key];
        assert.ok(Number.isFinite(expected), `${a.key}: nonfinite answer ${expected}`);
        assert.equal(grade(expected, expected), "正确", a.key);
        for (const factor of [0.98, 1.02])
          assert.equal(
            grade(expected * factor, expected),
            "正确",
            `${a.key}: inclusive tolerance boundary`,
          );
        for (const factor of [0.979, 1.021])
          if (expected !== 0)
            assert.notEqual(grade(expected * factor, expected), "正确", `${a.key}: tolerance`);
        for (const invalid of [NaN, Infinity, -Infinity])
          assert.equal(grade(invalid, expected), "请输入有限数值");
        report.answers++;
      }
      if (e.plot) panel(e.plot(p));
      for (const q of e.additionalPlots?.(p) ?? []) panel(q);
    });
}
fs.writeFileSync("outputs/bug-audit-1/models.json", JSON.stringify(report, null, 2));
console.log(JSON.stringify(report, null, 2));
assert.deepEqual(report.failures, [], "audit model/worksheet boundaries");
