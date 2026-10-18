import assert from "node:assert/strict";
import fs from "node:fs";
import { build } from "esbuild";
const files = fs.readdirSync("src/content/lectures").filter((f) => f.endsWith(".ts"));
fs.mkdirSync("outputs", { recursive: true });
await build({
  stdin: {
    contents:
      files
        .map((f, i) => `export {default as l${i}} from './src/content/lectures/${f}';`)
        .join("") +
      "export {default as ScriptText} from './src/ScriptText'; export {MathProse} from './src/Math';" +
      "export {default as Home} from './src/Home';" +
      "export {default as P1Lecture} from './src/P1Lecture';export {default as SampleLecture} from './src/SampleLecture';" +
      "export {example as instrument} from './src/content/examples/instrument';export {bandwidthExample as bandwidth} from './src/content/examples/bandwidth';" +
      "export {Axes} from './src/plot/Figure';export {matlab} from './src/plot/export';export {engineeringCases} from './src/content/cases';",
    resolveDir: process.cwd(),
  },
  bundle: true,
  platform: "node",
  format: "esm",
  external: ["react", "react-dom"],
  loader: { ".css": "empty" },
  define: { "import.meta.env.BASE_URL": '"/"' },
  outfile: "outputs/notation-check.mjs",
});
const all = await import("../outputs/notation-check.mjs");
const { createElement: h } = await import("react");
const { renderToStaticMarkup: render } = await import("react-dom/server");
const lectures = files.map((_, i) => all[`l${i}`]);
let strings = 0;
const issues = [];
function checkFigureText(text, name) {
  // Units, TeX commands, variable symbols and standard math operators are allowed.
  const plain = text
    .replace(/\\[A-Za-z]+/g, "")
    .replace(/\$[^$]*\$/g, "")
    .replace(
      /\b(?:Pa|MPa|GPa|Hz|kHz|kg|mm|cm|km|rad|dB|Np|Re|Im|sin|cos|tan|log|ln|lg|exp|max|min|rms|dx|dz|dt|kr|ka|kd|kL|Mq|rho)\b/g,
      "",
    )
    .replace(/ρSL|ABCDEFGH/g, "")
    .replace(/[_][A-Za-z]+/g, "");
  if (/[A-Za-z]{2,}/.test(plain)) issues.push(`${name}: English figure text: ${text}`);
}
function checkText(text, name) {
  const html = render(h(all.MathProse, { text }));
  assert.ok(!/[\u2080-\u209c]/.test(html), `${name}: unconverted subscript ${text}`);
  const plain = text
    .replace(/\$[^$]+\$/g, "")
    .replace(/\b(?:kg|rad|N|cm|m|r)(?:\/(?:s|min|m))?[²³]?(?=[\s，。；、（）(),]|$)/g, "");
  if (/[$_^]|[A-Za-z\u0370-\u03ff][²³]|[A-Za-z\u0370-\u03ff][^\s，。；、]*\//.test(plain))
    issues.push(`${name}: unmarked prose math ${text}`);
  strings++;
}
for (const l of lectures) {
  const p = l.defaults ?? all.instrument.defaults;
  const html = render(h(l.defaults ? all.P1Lecture : all.SampleLecture, { lecture: l }));
  const visible = html.replace(/\s(?:aria-label|value)="[^"]*"/g, "");
  if (/[\u2080-\u209c]/.test(visible))
    issues.push(`${l.id}: rendered subscript ${visible.match(/.{0,60}[\u2080-\u209c].{0,60}/g)}`);
  l.keyPoints.forEach((text) => checkText(text, `${l.id} key point`));
  l.formulas.forEach((f) => checkText(f.meaning, `${l.id} meaning`));
  l.questions.forEach((q) => {
    checkText(q.text, `${l.id} question`);
    checkText(q.answer, `${l.id} answer`);
  });
  checkText(l.engineering.text, `${l.id} engineering`);
  for (const f of l.figures) {
    checkText(f.title, `${l.id} caption`);
    checkFigureText(f.title, `${f.number} caption`);
    if (f.dimensionlessComparison) checkFigureText(f.dimensionlessComparison, `${f.number} note`);
    for (const panel of f.plot(p, l.defaults ? 0 : false)) {
      [
        panel.title,
        panel.xlabel,
        panel.ylabel,
        panel.rightLabel,
        panel.field?.label,
        panel.responseNote,
        ...(panel.series ?? []).map((s) => s.name),
        ...(panel.textLabels ?? []).map((s) => s.text),
        ...(panel.xtickLabels ?? []).map((s) => s.label),
        ...(panel.ytickLabels ?? []).map((s) => s.label),
      ]
        .filter(Boolean)
        .forEach((text) => checkFigureText(text, f.number));
      const svg = render(h("svg", null, h(all.Axes, { panel })));
      assert.ok(!/(?:NaN|Infinity)/.test(svg), `${f.number}: finite SVG attributes`);
      assert.ok(
        !/[\u2080-\u209c⁰¹²³⁴⁵⁶⁷⁸⁹⁺⁻⁼⁽⁾ⁿⁱ]/.test(svg),
        `${f.number}: rendered SVG script glyph`,
      );
    }
  }
  const examples = l.defaults ? l.examples : [l.id === "1.2.4" ? all.instrument : all.bandwidth];
  for (const e of examples) {
    checkText(e.background, `${l.id} background`);
    e.hints.forEach((text) => checkText(text, `${l.id} hint`));
    if (l.defaults) {
      const q = e.plot(e.defaults);
      const answer = e.asks.find((a) =>
        q.title.startsWith(a.text.replace(/^\(\d+\)\s*/, "") + " = "),
      );
      assert.ok(answer, l.id + " example title names a requested answer");
      const labels = (q.annotations ?? []).map((a) => a.label);
      assert.equal(new Set(labels).size, labels.length, l.id + " distinct annotation labels");
    }
  }
}
for (const e of all.engineeringCases) {
  for (const q of [e.plot(e.defaults), ...(e.additionalPlots?.(e.defaults) ?? [])]) {
    [
      q.title,
      q.xlabel,
      q.ylabel,
      q.rightLabel,
      q.responseNote,
      ...q.series.map((s) => s.name),
      ...(q.annotations ?? []).map((a) => a.label),
    ]
      .filter(Boolean)
      .forEach((t) => checkFigureText(t, e.id));
    const svg = render(h("svg", null, h(all.Axes, { panel: q })));
    assert.ok(!/(?:NaN|Infinity)/.test(svg), e.id + " finite case SVG");
    assert.ok(!/[\u2080-\u209c⁰¹²³⁴⁵⁶⁷⁸⁹⁺⁻⁼⁽⁾ⁿⁱ]/.test(svg), e.id + " case SVG scripts");
  }
}
// All assigned characters in U+2080–U+209C, grouped scripts, and Unicode superscripts.
for (const text of [
  "Rₘ F₀ Qₘ xₘ bₙ f₁ f₂",
  "x_{lim} f_target T_zz",
  "s⁻¹ m/s² e⁻π",
  "₀₁₂₃₄₅₆₇₈₉₊₋₌₍₎ₐₑₒₓₔₕₖₗₘₙₚₛₜ",
]) {
  const html = render(h(all.ScriptText, { text }));
  const svg = render(h("text", null, h(all.ScriptText, { text, svg: true })));
  assert.ok(!/[\u2080-\u209c⁰¹²³⁴⁵⁶⁷⁸⁹⁺⁻⁼⁽⁾ⁿⁱ]/.test(html + svg));
  assert.match(svg, /baseline-shift="(?:sub|super)" font-size="75%"/);
}
assert.equal(render(h(all.ScriptText, { text: "x_{lim}" })), "x<sub>lim</sub>");
assert.equal(render(h(all.ScriptText, { text: "e⁻π" })), "e<sup>-π</sup>");
assert.equal(
  render(h(all.ScriptText, { text: "kᵧ uᵣ pᵢ Hⱼ" })),
  "k<sub>y</sub> u<sub>r</sub> p<sub>i</sub> H<sub>j</sub>",
);
assert.equal(
  render(h(all.ScriptText, { text: "Rₘ F₀ Qₘ bₙ f₁ f₂" })),
  "R<sub>m</sub> F<sub>0</sub> Q<sub>m</sub> b<sub>n</sub> f<sub>1</sub> f<sub>2</sub>",
);
// The home page renders a different week's goals throughout the semester.
const RealDate = Date;
try {
  for (const week of JSON.parse(fs.readFileSync("src/calendar.json", "utf8"))) {
    const [year, month, day] = week.date.split(".").map(Number);
    globalThis.Date = class extends RealDate {
      constructor(...args) {
        super(...(args.length ? args : [year, month - 1, day, 12]));
      }
    };
    const html = render(h(all.Home));
    assert.ok(!/[\u2080-\u209c]/.test(html), `home goals for ${week.date}`);
  }
} finally {
  globalThis.Date = RealDate;
}
const tex = all.matlab(
  [{ title: "Qₘ", xlabel: "f₀", ylabel: "xₘ", xlim: [0, 1], ylim: [0, 1], series: [] }],
  1,
  1,
  "scripts",
);
assert.ok(
  tex.includes("Q_{m}") && tex.includes("f_{0}") && tex.includes("x_{m}"),
  "MATLAB toTex still consumes original Unicode labels",
);
const acousticTex = all.matlab(
  [
    {
      title: "Eₖ Eₚ kᵧ uᵣ pᵢ Hⱼ",
      xlabel: "pₐ",
      ylabel: "u_r",
      xlim: [0, 1],
      ylim: [0, 1],
      series: [],
    },
  ],
  1,
  1,
  "P2 notation",
);
assert.ok(
  acousticTex.includes("E_{k}") && acousticTex.includes("E_{p}") && acousticTex.includes("p_{a}"),
);
assert.ok(!/[\u2080-\u209c]/.test(acousticTex), "all P2 MATLAB subscripts become TeX");
assert.ok(!/[ᵢᵣᵧⱼ]/.test(acousticTex), "modifier-block subscripts become portable TeX");
assert.ok(
  acousticTex.includes("k_{y}") &&
    acousticTex.includes("u_{r}") &&
    acousticTex.includes("p_{i}") &&
    acousticTex.includes("H_{j}"),
);
const nabla = all.matlab(
  [{ title: "∇²p", xlabel: "x", ylabel: "p", xlim: [0, 1], ylim: [0, 1], series: [] }],
  1,
  1,
  "gradient notation",
);
assert.ok(nabla.includes("\\nabla "));
assert.deepEqual(issues, [], "unmarked prose math");
console.log(
  `PASS: ${lectures.length} lectures, ${strings} prose strings, HTML/SVG scripts and MATLAB toTex compatibility`,
);
