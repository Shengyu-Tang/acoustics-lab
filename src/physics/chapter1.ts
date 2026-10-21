/** SI units; phasors use exp(jωt), force amplitude is peak, not RMS. */
export type Oscillator = { M: number; D: number; Rm: number; F0: number };
export const instrument = { M: 10, D: 395000, Rm: 80, F0: 50, n: 1900, limit: 1 };
export function characteristics(p: Oscillator) {
  const omega0 = Math.sqrt(p.D / p.M),
    f0 = omega0 / (2 * Math.PI);
  const delta = p.Rm / (2 * p.M),
    zeta = delta / omega0,
    Qm = (omega0 * p.M) / p.Rm;
  const root = Math.sqrt(Math.max(0, 1 - 2 * zeta * zeta));
  const half = p.Rm / (2 * p.M),
    center = Math.hypot(omega0, half);
  return {
    omega0,
    f0,
    delta,
    zeta,
    Qm,
    fx: root > 0 ? f0 * root : null,
    fv: f0,
    fa: root > 0 ? f0 / root : null,
    f1: (center - half) / (2 * Math.PI),
    f2: (center + half) / (2 * Math.PI),
    bandwidth: f0 / Qm,
    transition: Math.log(20) / delta,
  };
}
export function response(p: Oscillator, f: number) {
  if (f === 0)
    return {
      x: p.F0 / p.D,
      v: 0,
      a: 0,
      px: 0,
      pv: Math.PI / 2,
      pa: Math.PI,
      resistance: p.Rm,
      reactance: -Infinity,
      impedance: Infinity,
      power: 0,
    };
  const w = 2 * Math.PI * f,
    massTerm = w * p.M,
    springTerm = p.D / w,
    difference = massTerm - springTerm,
    // Cancellation at resonance is roundoff, relative to the two impedance terms.
    reactance =
      Math.abs(difference) <=
      8 * Number.EPSILON * Math.max(Math.abs(massTerm), Math.abs(springTerm))
        ? 0
        : difference,
    impedance = Math.hypot(p.Rm, reactance);
  const v = p.F0 / impedance,
    pv = -Math.atan2(reactance, p.Rm);
  return {
    x: v / w,
    v,
    a: w * v,
    px: pv - Math.PI / 2,
    pv,
    pa: pv + Math.PI / 2,
    resistance: p.Rm,
    reactance,
    impedance,
    power: 0.5 * p.Rm * v * v,
  };
}
export function instantaneous(p: Oscillator, f: number, t: number) {
  const r = response(p, f),
    force = p.F0 * Math.cos(2 * Math.PI * f * t),
    velocity = r.v * Math.cos(2 * Math.PI * f * t + r.pv);
  return { force, velocity, input: force * velocity, dissipation: p.Rm * velocity * velocity };
}
export function instrumentSolution(p: typeof instrument) {
  const c = characteristics(p),
    f = p.n / 60,
    r = response(p, f),
    target = p.limit / 1000;
  const minimumRm = Math.sqrt(
    Math.max(0, (p.F0 / (2 * Math.PI * f * target)) ** 2 - r.reactance ** 2),
  );
  return {
    ...c,
    f,
    ...r,
    xMm: r.x * 1000,
    minimumRm,
    improvedMm: response({ ...p, Rm: 400 }, f).x * 1000,
    inBand: f >= c.f1 && f <= c.f2,
    safe: r.x < target,
  };
}
export function grade(answer: number, expected: number, tolerance = 0.02) {
  if (!Number.isFinite(answer)) return "请输入有限数值";
  const roundoff = 4 * Number.EPSILON * Math.max(Math.abs(answer), Math.abs(expected));
  if (Math.abs(answer - expected) <= Math.abs(expected) * tolerance + roundoff) return "正确";
  if (expected !== 0 && Math.max(Math.abs(answer / expected), Math.abs(expected / answer)) >= 10)
    return "量级错误";
  return answer > expected ? "偏大" : "偏小";
}

export const bandwidthExperiment = { M: 10, D: 395000, f1: 30, f2: 33.33, velocity: 0.2 };
export function bandwidthSolution(p: typeof bandwidthExperiment) {
  if (p.f1 <= 0 || p.f2 <= p.f1) throw new RangeError("半功率频率须满足 0 < f₁ < f₂");
  const f0 = Math.sqrt(p.D / p.M) / (2 * Math.PI),
    measuredF0 = Math.sqrt(p.f1 * p.f2),
    bandwidth = p.f2 - p.f1,
    Rm = 2 * Math.PI * p.M * bandwidth,
    Qm = f0 / bandwidth,
    power = 0.5 * Rm * p.velocity ** 2,
    force = Rm * p.velocity;
  return {
    f0,
    measuredF0,
    bandwidth,
    Rm,
    Qm,
    power,
    force,
    mismatch: Math.abs(measuredF0 / f0 - 1),
  };
}
