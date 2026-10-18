import assert from "node:assert/strict";
import { axisTicks, tickLabel } from "../src/plot/ticks.ts";
import { labelLanes, bestLegend, textWidth } from "../src/plot/layout.ts";

for (const [limits, expected] of [
  [
    [-5, 5],
    [-5, -2.5, 0, 2.5, 5],
  ],
  [
    [0, 90],
    [0, 10, 20, 30, 40, 50, 60, 70, 80, 90],
  ],
  [
    [0, 79.08],
    [0, 20, 40, 60, 80],
  ],
  [
    [-2.063, 6.875],
    [-4, -2, 0, 2, 4, 6, 8],
  ],
  [
    [0, 0.09484],
    [0, 0.02, 0.04, 0.06, 0.08, 0.1],
  ],
])
  assert.deepEqual(axisTicks(limits).values, expected);
for (const limits of [
  [0, 79.08],
  [-2.063, 6.875],
  [0, 0.09484],
  [-14000, 13912],
  [0, 0.00009484],
  [-1, 1],
  [5, 5],
  [0, 0],
  [100, 100.01],
]) {
  const a = axisTicks(limits);
  assert.deepEqual(a.limits, [a.values[0], a.values.at(-1)]);
  assert.ok(a.limits[0] <= limits[0] && a.limits[1] >= limits[1]);
  assert.ok(a.values.length >= 4 && a.values.length <= 8);
  assert.ok(a.values.every((v, i) => !i || v > a.values[i - 1]));
  const normalized = Number((a.step / 10 ** Math.floor(Math.log10(a.step))).toPrecision(8));
  assert.ok([1, 2, 2.5, 5].includes(normalized));
  assert.ok(a.values.every((v) => tickLabel(v, a) !== "-0"));
  if (a.exponent) assert.ok(a.values.every((v) => Number.isInteger(Number(tickLabel(v, a)))));
}
const log = axisTicks([0.001, 100], true);
assert.deepEqual(log.values, [0.001, 0.01, 0.1, 1, 10, 100]);
assert.equal(tickLabel(0.001, log, true), "10⁻³");
assert.equal(tickLabel(100, log, true), "10²");
assert.equal(log.minor.length, 40);
assert.deepEqual(log.limits, [log.values[0], log.values.at(-1)]);
assert.ok(log.minor.includes(0.002) && log.minor.includes(90));
assert.throws(() => axisTicks([0, 1], true), RangeError);
assert.throws(() => axisTicks([2, 1]), RangeError);
const labels = labelLanes(
  {
    annotations: [
      { axis: "x", value: 30, label: "f₁ = 30 Hz" },
      { axis: "x", value: 31, label: "f₀ = 31 Hz" },
      { axis: "x", value: 33, label: "f₂ = 33 Hz" },
    ],
  },
  0,
  240,
  (x) => x / 80,
);
for (const a of labels)
  for (const b of labels) {
    if (a === b || a.lane !== b.lane) continue;
    assert.ok(a.x + textWidth(a.text) <= b.x || b.x + textWidth(b.text) <= a.x);
  }
assert.deepEqual(
  bestLegend(
    {
      xlim: [0, 100],
      ylim: [0, 100],
      series: [
        {
          points: [
            [70, 5],
            [95, 20],
          ],
        },
      ],
    },
    0,
    0,
    100,
    100,
    30,
    20,
    (x, y) => [x, y],
  ),
  [7, 7],
);
console.log(
  "PASS: nice tick steps, review examples, enclosing limits, scientific labels, log major/minor ticks and degenerate ranges.",
);
