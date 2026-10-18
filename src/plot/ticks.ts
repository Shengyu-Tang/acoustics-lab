export type AxisTicks = {
  limits: [number, number];
  values: number[];
  minor: number[];
  exponent: number;
  step: number;
};
const clean = (n: number) => Number(n.toPrecision(13));
export const superscript = (n: number) =>
  String(n).replace(/[-\d]/g, (c) => "⁻⁰¹²³⁴⁵⁶⁷⁸⁹"["-0123456789".indexOf(c)]);

/** Nice limits enclose the data; labels use 1, 2, 2.5, 5 decade steps. */
export function axisTicks(input: [number, number], log = false): AxisTicks {
  let [lo, hi] = input;
  if (!Number.isFinite(lo + hi) || lo > hi || (log && lo <= 0))
    throw new RangeError("Axis limits must be finite, ordered and positive for log axes");
  if (lo === hi) {
    const pad = Math.abs(lo) * 0.1 || 1;
    lo = log ? lo / 10 : lo - pad;
    hi = log ? hi * 10 : hi + pad;
  }
  if (log) {
    const first = Math.floor(Math.log10(lo)),
      last = Math.ceil(Math.log10(hi));
    const values = [],
      minor = [];
    for (let e = first; e <= last; e++) {
      values.push(10 ** e);
      if (e < last) for (let m = 2; m <= 9; m++) minor.push(m * 10 ** e);
    }
    return { limits: [10 ** first, 10 ** last], values, minor, exponent: 0, step: 0 };
  }
  const raw = (hi - lo) / 5,
    decade = 10 ** Math.floor(Math.log10(raw));
  const candidates = [1, 2, 2.5, 5, 10].map((m) => m * decade);
  const step = candidates.reduce(
    (best, s) => {
      const count = Math.ceil(hi / s - 1e-10) - Math.floor(lo / s + 1e-10) + 1;
      const score = Math.abs(count - 6) + (count < 4 || count > 8 ? 100 : 0);
      return score < best.score ? { step: s, score } : best;
    },
    { step: candidates[0], score: Infinity },
  ).step;
  const start = Math.floor(lo / step + 1e-10),
    end = Math.ceil(hi / step - 1e-10);
  const values = Array.from({ length: end - start + 1 }, (_, i) => clean((start + i) * step));
  const largest = Math.max(Math.abs(lo), Math.abs(hi));
  let exponent = largest >= 1e4 || largest < 0.01 ? Math.floor(Math.log10(step)) : 0;
  // Ensure scaled tick labels are integers, including a 2.5 step.
  if (exponent && Math.abs(step / 10 ** exponent - Math.round(step / 10 ** exponent)) > 1e-8)
    exponent--;
  return { limits: [clean(start * step), clean(end * step)], values, minor: [], exponent, step };
}
export function tickLabel(value: number, axis: AxisTicks, log = false) {
  return log
    ? `10${superscript(Math.round(Math.log10(value)))}`
    : String(clean(value / 10 ** axis.exponent));
}
