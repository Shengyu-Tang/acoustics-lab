import assert from "node:assert/strict";
import fs from "node:fs";
import path from "node:path";
import test from "node:test";
import {
  schema,
  validateSchema,
  validateBank,
  validateInventory,
  recomputeNumeric,
  checkMath,
  checkAnswerDistribution,
  checkNumericDisplay,
  checkOptionalScenario,
  depthStemSimilarity,
  checkEditorialText,
  checkPost06Lengths,
  checkNumericTolerance,
} from "./check-quiz-bank.mjs";
import {
  loadBanks,
  renderReview,
  quantityText,
  toleranceText,
  post06LengthStats,
  root,
} from "./quiz-bank-review.mjs";
import { chapter3Methods } from "./quiz-bank-numeric-ch3.mjs";
import { chapter4Methods } from "./quiz-bank-numeric-ch4.mjs";
import { chapter5Methods } from "./quiz-bank-numeric-ch5.mjs";
import { chapter6Methods } from "./quiz-bank-numeric-ch6.mjs";
import { chapter7Methods } from "./quiz-bank-numeric-ch7.mjs";

const { manifest, banks } = loadBanks();
const topics = JSON.parse(fs.readFileSync(path.join(root, "src/topics.json"), "utf8"));
const filenames = banks.map((b) => `${b.lecture}.json`);
const copy = (v) => structuredClone(v);
const example = banks.find((b) => b.lecture === "1.1.1");
const numeric = (b) => b.questions.find((q) => q.type === "numeric");

test("chapter 7 includes all lectures and independently grades the three inverse problems", () => {
  const selected = banks.filter((b) => b.chapter === 7);
  assert.deepEqual(
    selected.map((b) => b.lecture),
    ["7.1", "7.2", "7.3"],
  );
  assert.equal(selected.flatMap((b) => b.questions).length, 27);
  for (const bank of selected) {
    validateBank(bank);
    checkOptionalScenario(bank.questions[7], bank.questions[8]);
    const answer = copy(numeric(bank).answer);
    recomputeNumeric(answer);
    answer.value *= 1.1;
    assert.throws(() => recomputeNumeric(answer), /independently expected/);
    const wrongDimension = copy(numeric(bank).answer);
    wrongDimension.calculation.inputs[Object.keys(wrongDimension.calculation.inputs)[0]].unit =
      "kg";
    assert.throws(() => recomputeNumeric(wrongDimension), /incompatible unit/);
  }
  const missing = copy(manifest);
  missing.chapters.find((c) => c.chapter === 7).lectures.pop();
  assert.throws(
    () => validateInventory(missing, banks, topics, filenames),
    /all website lectures required/,
  );
  const time = copy(numeric(selected[1]).answer);
  time.value *= 1e-6;
  time.unit = "s";
  assert.ok(Math.abs(recomputeNumeric(time) - 1 / (20000 * Math.PI)) < 1e-15);
  const bandwidth = copy(numeric(selected[2]).answer);
  bandwidth.value *= 1000;
  bandwidth.unit = "Hz";
  assert.ok(Math.abs(recomputeNumeric(bandwidth) - 200 * Math.sqrt(5)) < 1e-10);
});

test("chapter 7 calibration, relaxation limits and threshold crossings reject misleading shortcuts", () => {
  const near = (a, b, tol = 1e-12) => assert.ok(Math.abs(a - b) < tol, `${a} differs from ${b}`);
  const absorption = chapter7Methods["calibrated-plane-absorption"].compute;
  const measurement = { U1: 2, U2: 1, H1: 1, H2: 2, L: 2 };
  near(absorption(measurement), Math.LN2);
  // Multiplying both voltage and calibration gain of one channel leaves alpha unchanged.
  near(absorption({ ...measurement, U2: 10, H2: 20 }), Math.LN2);
  assert.throws(() => absorption({ ...measurement, H1: 0 }));
  assert.throws(() => absorption({ ...measurement, U2: 10 }));
  const relaxation = chapter7Methods["two-frequency-relaxation-time"].compute;
  near(relaxation({ f: 1 / (2 * Math.PI), B: 0, alpha1: 0.5, alpha2: 0.8 }), 1);
  // The same residuals on a substantial known quadratic baseline must recover the same time.
  near(relaxation({ f: 1 / (2 * Math.PI), B: 4 * Math.PI ** 2, alpha1: 1.5, alpha2: 4.8 }), 1);
  near(relaxation({ f: 1 / (2 * Math.PI), B: 0, alpha1: 0.4, alpha2: 1 }), 0.5);
  for (const ratio of [0.9, 1, 4, 4.1])
    assert.throws(() => relaxation({ f: 1, B: 0, alpha1: 1, alpha2: ratio }), /1 < R < 4/);
  assert.throws(() => relaxation({ f: 1, B: 2, alpha1: 1, alpha2: 3 }));
  const bandwidth = chapter7Methods["impedance-threshold-bandwidth"].compute;
  const resonator = { r: 1, b: 2, f0: 1000, threshold: 0.8 };
  near(bandwidth(resonator), 500, 1e-9);
  near(bandwidth({ ...resonator, b: 4 }), 250, 1e-9);
  near(bandwidth({ ...resonator, f0: 2000 }), 1000, 1e-9);
  assert.throws(() => bandwidth({ ...resonator, r: 4 }), /below the realizable peak/);
  assert.throws(() => bandwidth({ ...resonator, threshold: 1 }), /below the realizable peak/);
  assert.throws(() => bandwidth({ ...resonator, b: 0 }));
});

test("chapter 6 checks complex loading and actual source normalization", () => {
  const near = (actual, expected) => assert.ok(Math.abs(actual - expected) < 1e-12);
  const response = chapter6Methods["receiver-two-frequency-ratio"].compute;
  const inputs = { x1: 0, x2: 0, Rm1: 2, Xm1: 4, R21: 1, X21: 0, Rm2: 2, Xm2: 4, R22: 1, X22: 0 };
  near(response(inputs), 1);
  // Equal resistance: removing a reactance cancellation changes the result
  // from |3+j0| / |3+j4| = 3/5, not (|Zm|+|Z2s|) at each frequency.
  near(response({ ...inputs, X21: -4 }), 0.6);
  near(response({ ...inputs, x2: Math.sqrt(3) }), 0.5);
  assert.throws(() => response({ ...inputs, Rm2: -1 }));
  const residual = chapter6Methods["reciprocity-complex-residual"].compute;
  const measurement = { PBr: 2, PBi: -1, PAr: 4, PAi: -2, QA: 1, QB: 2 };
  near(residual(measurement), 0); // Unequal raw pressures can be exactly reciprocal.
  near(residual({ ...measurement, PAi: 2 }), 2 / Math.sqrt(5)); // Equal magnitudes are insufficient.
  near(residual({ ...measurement, PBr: 6, PBi: -3, QA: 3 }), 0);
  assert.throws(() => residual({ ...measurement, QA: 0 }));
  assert.throws(() => residual({ ...measurement, PBr: 0, PBi: 0 }));
  const selected = banks.filter((b) => b.chapter === 6);
  assert.deepEqual(
    selected.map((b) => b.lecture),
    ["6.1", "6.2"],
  );
  assert.equal(selected.flatMap((b) => b.questions).length, 18);
  for (const bank of selected) {
    validateBank(bank);
    const answer = copy(numeric(bank).answer);
    recomputeNumeric(answer);
    answer.value *= 1.1;
    assert.throws(() => recomputeNumeric(answer), /independently expected/);
  }
  const percentage = copy(numeric(selected[1]).answer);
  percentage.value /= 100;
  percentage.unit = "";
  delete percentage.absoluteTolerance;
  percentage.tolerance = { relative: 0.02 };
  near(recomputeNumeric(percentage), 0.17541160386140575);
});

test("chapter 5 includes all three lectures and documents every reuse decision", () => {
  const selected = banks.filter((b) => b.chapter === 5);
  assert.deepEqual(
    selected.map((b) => b.lecture),
    ["5.1", "5.2", "5.3"],
  );
  assert.equal(selected.flatMap((b) => b.questions).length, 27);
  for (const original of selected) {
    validateBank(original);
    const missing = copy(original);
    missing.reviewNotes = missing.reviewNotes.filter(
      (note) => !note.startsWith(`${original.lecture}-post-03：`),
    );
    assert.throws(() => validateBank(missing), /missing classroom reuse review/);
  }
  const missing = copy(manifest);
  missing.chapters.find((c) => c.chapter === 5).lectures.pop();
  assert.throws(
    () => validateInventory(missing, banks, topics, filenames),
    /all website lectures required/,
  );
});

test("chapter 5 oracles preserve complex forcing and angular integration measures", () => {
  const near = (a, b, tolerance = 1e-9) =>
    assert.ok(Math.abs(a - b) < tolerance, `${a} differs from ${b}`);
  const forcing = chapter5Methods["impedance-boundary-forcing"].compute;
  near(forcing({ Pr: -1, Pi: 4, Z: 2, v: 1 }), 5);
  const fraction = chapter5Methods["rayleigh-sphere-backward-cone"].compute;
  near(fraction({ theta0: 0 }), 1);
  near(fraction({ theta0: Math.PI }), 0);
  near(fraction({ theta0: Math.PI / 2 }), 13 / 14);
  near(fraction({ theta0: (2 * Math.PI) / 3 }), 73 / 112);
  const width = chapter5Methods["cylinder-two-mode-scattering-width"].compute;
  near(width({ k: 4, c0r: 0, c0i: 1, c1r: 0, c1i: 0 }), 1);
  near(width({ k: 4, c0r: 0, c0i: 0, c1r: 1, c1i: 0 }), 0.5);
  // Opposite real cross terms integrate to zero; an amplitude sum would fail this check.
  near(width({ k: 4, c0r: 1, c0i: 0, c1r: 2, c1i: 0 }), 3);
  near(width({ k: 4, c0r: 1, c0i: 0, c1r: -2, c1i: 0 }), 3);
});

test("chapter 5 grading rejects altered answers, dimensions and invalid domains", () => {
  for (const original of banks.filter((b) => b.chapter === 5)) {
    const answer = copy(numeric(original).answer);
    recomputeNumeric(answer);
    answer.value *= 1.1;
    assert.throws(() => recomputeNumeric(answer), /independently expected/);
    const wrongUnit = copy(numeric(original).answer);
    wrongUnit.unit = "s";
    assert.throws(() => recomputeNumeric(wrongUnit), /incompatible output unit/);
  }
  assert.throws(() =>
    chapter5Methods["impedance-boundary-forcing"].compute({
      Pr: 1,
      Pi: 1,
      Z: -2,
      v: 1,
    }),
  );
  assert.throws(() =>
    chapter5Methods["rayleigh-sphere-backward-cone"].compute({
      theta0: Math.PI + 0.01,
    }),
  );
  assert.throws(() =>
    chapter5Methods["cylinder-two-mode-scattering-width"].compute({
      k: 0,
      c0r: 1,
      c0i: 0,
      c1r: 0,
      c1i: 0,
    }),
  );
  const badK = copy(numeric(banks.find((b) => b.lecture === "5.3")).answer);
  badK.calculation.inputs.k.unit = "Hz";
  assert.throws(() => recomputeNumeric(badK), /incompatible unit/);
});

test("chapter 4 includes every formal lecture with distinct, documented depth tasks", () => {
  const selected = banks.filter((b) => b.chapter === 4);
  assert.equal(selected.length, 9);
  assert.equal(selected.flatMap((b) => b.questions).length, 81);
  assert.equal(Object.keys(chapter4Methods).length, 9);
  for (const original of selected) {
    checkOptionalScenario(original.questions[7], original.questions[8]);
    const missing = copy(original);
    missing.reviewNotes = missing.reviewNotes.filter(
      (note) => !note.startsWith(`${original.lecture}-post-03：`),
    );
    assert.throws(() => validateBank(missing), /missing classroom reuse review/);
  }
  const missing = copy(manifest);
  missing.chapters.find((c) => c.chapter === 4).lectures.pop();
  assert.throws(
    () => validateInventory(missing, banks, topics, filenames),
    /all website lectures required/,
  );
});

test("chapter 4 oracles resolve coherent cancellation, solid angle and aperture geometry", () => {
  const near = (a, b, tolerance = 1e-9) =>
    assert.ok(Math.abs(a - b) < tolerance, `${a} differs from ${b}`);
  // Same-path source pair adds in amplitude; a half-wavelength path with
  // unequal spreading leaves the amplitude difference, not an RMS sum.
  const two = chapter4Methods["coherent-two-point-pressure"].compute;
  near(two({ rho: 1000, f: 1500, c: 1500, Q: 1e-5, r1: 3, r2: 3 }), 5);
  near(two({ rho: 1000, f: 1500, c: 1500, Q: 1e-5, r1: 3, r2: 3.5 }), 5 / 14);
  near(chapter4Methods["dipole-cone-power-fraction"].compute({ alpha: Math.PI / 3 }), 0.875, 1e-7);
  const patches = chapter4Methods["baffled-patch-axis-pressure"].compute;
  near(patches({ rho: 1000, f: 1000, r: 10, S1: 0.002, S2: 0.002, v1: 0.01, v2: -0.01 }), 0);
  near(chapter4Methods["piston-first-axial-node"].compute({ a: 0.05, lambda: 0.01 }), 0.12);
  // Equal mechanical and added masses lower this resonance by sqrt(2).
  near(chapter4Methods["loaded-resonance"].compute({ M: 1, Ms: 1, D: 8 * Math.PI ** 2 }), 1);
  near(
    chapter4Methods["sphere-pressure-fraction-frequency"].compute({
      a: 1,
      c: 2 * Math.PI,
      s: Math.SQRT1_2,
    }),
    1,
  );
  near(
    chapter4Methods["sphere-radius-from-added-mass"].compute({ Ms: 4 * Math.PI, rho: 1000 }),
    0.1,
  );
  near(
    chapter4Methods["boundary-phase-sampling-limit"].compute({
      N: 32,
      R: 1,
      c: 2 * Math.PI,
      phi: Math.PI / 4,
    }),
    4,
  );
  near(
    chapter4Methods["incoming-from-radiation-residual"].compute({
      E: 0.4,
      f: 1,
      c: 2 * Math.PI,
      R: 2,
    }),
    0.1,
  );
});

test("chapter 4 numeric grading rejects wrong units, lost phase and invalid geometric roots", () => {
  for (const original of banks.filter((b) => b.chapter === 4)) {
    const answer = copy(numeric(original).answer);
    recomputeNumeric(answer);
    answer.value *= 1.1;
    assert.throws(() => recomputeNumeric(answer), /independently expected/);
  }
  const pressure = copy(numeric(banks.find((b) => b.lecture === "4.4.2")).answer);
  pressure.unit = "Pa"; // Do not silently accept the mPa value as Pa.
  assert.throws(() => recomputeNumeric(pressure), /independently expected/);
  const pair = copy(numeric(banks.find((b) => b.lecture === "4.2.3")).answer);
  pair.value = 2.5 + 7.5 / 3.25;
  assert.throws(() => recomputeNumeric(pair), /independently expected/);
  assert.throws(() =>
    chapter4Methods["piston-first-axial-node"].compute({ a: 0.01, lambda: 0.02 }),
  );
  assert.throws(() =>
    chapter4Methods["sphere-pressure-fraction-frequency"].compute({ a: 1, c: 340, s: 1 }),
  );
  assert.throws(() =>
    chapter4Methods["boundary-phase-sampling-limit"].compute({
      N: 3.5,
      R: 0.4,
      c: 340,
      phi: Math.PI / 4,
    }),
  );
});

test("chapter 3 inventory includes all 48 formal lectures and excludes supplementary topics", () => {
  const c3 = banks.filter((b) => b.chapter === 3);
  assert.equal(c3.length, 48);
  assert.equal(
    c3.reduce((n, b) => n + b.questions.length, 0),
    432,
  );
  assert.ok(!c3.some((b) => /S/.test(b.lecture)));
  assert.equal(Object.keys(chapter3Methods).length, 48);
  const missing = copy(manifest);
  missing.chapters.find((c) => c.chapter === 3).lectures.pop();
  assert.throws(
    () => validateInventory(missing, banks, topics, filenames),
    /all website lectures required/,
  );
  const hidden = copy(manifest);
  hidden.chapters.find((c) => c.chapter === 3).sectionGroups = ["3.1"];
  assert.ok(validateSchema(hidden, schema.$defs.manifest).length);
});

test("optional depth rejects concatenated questions and number-only scenario reuse", () => {
  const b = banks.find((b) => b.lecture === "3.1.1");
  checkOptionalScenario(b.questions[7], b.questions[8]);
  const choice = copy(b.questions[8]);
  choice.stem = "还有一个问题？" + choice.stem;
  assert.throws(() => checkOptionalScenario(b.questions[7], choice), /one question mark/);
  const short = { stem: "长管内设置两个压力传感器相距20米，信号峰值按固定相位沿空间平移。" };
  const repeated = {
    id: "fixture",
    stem: "长管内设置两个压力传感器相距40米，信号峰值按固定相位沿空间平移。以下哪一项判断成立？",
  };
  assert.ok(depthStemSimilarity(short.stem, repeated.stem) > 0.65);
  assert.throws(() => checkOptionalScenario(short, repeated), /too similar/);
});

test("chapter 3 requires question-specific classroom reuse records and required coverage", () => {
  const original = banks.find((b) => b.lecture === "3.1.1");
  const b = copy(original);
  b.reviewNotes = b.reviewNotes.filter((note) => !note.startsWith("3.1.1-post-03："));
  assert.throws(() => validateBank(b), /missing classroom reuse review/);
  const c = copy(original),
    point = c.keyPoints[0];
  for (const q of c.questions.filter((q) => q.kind === "post" && !q.optional))
    q.concept = q.concept.filter((p) => p !== point);
  assert.ok(c.questions[8].concept.includes(point));
  assert.throws(() => validateBank(c), /uncovered point/);
});

test("chapter 3 independent numerical oracles cover phase, projections, geometry and modal delays", () => {
  const near = (a, b, tol = 1e-9) => assert.ok(Math.abs(a - b) < tol, `${a} differs from ${b}`);
  near(chapter3Methods["evanescent-distance"].compute({ kt: 5, k: 3, ratio: Math.exp(-1) }), 0.25);
  near(
    chapter3Methods["surface-reactance-from-reflection"].compute({
      Z0: 400,
      r: 0.5,
      phi: Math.PI / 2,
    }),
    320,
  );
  near(chapter3Methods["spherical-reverse-flow-fraction"].compute({ kr: 1 / Math.sqrt(3) }), 1 / 3);
  near(chapter3Methods["two-interface-first-pass-gain"].compute({ Z1: 1, Zm: 4, Z3: 16 }), 1.8496);
  near(
    chapter3Methods["partial-aperture-first-velocity-mode"].compute({ U: 0.01, a: 0.3, h: 0.6 }),
    0.006366197723675814,
  );
  near(
    chapter3Methods["modal-ray-axial-period"].compute({ n: 2, h: 0.6, c: 300, f: 1000 }),
    2.078460969082653,
  );
  near(
    chapter3Methods["intermodal-group-delay"].compute({
      L: 30,
      c: 300,
      h: 0.5,
      f: 1000,
      n1: 1,
      n2: 2,
    }),
    0.020171516327808177,
  );
  const micro = numeric(banks.find((b) => b.lecture === "3.3.1")).answer;
  assert.equal(micro.unit, "μJ");
  near(recomputeNumeric(micro), 4.533333333333333);
});

test("chapter 3 numeric domains reject nonphysical branches and wrong unit scaling", () => {
  assert.throws(() => chapter3Methods["evanescent-distance"].compute({ kt: 3, k: 5, ratio: 0.2 }));
  assert.throws(() =>
    chapter3Methods["waveguide-evanescent-clearance"].compute({
      n: 1,
      h: 0.5,
      c: 300,
      f: 300,
      ratio: 0.1,
    }),
  );
  assert.throws(() =>
    chapter3Methods["intermodal-group-delay"].compute({
      L: 30,
      c: 300,
      h: 0.5,
      f: 600,
      n1: 1,
      n2: 2,
    }),
  );
  const a = copy(numeric(banks.find((b) => b.lecture === "3.10.5")).answer);
  a.unit = "s";
  assert.throws(() => recomputeNumeric(a), /independently expected/);
  const b = copy(numeric(banks.find((b) => b.lecture === "3.6.9")).answer);
  b.calculation.inputs.center.unit = "m";
  assert.throws(() => recomputeNumeric(b), /incompatible unit/);
});

test("schema rejects unknown properties, malformed answer types and missing choices", () => {
  for (const mutate of [
    (b) => {
      b.unknown = true;
    },
    (b) => {
      b.questions[0].answer = true;
    },
    (b) => {
      delete b.questions[0].options;
    },
    (b) => {
      b.questions[0].options.push({ id: "E", text: "第五项" });
    },
    (b) => {
      numeric(b).answer.calculation.inputs.M.unit = "1";
    },
  ]) {
    const b = copy(example);
    mutate(b);
    assert.ok(validateSchema(b).length > 0);
  }
});

test("judge and multi branches validate boolean and unique option sets", () => {
  const q = copy(banks.find((b) => b.lecture === "1.2.1").questions[3]);
  assert.deepEqual(validateSchema(q, schema.$defs.question), []);
  q.answer = "错误";
  assert.ok(validateSchema(q, schema.$defs.question).length);
  const multi = copy(example.questions[0]);
  multi.type = "multi";
  multi.answer = ["A", "C"];
  assert.deepEqual(validateSchema(multi, schema.$defs.question), []);
  multi.answer = ["A", "A"];
  assert.ok(validateSchema(multi, schema.$defs.question).length);
});

test("schema changes using unsupported constraints fail closed", () => {
  assert.throws(() => validateSchema({}, { dependentRequired: {} }), /Unsupported schema keyword/);
});

test("inventory cannot hide a missing lecture by editing the manifest", () => {
  const m = copy(manifest);
  m.chapters[0].lectures.pop();
  assert.throws(
    () => validateInventory(m, banks, topics, filenames),
    /all website lectures required/,
  );
  assert.throws(
    () => validateInventory(manifest, banks.slice(1), topics, filenames),
    /inventory differs/,
  );
  assert.throws(
    () => validateInventory(manifest, banks, topics, [...filenames, "2.1.json"]),
    /unregistered/,
  );
  assert.throws(() => validateInventory({ schemaVersion: 1, chapters: [] }, [], topics, []));
});

test("inventory rejects duplicate stems even if only numerical values change", () => {
  const b = copy(banks);
  b[1].questions[0].stem = b[0].questions[0].stem;
  assert.throws(() => validateInventory(manifest, b, topics, filenames), /duplicate stem/);
  b[0].questions[0].stem = "质量为 $2$ 时应怎样判断？";
  b[1].questions[0].stem = "质量为 $3$ 时应怎样判断？";
  assert.throws(() => validateInventory(manifest, b, topics, filenames), /changed numbers/);
});

test("each core point must be covered by a post question, not just a pre question", () => {
  const b = copy(banks.find((b) => b.lecture === "1.2.4"));
  const point = b.keyPoints[5];
  b.questions[0].concept.push(point);
  for (const q of b.questions.filter((q) => q.kind === "post"))
    q.concept = q.concept.filter((c) => c !== point);
  assert.throws(() => validateBank(b), /uncovered point/);
});

test("key points must match live source text and depth cannot be demoted", () => {
  const b = copy(example);
  b.keyPoints[0] += "改写";
  assert.throws(() => validateBank(b), /verbatim/);
  const c = copy(example);
  for (const q of c.questions.filter((q) => q.role === "depth")) q.level = "应用";
  assert.throws(() => validateBank(c), /missing depth/);
  const d = copy(example);
  d.questions = d.questions.slice(0, 7);
  assert.throws(() => validateBank(d), /too few items/);
});

test("source checks reject missing design, unknown document and out-of-range page", () => {
  for (const [mutate, message] of [
    [
      (q) => {
        q.source = [q.source[0]];
      },
      /too few items/,
    ],
    [
      (q) => {
        q.source[0].document = "invented";
      },
      /unknown source/,
    ],
    [
      (q) => {
        q.source[0].pages = [999];
      },
      /out of range/,
    ],
  ]) {
    const b = copy(example);
    mutate(b.questions[0]);
    assert.throws(() => validateBank(b), message);
  }
});

test("every distractor needs feedback and answer positions must be dispersed", () => {
  const b = copy(example);
  b.questions[0].explanation.pop();
  assert.throws(() => validateBank(b), /explain every option/);
  const c = copy(example);
  for (const q of c.questions.filter((q) => q.type === "single")) q.answer = "A";
  assert.throws(() => validateBank(c), /distribute correct choices/);
});

test("independent recomputation rejects wrong answers, formulas and tolerance", () => {
  for (const [mutate, message] of [
    [
      (a) => {
        a.value *= 1.01;
      },
      /independently expected/,
    ],
    [
      (a) => {
        a.tolerance.relative = 0.05;
      },
      /relative tolerance/,
    ],
    [
      (a) => {
        a.calculation.formula = "$t=1$";
      },
      /formula mismatch/,
    ],
    [
      (a) => {
        a.calculation.method = "arbitrary-expression";
      },
      /Unknown independent formula/,
    ],
  ]) {
    const a = copy(numeric(example).answer);
    mutate(a);
    assert.throws(() => recomputeNumeric(a), message);
  }
});

test("unit dimensions, output scaling and domain constraints are checked", () => {
  const a = copy(numeric(example).answer);
  a.calculation.inputs.M.unit = "N/m";
  assert.throws(() => recomputeNumeric(a), /incompatible unit/);
  const b = copy(numeric(example).answer);
  b.unit = "Hz";
  assert.throws(() => recomputeNumeric(b), /incompatible output/);
  const c = copy(numeric(example).answer);
  c.calculation.inputs.M.value = -1;
  assert.throws(() => recomputeNumeric(c), /must be positive/);
  const d = copy(numeric(example).answer);
  d.unit = "s";
  d.value /= 1000;
  assert.ok(Math.abs(recomputeNumeric(d) - Math.PI / 80) < 1e-12);
  const e = copy(numeric(banks.find((b) => b.lecture === "1.2.3")).answer);
  e.calculation.inputs.rise.value = 1;
  assert.throws(() => recomputeNumeric(e));
});

test("known physical results provide independent numerical oracles", () => {
  const result = (id) => recomputeNumeric(numeric(banks.find((b) => b.lecture === id)).answer);
  assert.ok(Math.abs(result("1.1.1") - (1000 * Math.PI) / 80) < 1e-9);
  assert.ok(Math.abs(result("1.1.2") - 9) < 1e-12);
  assert.ok(Math.abs(result("1.1.3") - (1000 * Math.log(4)) / 15) < 1e-9);
  assert.ok(Math.abs(result("1.2.3") - Math.log(100) / 2) < 1e-12);
  assert.equal(result("1.2.4"), 960);
  assert.equal(result("1.2.5"), 240);
});

test("KaTeX and formula delimiters are checked", () => {
  assert.throws(() => checkMath("位移 $x=1", "fixture"), /unpaired/);
  assert.throws(() => checkMath("位移 x=1", "fixture"), /outside/);
  assert.throws(() => checkMath("位移 $\\notARealCommand{x}$", "fixture"));
  assert.throws(() => checkMath("使用 Math.sqrt(4)", "fixture"), /programming/);
  checkMath("取 $e^{j\\omega t}$ 的实部。", "fixture");
});

test("review is generated from answers, explanations and post-only coverage", () => {
  const before = renderReview(manifest, banks),
    edited = copy(banks);
  numeric(edited[0]).answer.value = 1;
  const after = renderReview(manifest, edited);
  assert.notEqual(before, after);
  assert.ok(after.includes("1.000 ms（相对容差 ±2%，判分保留完整值）"));
  for (const b of banks)
    for (const q of b.questions) {
      assert.ok(before.includes(`#### ${q.id}`));
      for (const explanation of q.explanation) assert.ok(before.includes(explanation));
    }
});

for (const id of ["1.1.1", "2.1"])
  test(`lecture ${id} depth uses short answers with bounded scoring criteria and no choices`, () => {
    const b = copy(banks.find((b) => b.lecture === id));
    const depth = b.questions[7];
    assert.equal(depth.type, "short");
    assert.equal(depth.answer.rubric.length, 3);
    assert.deepEqual(validateSchema(b), []);
    for (const mutate of [
      (q) => {
        q.answer.rubric = [q.answer.rubric[0]];
      },
      (q) => {
        q.answer.rubric.push("额外评分项");
      },
      (q) => {
        q.answer.reference = "";
      },
      (q) => {
        q.options = copy(example.questions[0].options);
      },
    ]) {
      const q = copy(depth);
      mutate(q);
      assert.ok(validateSchema(q, schema.$defs.question).length);
    }
    const choice = copy(example.questions[8]);
    delete choice.optional;
    b.questions[7] = {
      ...choice,
      id: depth.id,
      lecture: b.lecture,
      stem: depth.stem,
      concept: depth.concept,
      source: depth.source,
    };
    assert.throws(() => validateBank(b), /depth must use short answer/);
  });

test("chapter-wide answer distribution rejects a letter exceeding forty percent", () => {
  const edited = copy(banks);
  for (const b of edited.filter((b) => b.chapter === 2))
    for (const q of b.questions.filter((q) => q.type === "single")) q.answer = "A";
  assert.throws(() => validateInventory(manifest, edited, topics, filenames), /exceeds 40%/);
});

test("distribution includes optional and multi answers, accepts exactly 40%, and checks each chapter", () => {
  const choices = (answers) => answers.map((answer) => ({ type: "single", answer }));
  const fixture = [{ chapter: 1, questions: choices(["A", "A", "B", "C", "D"]) }];
  assert.doesNotThrow(() => checkAnswerDistribution(fixture));
  fixture[0].questions[4] = { type: "single", answer: "A", optional: true };
  assert.throws(() => checkAnswerDistribution(fixture), /chapter 1.*A exceeds 40%/);
  fixture.push({ chapter: 2, questions: choices(["B", "B", "C", "C", "D", "D"]) });
  assert.throws(() => checkAnswerDistribution(fixture), /chapter 1.*A exceeds 40%/);
  fixture[0].questions = choices(["A", "A", "B", "C", "D"]);
  fixture[0].questions.push({ type: "multi", answer: ["A", "B"] });
  assert.throws(() => checkAnswerDistribution(fixture), /A exceeds 40% \(3\/7\)/);
  fixture[0].questions = choices(["A", "A", "B", "C", "D"]);
  fixture[0].questions.push({ type: "short", answer: {} }, { type: "judge", answer: true });
  assert.doesNotThrow(() => checkAnswerDistribution(fixture));
});

test("post-06 preserves an optional choice and required questions cannot be skipped", () => {
  for (const b of banks) {
    assert.equal(b.questions.length, 9);
    const optional = b.questions[8];
    assert.equal(optional.id, `${b.lecture}-post-06`);
    assert.equal(optional.optional, true);
    assert.equal(optional.type, "single");
    // Separate scenarios can cite different pages and cover overlapping rather
    // than identical subsets of the lecture's points. Each precise reference
    // and verbatim point is checked by validateBank.
    assert.deepEqual(
      optional.source.map((s) => s.document),
      b.questions[7].source.map((s) => s.document),
    );
    assert.ok(optional.concept.some((point) => b.questions[7].concept.includes(point)));
    const missing = copy(b);
    missing.questions.pop();
    assert.throws(() => validateBank(missing), /too few items/);
    for (const mutate of [
      (bank) => {
        delete bank.questions[8].optional;
      },
      (bank) => {
        bank.questions[7].optional = true;
      },
      (bank) => {
        bank.questions[8].type = "judge";
        delete bank.questions[8].options;
        bank.questions[8].answer = true;
      },
    ]) {
      const edited = copy(b);
      mutate(edited);
      assert.throws(() => validateBank(edited), /optional/);
    }
  }
});

test("chapter 2 numerical methods check physical values, SI conversions and invalid domains", () => {
  const answer = (id) => copy(numeric(banks.find((b) => b.lecture === id)).answer);
  assert.ok(Math.abs(recomputeNumeric(answer("2.1")) - 0.4) < 1e-12);
  assert.ok(Math.abs(recomputeNumeric(answer("2.2")) - 1 / 9) < 1e-12);
  assert.ok(Math.abs(recomputeNumeric(answer("2.3")) - 32.27486121839514) < 1e-10);
  assert.ok(Math.abs(recomputeNumeric(answer("2.4")) - 67.5) < 1e-10);
  const density = answer("2.1");
  density.unit = "kg/m";
  density.value = 0.0004;
  assert.ok(Math.abs(recomputeNumeric(density) - 0.0004) < 1e-12);
  const modulus = answer("2.4");
  modulus.calculation.inputs.fa = { value: 6250, unit: "Hz" };
  modulus.calculation.inputs.fb = { value: 9375, unit: "Hz" };
  modulus.unit = "Pa";
  modulus.value = 67.5e9;
  assert.equal(recomputeNumeric(modulus), 67.5e9);
  for (const [id, mutate] of [
    [
      "2.1",
      (a) => {
        a.calculation.inputs.acceleration.value = 0;
      },
    ],
    [
      "2.1",
      (a) => {
        a.calculation.inputs.curvature.value *= -1;
      },
    ],
    [
      "2.2",
      (a) => {
        a.calculation.inputs.alpha.value = 0;
      },
    ],
    [
      "2.3",
      (a) => {
        a.calculation.inputs.d.value = 0;
      },
    ],
    [
      "2.3",
      (a) => {
        a.calculation.inputs.E.unit = "N";
      },
    ],
    [
      "2.4",
      (a) => {
        a.calculation.inputs.fb.value = 6;
      },
    ],
  ]) {
    const a = answer(id);
    mutate(a);
    assert.throws(() => recomputeNumeric(a));
  }
});

test("teacher-only sources and rounded review preserve full answers and short-answer guidance", () => {
  assert.equal(schema.$defs.question.properties.source.teacherOnly, true);
  assert.equal(schema.$defs.lectureBank.properties.sources.teacherOnly, true);
  const review = renderReview(manifest, banks);
  assert.ok(review.includes("32.27 kHz"));
  assert.ok(!review.includes("32.274861218395145 kHz"));
  for (const b of banks) {
    const q = b.questions[7];
    assert.ok(review.includes(q.answer.reference));
    for (const point of q.answer.rubric) assert.ok(review.includes(point));
    const n = numeric(b);
    assert.ok(review.includes(quantityText(n.answer.value, n.answer.unit, 4)));
    assert.ok(Math.abs(n.answer.value - recomputeNumeric(n.answer)) < 1e-12);
  }
  const b = copy(banks.find((b) => b.lecture === "2.1"));
  b.questions[7].answer.reference = "未闭合的公式 $x";
  assert.throws(() => validateBank(b), /unpaired/);
});

test("dimensionless answers and calculation inputs never display unit 1", () => {
  assert.equal(quantityText(1 / 9, "1", 4), "0.1111");
  assert.equal(quantityText(0.25, "1"), "0.25");
  assert.equal(quantityText(0.4, "g/m", 4), "0.4000 g/m");
  const review = renderReview(manifest, banks);
  assert.ok(review.includes("alpha = 0.25。"));
  assert.ok(review.includes("0.1111（相对容差"));
  assert.ok(!review.includes("0.1111 1"));
  assert.ok(!review.includes("alpha = 0.25 1"));
  assert.ok(!review.includes("eta = 0.05 1"));
  for (const b of banks) checkNumericDisplay(numeric(b).answer);
});

test("requirements 6–8 cover all 79 lectures and reject regressions in every chapter", () => {
  assert.equal(banks.length, 79);
  for (const original of banks) {
    checkOptionalScenario(original.questions[7], original.questions[8]);
    const extra = copy(original);
    extra.questions[8].stem = "是否成立？" + extra.questions[8].stem;
    assert.throws(() => validateBank(extra), /one question mark/);
    const reused = copy(original);
    reused.questions[8].stem =
      reused.questions[7].stem.replace(/[？?]/gu, "。") + "以下哪一项判断成立？";
    assert.throws(() => validateBank(reused), /too similar/);
    const unit = copy(numeric(original).answer);
    unit.unit = "1";
    assert.throws(() => checkNumericDisplay(unit), /unit 1 is forbidden/);
    const input = copy(numeric(original).answer);
    Object.values(input.calculation.inputs)[0].unit = "1";
    assert.throws(() => checkNumericDisplay(input), /unit 1 is forbidden/);
  }
  const b = banks[0],
    badEnding = copy(b.questions[8]);
  badEnding.stem = badEnding.stem.replace(/以下哪一项判断成立？$/u, "应如何判断？");
  assert.throws(() => checkOptionalScenario(b.questions[7], badEnding), /assessment wording/);
  const ascii = copy(b.questions[8]);
  ascii.stem = "Another question?" + ascii.stem;
  assert.throws(() => checkOptionalScenario(b.questions[7], ascii), /one question mark/);
  assert.equal(quantityText(0.25, ""), "0.25");
  assert.equal(quantityText(1 / 9, "", 4), "0.1111");
});

test("review batch 1 editorial rules reject regressions in all 79 lectures", () => {
  assert.equal(banks.length, 79);
  for (const original of banks) {
    for (const question of original.questions) checkEditorialText(question);
    const doubled = copy(original);
    doubled.questions[8].explanation[0] += "。";
    assert.throws(() => validateBank(doubled), /repeated full stop/);

    const reason = copy(original);
    const q = reason.questions[8];
    q.options.find((o) => o.id === q.answer).text += "；这是因为模型满足该条件";
    q.explanation[q.options.findIndex((o) => o.id === q.answer)] =
      `${q.answer}：这是因为模型满足该条件。`;
    assert.throws(() => validateBank(reason), /repeated option reason/);

    for (const location of ["stem", "reference", "rubric", "option"]) {
      const appended = copy(original),
        short = appended.questions[7];
      const splice = (text) => text.replace(/[。！？!?]$/u, "") + "。 另外还需检查背景。";
      if (location === "stem") short.stem = splice(short.stem);
      else if (location === "reference") short.answer.reference = splice(short.answer.reference);
      else if (location === "rubric") short.answer.rubric[0] = splice(short.answer.rubric[0]);
      else appended.questions[8].options[0].text = splice(appended.questions[8].options[0].text);
      assert.throws(() => validateBank(appended), /appended sentence/);
    }
  }
  const q = copy(example.questions[8]);
  q.options.find((o) => o.id === q.answer).text += "; the reason is repeated";
  q.explanation = ["the reason is repeated"];
  assert.throws(() => checkEditorialText(q), /repeated option reason/);
  q.options.find((o) => o.id === q.answer).text = "该判断成立，因为模型满足条件";
  assert.throws(() => checkEditorialText(q), /judgement only/);
  q.stem += "。\n补充一句。";
  assert.throws(() => checkEditorialText(q), /appended sentence/);
  const math = copy(example.questions[7]);
  math.stem = "请判断记录。$M,D$ 不变时，测量结果是否一致？";
  checkEditorialText(math); // A space after TeX is not a sentence splice.
  math.answer.reference = "First judgement. Another appended sentence.";
  assert.throws(() => checkEditorialText(math), /appended sentence/);
});

test("post-06 length rule is chapter-local, counts ties and enforces the 30% boundary", () => {
  checkPost06Lengths(banks);
  assert.deepEqual(
    post06LengthStats(banks).map((s) => s.total),
    [10, 4, 48, 9, 3, 2, 3],
  );
  for (const chapter of manifest.chapters.map((c) => c.chapter)) {
    const edited = copy(banks);
    for (const bank of edited.filter((b) => b.chapter === chapter)) {
      const q = bank.questions[8];
      // A tie must be rejected too, including chapters with only 2 or 3 lectures.
      q.options.forEach((o) => (o.text = "同样长度"));
    }
    assert.throws(() => checkPost06Lengths(edited), new RegExp(`chapter ${chapter}:.*exceeds 30%`));
  }
  const questions = Array.from({ length: 10 }, (_, i) => ({
    id: `${i}-post-06`,
    answer: "A",
    options: [
      { id: "A", text: i < 3 ? "甲乙" : "甲" },
      { id: "B", text: "丙丁" },
    ],
  }));
  const fixture = [{ chapter: 1, questions }];
  assert.doesNotThrow(() => checkPost06Lengths(fixture)); // 3/10, tied maxima.
  questions[3].options[0].text = "甲乙丙";
  assert.throws(() => checkPost06Lengths(fixture), /4\/10/);
  questions[3].options[0].text = "甲";
  fixture.push({ chapter: 2, questions: questions.slice(0, 3) });
  assert.throws(() => checkPost06Lengths(fixture), /chapter 2/);
});

test("absolute tolerances are unit-specific and exclude relative tolerances in schema and checker", () => {
  const affected = banks
    .flatMap((b) => b.questions)
    .filter((q) => q.type === "numeric" && ["dB", "%", "deg", "°", "rad"].includes(q.answer.unit));
  assert.equal(affected.length, 7);
  for (const q of affected) {
    const answer = q.answer;
    checkNumericTolerance(answer);
    assert.deepEqual(validateSchema(answer, schema.$defs.numericAnswer), []);
    const missing = copy(answer);
    delete missing.absoluteTolerance;
    missing.tolerance = { relative: 0.02 };
    assert.throws(() => checkNumericTolerance(missing), /absoluteTolerance/);
    assert.ok(validateSchema(missing, schema.$defs.numericAnswer).length);
    for (const changed of [
      { ...answer, tolerance: { relative: 0.02 } },
      { ...answer, absoluteTolerance: answer.absoluteTolerance * 2 },
    ]) {
      assert.throws(() => checkNumericTolerance(changed), /tolerance|Tolerance/);
      assert.ok(validateSchema(changed, schema.$defs.numericAnswer).length);
    }
    assert.ok(renderReview(manifest, banks).includes(toleranceText(answer)));
  }
  for (const [unit, absoluteTolerance] of [
    ["dB", 0.1],
    ["%", 0.2],
    ["deg", 0.2],
    ["°", 0.2],
    ["rad", 0.01],
  ]) {
    const a = { ...copy(numeric(example).answer), unit, absoluteTolerance };
    delete a.tolerance;
    checkNumericTolerance(a);
    assert.deepEqual(validateSchema(a, schema.$defs.numericAnswer), []);
  }
  const relative = { ...numeric(example).answer, absoluteTolerance: 0.1 };
  assert.throws(() => checkNumericTolerance(relative), /Unexpected absoluteTolerance/);
  assert.ok(validateSchema(relative, schema.$defs.numericAnswer).length);
  assert.equal(toleranceText({ unit: "%", absoluteTolerance: 0.2 }), "绝对容差 ±0.2 个百分点");
  const angle = copy(numeric(banks.find((b) => b.lecture === "3.6.9")).answer);
  angle.unit = "°";
  assert.ok(Math.abs(recomputeNumeric(angle) - 10) < 1e-10);
  angle.unit = "rad";
  angle.value *= Math.PI / 180;
  angle.absoluteTolerance = 0.01;
  assert.ok(Math.abs(recomputeNumeric(angle) - Math.PI / 18) < 1e-10);
});

test("3.4.6 background subtraction distinguishes source, total and background levels", () => {
  const q = numeric(banks.find((b) => b.lecture === "3.4.6"));
  assert.equal(q.answer.calculation.inputs.total.value, 76);
  assert.equal(q.answer.calculation.inputs.background.value, 70);
  assert.ok(q.stem.includes("76.0"));
  const expected = 70 + 10 * Math.log10(10 ** 0.6 - 1);
  assert.ok(Math.abs(recomputeNumeric(q.answer) - expected) < 1e-10);
  assert.ok(q.explanation.some((s) => s.includes("74.74")));
  assert.ok(renderReview(manifest, banks).includes("74.74 dB（绝对容差 ±0.1 dB"));
  for (const wrong of [70, 76, 6]) {
    assert.ok(Math.abs(wrong - q.answer.value) > q.answer.absoluteTolerance);
    assert.throws(() => recomputeNumeric({ ...q.answer, value: wrong }), /independently expected/);
  }
});
