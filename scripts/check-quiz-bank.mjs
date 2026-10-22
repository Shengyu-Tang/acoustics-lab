import assert from "node:assert/strict";
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";
import ts from "typescript";
import katex from "katex";
import { loadBanks, renderReview, quantityText, root } from "./quiz-bank-review.mjs";
import { chapter3Units, chapter3Methods } from "./quiz-bank-numeric-ch3.mjs";

const readJson = (relative) => JSON.parse(fs.readFileSync(path.join(root, relative), "utf8"));
export const schema = readJson("specs/redesign/quiz-bank.schema.json");
const same = (a, b) => JSON.stringify(a) === JSON.stringify(b);
const own = (v, k) => Object.hasOwn(v, k);

// Dependency-free validation of the JSON Schema vocabulary used by our shared schema.
// This is deliberately not a general-purpose JSON Schema engine. Unknown keywords fail
// closed so adding a schema constraint cannot silently bypass npm test.
const keywords = new Set([
  "$schema",
  "$id",
  "$defs",
  "$ref",
  "title",
  "description",
  "teacherOnly",
  "type",
  "const",
  "enum",
  "properties",
  "required",
  "additionalProperties",
  "items",
  "minItems",
  "maxItems",
  "uniqueItems",
  "minLength",
  "pattern",
  "minimum",
  "maximum",
  "minProperties",
  "allOf",
  "oneOf",
  "not",
  "if",
  "then",
  "else",
]);
export function validateSchema(value, rule = schema, at = "$", errors = []) {
  if (rule === true) return errors;
  if (rule === false) {
    errors.push(`${at}: forbidden`);
    return errors;
  }
  for (const key of Object.keys(rule))
    assert.ok(keywords.has(key), `Unsupported schema keyword: ${key}`);
  const fail = (text) => errors.push(`${at}: ${text}`);
  if (rule.$ref) {
    assert.ok(rule.$ref.startsWith("#/"), "Only local schema references are supported");
    const target = rule.$ref
      .slice(2)
      .split("/")
      .reduce((v, k) => v[k], schema);
    assert.ok(target, `Unknown schema reference: ${rule.$ref}`);
    validateSchema(value, target, at, errors);
  }
  if (rule.type) {
    const matches =
      rule.type === "array"
        ? Array.isArray(value)
        : rule.type === "object"
          ? value !== null && typeof value === "object" && !Array.isArray(value)
          : rule.type === "integer"
            ? Number.isInteger(value)
            : rule.type === "number"
              ? typeof value === "number" && Number.isFinite(value)
              : typeof value === rule.type;
    if (!matches) {
      fail(`expected ${rule.type}`);
      return errors;
    }
  }
  if (own(rule, "const") && !same(value, rule.const))
    fail(`expected constant ${JSON.stringify(rule.const)}`);
  if (rule.enum && !rule.enum.some((v) => same(v, value))) fail("not in enum");
  if (typeof value === "string") {
    if (value.length < (rule.minLength ?? 0)) fail("string too short");
    if (rule.pattern && !new RegExp(rule.pattern, "u").test(value))
      fail(`does not match ${rule.pattern}`);
  }
  if (typeof value === "number") {
    if (!Number.isFinite(value)) fail("nonfinite number");
    if (value < (rule.minimum ?? -Infinity)) fail("below minimum");
    if (value > (rule.maximum ?? Infinity)) fail("above maximum");
  }
  if (Array.isArray(value)) {
    if (value.length < (rule.minItems ?? 0)) fail("too few items");
    if (value.length > (rule.maxItems ?? Infinity)) fail("too many items");
    if (rule.uniqueItems && new Set(value.map((v) => JSON.stringify(v))).size !== value.length)
      fail("duplicate items");
    if (rule.items) value.forEach((v, i) => validateSchema(v, rule.items, `${at}[${i}]`, errors));
  } else if (value !== null && typeof value === "object") {
    if (Object.keys(value).length < (rule.minProperties ?? 0)) fail("too few properties");
    for (const k of rule.required ?? []) if (!own(value, k)) fail(`missing ${k}`);
    for (const [k, v] of Object.entries(value)) {
      if (own(rule.properties ?? {}, k))
        validateSchema(v, rule.properties[k], `${at}.${k}`, errors);
      else if (rule.additionalProperties === false) fail(`unknown property ${k}`);
      else if (typeof rule.additionalProperties === "object")
        validateSchema(v, rule.additionalProperties, `${at}.${k}`, errors);
    }
  }
  for (const sub of rule.allOf ?? []) validateSchema(value, sub, at, errors);
  if (rule.oneOf) {
    const count = rule.oneOf.filter((r) => validateSchema(value, r, at, []).length === 0).length;
    if (count !== 1) fail(`expected exactly one schema branch, matched ${count}`);
  }
  if (rule.not && !validateSchema(value, rule.not, at, []).length) fail("matches forbidden schema");
  if (rule.if) {
    const branch = validateSchema(value, rule.if, at, []).length ? rule.else : rule.then;
    if (branch) validateSchema(value, branch, at, errors);
  }
  return errors;
}
function requireSchema(value, rule, context) {
  const errors = validateSchema(value, rule);
  assert.equal(errors.length, 0, `${context}\n${errors.join("\n")}`);
}

// Extract source literals without importing lecture modules or any physics implementation.
export function lectureLiterals(id) {
  const file = path.join(root, `src/content/lectures/${id}.ts`);
  const ast = ts.createSourceFile(
    file,
    fs.readFileSync(file, "utf8"),
    ts.ScriptTarget.Latest,
    true,
  );
  const keyPoints = [],
    exampleTexts = [];
  const name = (n) => (n && (ts.isIdentifier(n) || ts.isStringLiteral(n)) ? n.text : undefined);
  const visit = (n) => {
    if (
      ts.isCallExpression(n) &&
      ts.isIdentifier(n.expression) &&
      n.expression.text === "example"
    ) {
      const background = n.arguments[1];
      if (background && ts.isStringLiteral(background)) exampleTexts.push(background.text);
    }
    if (ts.isPropertyAssignment(n)) {
      if (name(n.name) === "keyPoints" && ts.isArrayLiteralExpression(n.initializer)) {
        for (const item of n.initializer.elements) {
          assert.ok(ts.isStringLiteral(item), `${id}: keyPoints must remain literal strings`);
          keyPoints.push(item.text);
        }
      }
      if (["background", "text"].includes(name(n.name)) && ts.isStringLiteral(n.initializer))
        exampleTexts.push(n.initializer.text);
    }
    ts.forEachChild(n, visit);
  };
  visit(ast);
  assert.ok(keyPoints.length, `${id}: no website key points found`);
  return { keyPoints, exampleTexts };
}

const units = {
  ...chapter3Units,
  kg: ["mass", 1],
  "N/m": ["stiffness", 1],
  "kg/s": ["resistance", 1],
  "m/s": ["velocity", 1],
  "rad/s": ["frequency-angular", 1],
  Hz: ["frequency", 1],
  kHz: ["frequency", 1000],
  s: ["time", 1],
  ms: ["time", 0.001],
  "s^-1": ["rate", 1],
  m: ["length", 1],
  mm: ["length", 0.001],
  N: ["force", 1],
  "kg/m": ["line-density", 1],
  "g/m": ["line-density", 0.001],
  "m^-1": ["curvature", 1],
  "m/s^2": ["acceleration", 1],
  Pa: ["pressure", 1],
  GPa: ["pressure", 1e9],
  "kg/m^3": ["density", 1],
  J: ["energy", 1],
  mJ: ["energy", 0.001],
  1: ["dimensionless", 1],
};
// Each method names input dimensions, its canonical algebraic formula, and an
// independently implemented calculation returning SI. No eval/Function or physics imports.
const methods = {
  ...chapter3Methods,
  "line-density-from-local-motion": {
    inputs: { T: "force", curvature: "curvature", acceleration: "acceleration" },
    unit: "line-density",
    formula: String.raw`$\rho_l=\frac{T\kappa}{a_y}$`,
    compute: ({ T, curvature, acceleration }) => {
      assert.ok(T > 0 && acceleration !== 0 && curvature * acceleration > 0);
      return (T * curvature) / acceleration;
    },
  },
  "pluck-third-ratio": {
    inputs: { alpha: "dimensionless" },
    unit: "dimensionless",
    formula: String.raw`$\left|\frac{b_3}{b_1}\right|=\left|\frac{\sin(3\pi\alpha)}{9\sin(\pi\alpha)}\right|$`,
    compute: ({ alpha }) => {
      assert.ok(alpha > 0 && alpha < 1);
      // sin(3x)/sin(x) = 3 - 4 sin²(x): independent of the displayed quotient.
      return Math.abs(3 - 4 * Math.sin(Math.PI * alpha) ** 2) / 9;
    },
  },
  "slender-rod-frequency-limit": {
    inputs: { eta: "dimensionless", d: "length", E: "pressure", rho: "density" },
    unit: "frequency",
    formula: String.raw`$f_{\max}=\frac{\eta}{d}\sqrt{\frac{E}{\rho}}$`,
    compute: ({ eta, d, E, rho }) => {
      assert.ok(eta > 0 && eta < 1 && d > 0 && E > 0 && rho > 0);
      return Math.sqrt(E / rho) / (d / eta);
    },
  },
  "young-from-free-mode-spacing": {
    inputs: { L: "length", rho: "density", fa: "frequency", fb: "frequency" },
    unit: "pressure",
    formula: String.raw`$E=4\rho L^2(f_b-f_a)^2$`,
    compute: ({ L, rho, fa, fb }) => {
      assert.ok(L > 0 && rho > 0 && fa > 0 && fb > fa);
      const speed = 2 * L * (fb - fa);
      return rho * speed * speed;
    },
  },
  "first-maximum": {
    inputs: { M: "mass", D: "stiffness", v0: "velocity" },
    unit: "time",
    formula: String.raw`$t=\frac{\pi}{2}\sqrt{\frac{M}{D}}$`,
    compute: ({ M, D, v0 }) => {
      assert.ok(v0 > 0);
      return (Math.PI * Math.sqrt(M / D)) / 2;
    },
  },
  "kinetic-remainder": {
    inputs: { E: "energy", D: "stiffness", x: "length" },
    unit: "energy",
    formula: String.raw`$E_k=E-\frac12Dx^2$`,
    compute: ({ E, D, x }) => {
      const result = E - (D * x * x) / 2;
      assert.ok(result > 0);
      return result;
    },
  },
  "overdamped-peak-time": {
    inputs: { M: "mass", D: "stiffness", Rm: "resistance", v0: "velocity" },
    unit: "time",
    formula: String.raw`$t_{\max}=\frac{\ln(s_2/s_1)}{s_1-s_2},\quad s_{1,2}=-\frac{R_m}{2M}\pm\sqrt{\left(\frac{R_m}{2M}\right)^2-\frac{D}{M}}$`,
    compute: ({ M, D, Rm, v0 }) => {
      const d = Rm / (2 * M),
        w2 = D / M;
      assert.ok(d * d > w2 && v0 > 0);
      const fast = -d - Math.sqrt(d * d - w2),
        slow = w2 / fast;
      return Math.log(fast / slow) / (slow - fast);
    },
  },
  "envelope-decay-time": {
    inputs: { M: "mass", D: "stiffness", Rm: "resistance", Astart: "length", Aend: "length" },
    unit: "time",
    formula: String.raw`$t=\frac{2M}{R_m}\ln\frac{A_{\mathrm{start}}}{A_{\mathrm{end}}}$`,
    compute: ({ M, D, Rm, Astart, Aend }) => {
      assert.ok((Rm / (2 * M)) ** 2 < D / M && Astart > Aend && Aend > 0);
      return (2 * M * Math.log(Astart / Aend)) / Rm;
    },
  },
  "resistance-from-decay": {
    inputs: { M: "mass", dt: "time", Astart: "length", Aend: "length" },
    unit: "resistance",
    formula: String.raw`$R_m=\frac{2M}{\Delta t}\ln\frac{A_{\mathrm{start}}}{A_{\mathrm{end}}}$`,
    compute: ({ M, dt, Astart, Aend }) => {
      assert.ok(dt > 0 && Astart > Aend && Aend > 0);
      return (2 * M * Math.log(Astart / Aend)) / dt;
    },
  },
  "first-beat-maximum": {
    inputs: { f0: "frequency", f: "frequency" },
    unit: "time",
    formula: String.raw`$t_{\mathrm{first}}=\frac{1}{2|f-f_0|}$`,
    compute: ({ f0, f }) => {
      assert.ok(f0 > 0 && f > 0 && f !== f0);
      return 0.5 / Math.abs(f - f0);
    },
  },
  "pulse-period": {
    inputs: { delta: "rate", rise: "dimensionless", residual: "dimensionless" },
    unit: "time",
    formula: String.raw`$P_{\min}=\frac{-\ln(1-r)-\ln\varepsilon}{\delta}$`,
    compute: ({ delta, rise, residual }) => {
      assert.ok(delta > 0 && rise > 0 && rise < 1 && residual > 0 && residual < 1);
      return Math.log(1 / ((1 - rise) * residual)) / delta;
    },
  },
  "stiffness-from-reactance": {
    inputs: { M: "mass", omega: "frequency-angular", X: "resistance", Rm: "resistance" },
    unit: "stiffness",
    formula: String.raw`$D=\omega(M\omega-X_m)$`,
    compute: ({ M, omega, X, Rm }) => {
      assert.ok(omega > 0 && Rm > 0);
      return M * omega ** 2 - X * omega;
    },
  },
  "geometric-center": {
    inputs: { f1: "frequency", f2: "frequency" },
    unit: "frequency",
    formula: String.raw`$f_0=\sqrt{f_1f_2}$`,
    compute: ({ f1, f2 }) => {
      assert.ok(f1 > 0 && f2 > f1);
      return Math.sqrt(f1 * f2);
    },
  },
};

export function recomputeNumeric(answer) {
  const c = answer.calculation,
    method = methods[c.method];
  assert.ok(method, `Unknown independent formula: ${c.method}`);
  assert.equal(c.formula, method.formula, `${c.method}: displayed formula mismatch`);
  assert.deepEqual(
    Object.keys(c.inputs).sort(),
    Object.keys(method.inputs).sort(),
    `${c.method}: input inventory`,
  );
  const values = {};
  for (const [key, dimension] of Object.entries(method.inputs)) {
    const item = c.inputs[key],
      unit = units[item.unit];
    assert.ok(unit && unit[0] === dimension, `${c.method}.${key}: incompatible unit ${item.unit}`);
    assert.ok(Number.isFinite(item.value), `${c.method}.${key}: nonfinite input`);
    values[key] = item.value * unit[1];
    if (["M", "D", "Rm", "E"].includes(key)) assert.ok(values[key] > 0, `${key}: must be positive`);
  }
  const output = units[answer.unit];
  assert.ok(
    output && output[0] === method.unit,
    `${c.method}: incompatible output unit ${answer.unit}`,
  );
  const expected = method.compute(values) / output[1];
  assert.ok(Number.isFinite(expected) && expected > 0, `${c.method}: invalid physical result`);
  assert.ok(
    Number.isFinite(answer.value) &&
      Math.abs(answer.value - expected) <= Math.max(1e-9, Math.abs(expected) * 1e-5),
    `${c.method}: answer ${answer.value} ${answer.unit}, independently expected ${expected}`,
  );
  assert.deepEqual(
    answer.tolerance,
    { relative: 0.02 },
    "Numeric grading must use ±2% relative tolerance",
  );
  return expected;
}

export function checkMath(text, context) {
  assert.equal((text.match(/\$/g) ?? []).length % 2, 0, `${context}: unpaired $`);
  assert.ok(!text.includes("$$"), `${context}: use inline $…$ delimiters`);
  for (const [, tex] of text.matchAll(/\$([^$]+)\$/g)) {
    katex.renderToString(tex, { throwOnError: true, strict: "error", trust: false });
  }
  const prose = text.replace(/\$[^$]+\$/g, "");
  assert.ok(
    !/\\(?:frac|sqrt|omega|delta|pi|tilde|mathrm|varphi)\b|\^|=/.test(prose),
    `${context}: formula outside $…$`,
  );
  assert.ok(
    !/Math\.|\*\*|\bsqrt\(|\b(?:atan2|hypot)\(/.test(text),
    `${context}: programming syntax in question`,
  );
}
export const normalizeStem = (s) => s.normalize("NFKC").replace(/[\s$，。；、：？！,.!?;:]/gu, "");
export const numberNeutralStem = (s) => normalizeStem(s).replace(/\d+(?:\.\d+)?/g, "#");

// Repeated context with different numbers still has substantial character-trigram
// overlap. This guards mechanical reuse; semantic/context review remains human work.
export function depthStemSimilarity(a, b) {
  const grams = (s) => {
    const normalized = numberNeutralStem(s).replace(/[^\p{L}#]/gu, "");
    return new Set(
      Array.from({ length: Math.max(0, normalized.length - 2) }, (_, i) =>
        normalized.slice(i, i + 3),
      ),
    );
  };
  const x = grams(a),
    y = grams(b);
  const overlap = [...x].filter((g) => y.has(g)).length;
  return (2 * overlap) / Math.max(1, x.size + y.size);
}
export function checkOptionalScenario(short, choice) {
  assert.equal(
    (choice.stem.match(/[？?]/g) ?? []).length,
    1,
    `${choice.id}: optional task must have one question mark`,
  );
  assert.ok(
    choice.stem.endsWith("以下哪一项判断及其理由成立？"),
    `${choice.id}: optional assessment wording`,
  );
  assert.ok(
    depthStemSimilarity(short.stem, choice.stem) < 0.65,
    `${choice.id}: optional scenario too similar to short depth task`,
  );
}

export function checkNumericDisplay(answer) {
  // Check the actual shared display formatter independently of grading precision.
  const suffix = (unit) => (unit === "1" ? "" : ` ${unit}`);
  const display = quantityText(answer.value, answer.unit, 4);
  assert.equal(
    display,
    `${answer.value.toPrecision(4)}${suffix(answer.unit)}`,
    "Numeric display must use 4 significant figures and no dimensionless unit 1",
  );
  for (const input of Object.values(answer.calculation.inputs))
    assert.equal(
      quantityText(input.value, input.unit),
      `${input.value}${suffix(input.unit)}`,
      "Input display must not show dimensionless unit 1",
    );
}

export function validateBank(bank, expected = lectureLiterals(bank.lecture)) {
  requireSchema(bank, schema, `Lecture ${bank.lecture}`);
  const id = bank.lecture;
  // The user scoped this round to chapter 3. Earlier chapters retain their
  // existing content pending a separately authorized editorial pass.
  if (bank.chapter === 3) checkOptionalScenario(bank.questions[7], bank.questions[8]);
  assert.equal(bank.chapter, Number(id.split(".")[0]), `${id}: chapter mismatch`);
  assert.deepEqual(
    bank.keyPoints,
    expected.keyPoints,
    `${id}: keyPoints must quote current website verbatim`,
  );
  assert.ok(!/慕课|让我们|值得注意的是/.test(JSON.stringify(bank)), `${id}: prohibited wording`);
  assert.equal(
    new Set(bank.sources.map((s) => s.id)).size,
    bank.sources.length,
    `${id}: duplicate document id`,
  );
  const documents = new Map(bank.sources.map((s) => [s.id, s]));
  const preRoles = ["prerequisite", "intuition", "distinction"];
  const postRoles = ["concept", "formula", "calculation", "reasoning", "depth"];
  assert.deepEqual(
    bank.questions.map((q) => q.role),
    [...preRoles, ...postRoles, "depth"],
    `${id}: pedagogical sequence`,
  );
  assert.equal(
    bank.questions.filter((q) => q.level === "深度" && q.kind === "post").length >= 1,
    true,
    `${id}: missing depth`,
  );
  for (const [index, q] of bank.questions.entries()) {
    if (bank.chapter === 3)
      assert.ok(
        bank.reviewNotes.some((note) => note.startsWith(`${q.id}：禁复用核查`)),
        `${q.id}: missing classroom reuse review`,
      );
    const pre = index < 3,
      n = pre ? index + 1 : index - 2;
    assert.equal(q.lecture, id, `${q.id}: lecture mismatch`);
    assert.equal(q.kind, pre ? "pre" : "post", `${q.id}: pre/post mismatch`);
    assert.equal(
      q.id,
      `${id}-${q.kind}-${String(n).padStart(2, "0")}`,
      `${q.id}: stable sequential id`,
    );
    const level =
      q.role === "prerequisite"
        ? "基础"
        : q.role === "calculation"
          ? "应用"
          : q.role === "depth"
            ? "深度"
            : "理解";
    assert.equal(q.level, level, `${q.id}: level mismatch`);
    assert.ok(
      q.concept.every((c) => bank.keyPoints.includes(c)),
      `${q.id}: concept must be a verbatim website key point`,
    );
    if (q.role === "calculation")
      assert.equal(q.type, "numeric", `${q.id}: quantitative slot must be numeric`);
    if (q.role !== "calculation")
      assert.notEqual(q.type, "numeric", `${q.id}: numeric only in calculation slot`);
    if (q.role === "concept") assert.ok(["single", "multi", "judge"].includes(q.type));
    if (q.role === "depth")
      assert.ok(
        /为什么|为何|怎样|应|能否|是否|判断/.test(q.stem),
        `${q.id}: depth must require a judgment`,
      );
    if (n === 5 && !pre) assert.equal(q.type, "short", `${q.id}: depth must use short answer`);
    if (n === 6 && !pre) {
      assert.equal(q.type, "single", `${q.id}: optional depth must retain the choice question`);
      assert.equal(q.optional, true, `${q.id}: post-06 must be optional`);
    } else {
      assert.ok(!own(q, "optional"), `${q.id}: only post-06 may be optional`);
    }
    if (q.type === "short") {
      assert.equal(q.role, "depth", `${q.id}: short answer is the depth task`);
      for (const text of [...q.answer.rubric, q.answer.reference]) checkMath(text, q.id);
    }
    for (const text of [
      q.stem,
      ...q.concept,
      ...q.explanation,
      ...(q.options ?? []).map((o) => o.text),
    ])
      checkMath(text, q.id);
    if (q.options) {
      assert.deepEqual(
        q.options.map((o) => o.id),
        ["A", "B", "C", "D"],
        `${q.id}: four distinct ordered options`,
      );
      assert.equal(
        new Set(q.options.map((o) => normalizeStem(o.text))).size,
        4,
        `${q.id}: duplicate option`,
      );
      assert.ok(
        q.options.every((o) => !/以上|都对|都不对|均正确|均错误/.test(o.text)),
        `${q.id}: aggregate option`,
      );
      for (const option of q.options)
        assert.equal(
          q.explanation.filter((s) => s.startsWith(`${option.id}：`)).length,
          1,
          `${q.id}: explain every option, including each distractor`,
        );
    }
    if (q.type === "numeric") {
      checkMath(q.answer.calculation.formula, q.id);
      recomputeNumeric(q.answer);
      checkNumericDisplay(q.answer);
    }
    const cited = new Set();
    for (const ref of q.source) {
      const doc = documents.get(ref.document);
      assert.ok(doc, `${q.id}: unknown source ${ref.document}`);
      assert.ok(!cited.has(ref.document), `${q.id}: duplicate document reference`);
      cited.add(ref.document);
      if (doc.kind === "pdf")
        assert.ok(
          ref.pages?.every((p) => p <= doc.pageCount),
          `${q.id}: PDF page out of range`,
        );
      else
        assert.ok(
          ref.section && !ref.pages && /二、教学目标|五、|八、/.test(ref.section),
          `${q.id}: design section required`,
        );
    }
    assert.deepEqual(
      [...cited].sort(),
      [...documents.keys()].sort(),
      `${q.id}: cite original PDF and every matching teaching design`,
    );
    for (const example of expected.exampleTexts ?? []) {
      assert.notEqual(
        normalizeStem(q.stem),
        normalizeStem(example),
        `${q.id}: repeats website question/example`,
      );
    }
  }
  for (const point of bank.keyPoints)
    assert.ok(
      bank.questions.some((q) => q.kind === "post" && !q.optional && q.concept.includes(point)),
      `${id}: uncovered point ${point}`,
    );
  const positions = new Set(bank.questions.filter((q) => q.type === "single").map((q) => q.answer));
  assert.equal(positions.size, 4, `${id}: distribute correct choices across A–D`);
  return bank.questions.length;
}

export function validateInventory(manifest, banks, topics, filenames) {
  requireSchema(manifest, schema.$defs.manifest, "Manifest");
  assert.equal(
    new Set(manifest.chapters.map((c) => c.chapter)).size,
    manifest.chapters.length,
    "duplicate chapter in manifest",
  );
  const listed = manifest.chapters.flatMap((c) => c.lectures);
  assert.equal(new Set(listed).size, listed.length, "duplicate lecture in manifest");
  // The first chapter remains mandatory even if somebody removes a manifest entry.
  assert.ok(
    manifest.chapters.some((c) => c.chapter === 1),
    "chapter 1 is required",
  );
  for (const c of manifest.chapters) {
    const expected = topics
      .filter((t) => t.id.startsWith(`${c.chapter}.`))
      .filter((t) => /^\d+\.\d+(?:\.\d+)?$/.test(t.id))
      .map((t) => t.id)
      .sort();
    assert.deepEqual(
      [...c.lectures].sort(),
      expected,
      `chapter ${c.chapter}: all website lectures required`,
    );
  }
  assert.deepEqual(
    banks.map((b) => b.lecture).sort(),
    [...listed].sort(),
    "bank inventory differs from manifest",
  );
  assert.deepEqual(
    [...filenames].sort(),
    listed.map((id) => `${id}.json`).sort(),
    "missing/unregistered lecture files",
  );
  const ids = new Set(),
    stems = new Set(),
    patterns = new Set();
  for (const bank of banks)
    for (const q of bank.questions) {
      assert.ok(!ids.has(q.id), `${q.id}: duplicate id`);
      ids.add(q.id);
      const stem = normalizeStem(q.stem),
        pattern = numberNeutralStem(q.stem);
      assert.ok(!stems.has(stem), `${q.id}: duplicate stem`);
      stems.add(stem);
      assert.ok(!patterns.has(pattern), `${q.id}: repeats a stem with changed numbers`);
      patterns.add(pattern);
    }
  checkAnswerDistribution(banks);
}

// Count every correct A–D selection, including optional questions and multi-select
// answers. Judge/short/numeric answers do not have a letter and are excluded.
export function checkAnswerDistribution(banks) {
  for (const chapter of new Set(banks.map((b) => b.chapter))) {
    const letters = banks
      .filter((b) => b.chapter === chapter)
      .flatMap((b) => b.questions)
      .flatMap((q) => (q.type === "single" ? [q.answer] : q.type === "multi" ? q.answer : []));
    for (const letter of ["A", "B", "C", "D"]) {
      const count = letters.filter((answer) => answer === letter).length;
      assert.ok(
        count * 5 <= letters.length * 2,
        `chapter ${chapter}: answer distribution ${letter} exceeds 40% (${count}/${letters.length})`,
      );
    }
  }
}

export function runChecks() {
  const { manifest, banks } = loadBanks();
  const topics = readJson("src/topics.json"),
    calendar = readJson("src/calendar.json");
  const filenames = fs
    .readdirSync(path.join(root, "src/content/quiz"))
    .filter((f) => f.endsWith(".json") && f !== "manifest.json");
  validateInventory(manifest, banks, topics, filenames);
  let numericCount = 0;
  for (const bank of banks) {
    const topic = topics.find((t) => t.id === bank.lecture);
    assert.equal(bank.title, topic.title, `${bank.lecture}: website title`);
    assert.equal(bank.sources.filter((s) => s.kind === "pdf").length, 1);
    assert.equal(
      bank.sources.find((s) => s.kind === "pdf").file,
      topic.source,
      `${bank.lecture}: original PDF filename`,
    );
    const classes = calendar
      .filter((c) => c.sections.some((s) => s.id === bank.lecture))
      .map((c) => c.number);
    const designs = bank.sources.filter((s) => s.kind === "design");
    assert.deepEqual(
      designs.map((s) => s.classNumber),
      classes,
      `${bank.lecture}: matching teaching designs`,
    );
    for (const doc of designs)
      assert.ok(doc.file.startsWith(`第${String(doc.classNumber).padStart(2, "0")}次课_`));
    validateBank(bank);
    numericCount += bank.questions.filter((q) => q.type === "numeric").length;
  }
  // Shared chapter-1 worked examples live outside lecture files; include them in exact-duplicate checks.
  const shared = ["instrument.ts", "bandwidth.ts"].map((file) =>
    fs.readFileSync(path.join(root, "src/content/examples", file), "utf8"),
  );
  for (const bank of banks)
    for (const q of bank.questions)
      for (const source of shared) {
        assert.ok(
          !source.includes(JSON.stringify(q.stem)),
          `${q.id}: repeats a shared worked example`,
        );
      }
  // Git may check Markdown out as CRLF on Windows; content equality ignores EOL style.
  const review = fs
    .readFileSync(path.join(root, "specs/redesign/quiz-bank-review.md"), "utf8")
    .replaceAll("\r\n", "\n");
  assert.equal(
    review,
    renderReview(manifest, banks),
    "Review is stale; run node scripts/quiz-bank-review.mjs --write",
  );
  console.log(
    `PASS check-quiz-bank: ${banks.length} lectures, ${banks.length * 3} pre + ${banks.length * 5} required post + ${banks.flatMap((b) => b.questions).filter((q) => q.optional).length} optional post questions, ${numericCount} independent numeric checks; schema, teacher-only sources, coverage, short depth, answer distribution, KaTeX and review synchronized.`,
  );
}

if (process.argv[1] && path.resolve(process.argv[1]) === fileURLToPath(import.meta.url))
  runChecks();
