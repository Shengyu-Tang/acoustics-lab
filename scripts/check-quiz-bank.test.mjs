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
} from "./check-quiz-bank.mjs";
import { loadBanks, renderReview, quantityText, root } from "./quiz-bank-review.mjs";

const { manifest, banks } = loadBanks();
const topics = JSON.parse(fs.readFileSync(path.join(root, "src/topics.json"), "utf8"));
const filenames = banks.map((b) => `${b.lecture}.json`);
const copy = (v) => structuredClone(v);
const example = banks.find((b) => b.lecture === "1.1.1");
const numeric = (b) => b.questions.find((q) => q.type === "numeric");

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
      numeric(b).answer.calculation.inputs.M.unit = "";
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
    assert.deepEqual(optional.source, b.questions[7].source);
    assert.deepEqual(optional.concept, b.questions[7].concept);
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
