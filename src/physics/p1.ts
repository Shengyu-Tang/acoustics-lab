/** Concentrated-parameter initial-value solutions, in SI units. */
export type Motion = Record<string, number>;
export function freeMotion(p: Motion, t: number) {
  const w0 = Math.sqrt(p.D / p.M),
    d = p.Rm / (2 * p.M),
    q = d * d - w0 * w0;
  if (Math.abs(q) < 1e-10 * w0 * w0) return Math.exp(-d * t) * (p.x0 + (p.v0 + d * p.x0) * t);
  if (q < 0) {
    const w = Math.sqrt(-q);
    return Math.exp(-d * t) * (p.x0 * Math.cos(w * t) + ((p.v0 + d * p.x0) / w) * Math.sin(w * t));
  }
  const h = Math.sqrt(q),
    r1 = (-w0 * w0) / (d + h),
    r2 = -d - h;
  return (
    ((p.v0 - r2 * p.x0) * Math.exp(r1 * t) + (r1 * p.x0 - p.v0) * Math.exp(r2 * t)) / (r1 - r2)
  );
}
export function decay(p: Motion) {
  const w0 = Math.sqrt(p.D / p.M),
    delta = p.Rm / (2 * p.M),
    wd = Math.sqrt(Math.max(0, w0 * w0 - delta * delta));
  return {
    w0,
    delta,
    wd,
    f0: w0 / (2 * Math.PI),
    T: (2 * Math.PI) / w0,
    Qm: delta ? w0 / (2 * delta) : Infinity,
    Td: wd ? (2 * Math.PI) / wd : Infinity,
    logDecrement: wd ? (2 * Math.PI * delta) / wd : Infinity,
    tau: delta ? 1 / delta : Infinity,
    transition: delta ? Math.log(20) / delta : Infinity,
  };
}
/** Cosine excitation switched on at t=0; exact zero-initial-condition solution. */
export function forcedMotion(p: Motion, t: number) {
  const w0 = Math.sqrt(p.D / p.M),
    w = p.ratio * w0;
  if (p.Rm === 0) {
    const x =
      Math.abs(w - w0) < 1e-9 * w0
        ? (p.F0 / (2 * p.M * w0)) * t * Math.sin(w0 * t)
        : (p.F0 / (p.M * (w0 * w0 - w * w))) * (Math.cos(w * t) - Math.cos(w0 * t));
    return { total: x, steady: NaN, transient: NaN };
  }
  const a = p.D - p.M * w * w,
    b = p.Rm * w,
    den = a * a + b * b;
  const C = (p.F0 * a) / den,
    S = (p.F0 * b) / den;
  const steady = C * Math.cos(w * t) + S * Math.sin(w * t);
  const transient = freeMotion({ ...p, x0: p.x0 - C, v0: p.v0 - w * S }, t);
  return { steady, transient, total: steady + transient };
}
/** Classical RK4, independent of the analytic solutions, also accepts pulse forcing. */
export function integrate(p: Motion, force: (t: number) => number, dt: number, count: number) {
  let x = p.x0,
    v = p.v0;
  const result: [number, number][] = [[0, x]];
  const acc = (t: number, x: number, v: number) => (force(t) - p.Rm * v - p.D * x) / p.M;
  for (let i = 0; i < count; i++) {
    const t = i * dt,
      a = acc(t, x, v),
      b = acc(t + dt / 2, x + (dt * v) / 2, v + (dt * a) / 2),
      c = acc(t + dt / 2, x + (dt * (v + (dt * a) / 2)) / 2, v + (dt * b) / 2),
      d = acc(t + dt, x + dt * (v + (dt * b) / 2), v + dt * c);
    x += (dt / 6) * (v + 2 * (v + (dt * a) / 2) + 2 * (v + (dt * b) / 2) + v + dt * c);
    v += (dt / 6) * (a + 2 * b + 2 * c + d);
    result.push([(i + 1) * dt, x]);
  }
  return result;
}
/** Zero-state damped response to cos(ωt+phase), switched on at local t=0. */
export function harmonicStep(p: Motion, t: number, phase: number) {
  if (t < 0) return 0;
  const w = Math.sqrt(p.D / p.M) * p.ratio,
    a = p.D - p.M * w * w,
    b = p.Rm * w,
    den = a * a + b * b;
  const C = (p.F0 * (a * Math.cos(phase) + b * Math.sin(phase))) / den;
  const S = (p.F0 * (b * Math.cos(phase) - a * Math.sin(phase))) / den;
  return C * Math.cos(w * t) + S * Math.sin(w * t) + freeMotion({ ...p, x0: -C, v0: -w * S }, t);
}
/** Two sine-filled rectangular bursts, with exact switch-on/off superposition. */
export function pulseMotion(p: Motion, t: number, on: number, gap: number) {
  const w = Math.sqrt(p.D / p.M) * p.ratio,
    period = on + gap;
  let x = 0;
  for (let i = 0; i < 2; i++)
    for (const [time, sign] of [
      [i * period, 1],
      [i * period + on, -1],
    ])
      x += sign * harmonicStep(p, t - time, w * time - Math.PI / 2);
  return x;
}
