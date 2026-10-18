import {
  complex as C,
  add,
  mul,
  divide as div,
  scale,
  magnitude,
  cylindricalBessel,
} from "./chapter3b";
export { C, add, mul, div, scale, magnitude };
export const phase = (x: number) => C(Math.cos(x), Math.sin(x));
export const kWave = (f: number, c: number) => (2 * Math.PI * f) / c;
export function sphere(a: number, f: number, rho: number, c: number, v: number, r: number) {
  const k = kWave(f, c),
    x = k * a,
    S = 4 * Math.PI * a * a;
  const z = C((rho * c * S * x * x) / (1 + x * x), (rho * c * S * x) / (1 + x * x));
  const pressure = scale(
    mul(div(C(0, k * a * a), C(1, x)), phase(-k * (r - a))),
    (rho * c * v) / r,
  );
  return { z, pressure, power: 0.5 * v * v * z.re, mass: z.im / (2 * Math.PI * f) };
}
export function monopole(Q: number, f: number, rho: number, c: number, r: number) {
  return mul(C(0, (rho * f * Q) / (2 * r)), phase(-kWave(f, c) * r));
}
export const dipoleRatio = (f: number, d: number, c: number) => (kWave(f, c) * d) ** 2 / 3;
export function jn(n: number, x: number): number {
  if (x === 0) return n === 0 ? 1 : 0;
  if (x > 12 && n < x + 1) {
    const b = cylindricalBessel(x);
    let a = b.J0,
      v = b.J1;
    for (let i = 1; i < n; i++) {
      const q = ((2 * i) / x) * v - a;
      a = v;
      v = q;
    }
    return n === 0 ? a : v;
  }
  let term = (x / 2) ** n;
  for (let i = 2; i <= n; i++) term /= i;
  let sum = term;
  for (let m = 1; m < 160; m++) {
    term *= -((x * x) / 4) / (m * (m + n));
    sum += term;
    if (Math.abs(term) < 1e-16 * Math.max(1, Math.abs(sum))) break;
  }
  return sum;
}
export const pistonD = (x: number) => (Math.abs(x) < 1e-6 ? 1 : (2 * jn(1, x)) / x);
export function pistonAxis(z: number, a: number, f: number, rho: number, c: number, v: number) {
  const k = kWave(f, c),
    delta = (a * a) / (Math.hypot(z, a) + z);
  return scale(mul(phase(-k * z), add(C(1), scale(phase(-k * delta), -1))), rho * c * v);
}
export const rayleigh = (a: number, f: number, c: number) => (4 * a * a * f) / c;
export const lastMaximum = (a: number, f: number, c: number) =>
  Math.max(0, (a * a * f) / c - c / (4 * f));
export function extrema(a: number, f: number, c: number, maxima: boolean) {
  const lambda = c / f,
    out: number[] = [];
  for (let n = maxima ? 0 : 1; n < 100; n++) {
    const delta = (maxima ? n + 0.5 : n) * lambda;
    if (delta > a) break;
    out.push((a * a - delta * delta) / (2 * delta));
  }
  return out;
}
export function cylindrical(n: number, x: number) {
  const b = cylindricalBessel(Math.max(1e-8, x));
  let y0 = b.Y0,
    y1 = b.Y1;
  for (let m = 1; m < n; m++) {
    const yn = ((2 * m) / x) * y1 - y0;
    y0 = y1;
    y1 = yn;
  }
  return C(jn(n, x), -(n === 0 ? b.Y0 : y1));
}
/** Outgoing 2D Green function, (Laplacian+k²)G=-delta, e^{jwt}. */
export const green2 = (k: number, r: number) => mul(C(0, -0.25), cylindrical(0, k * r));
export const green2Derivative = (k: number, r: number) => mul(C(0, k / 4), cylindrical(1, k * r));
export function helmholtz(
  x: number,
  y: number,
  a: number,
  f: number,
  c: number,
  N: number,
  exterior = false,
) {
  const k = kWave(f, c);
  let sum = C(0);
  for (let i = 0; i < N; i++) {
    const phi = (2 * Math.PI * (i + 0.5)) / N,
      nx = Math.cos(phi),
      ny = Math.sin(phi),
      sx = a * nx,
      sy = a * ny;
    const r = Math.hypot(x - sx, y - sy);
    if (r < 1e-8) continue;
    const p = exterior ? green2(k, a) : phase(-k * sx);
    const dp = exterior ? green2Derivative(k, a) : mul(C(0, -k * nx), p);
    const G = green2(k, r),
      dn = scale(green2Derivative(k, r), ((sx - x) * nx + (sy - y) * ny) / r);
    sum = add(
      sum,
      scale(add(mul(G, dp), scale(mul(p, dn), -1)), ((a * 2 * Math.PI) / N) * (exterior ? -1 : 1)),
    );
  }
  return sum;
}
export function cylinderField(x: number, y: number, a: number, f: number, c: number, soft = false) {
  const r = Math.hypot(x, y),
    k = kWave(f, c),
    phi = Math.atan2(y, x),
    ka = k * a;
  if (r < a * (1 - 1e-12)) return { incident: C(0), scattered: C(0), total: C(0) };
  let ps = C(0);
  const N = Math.ceil(ka + 12);
  for (let n = 0; n <= N; n++) {
    const h = cylindrical(n, ka),
      dh = n === 0 ? scale(cylindrical(1, ka), -1) : add(cylindrical(n - 1, ka), scale(h, -n / ka));
    const j = jn(n, ka),
      dj = n === 0 ? -jn(1, ka) : jn(n - 1, ka) - (n / ka) * j;
    const coeff = scale(div(C(soft ? j : dj), soft ? h : dh), -(n === 0 ? 1 : 2));
    ps = add(
      ps,
      scale(mul(mul(coeff, phase((-n * Math.PI) / 2)), cylindrical(n, k * r)), Math.cos(n * phi)),
    );
  }
  const incident = phase(-k * x);
  return { incident, scattered: ps, total: add(incident, ps) };
}
export function sphericalBessel(n: number, x: number) {
  let df = 1;
  for (let m = 1; m <= n; m++) df *= 2 * m + 1;
  let term = x ** n / df,
    sum = term;
  for (let m = 1; m < 100; m++) {
    term *= (-x * x) / (2 * m * (2 * n + 2 * m + 1));
    sum += term;
    if (Math.abs(term) < 1e-17) break;
  }
  let y0 = -Math.cos(x) / x,
    y1 = -Math.cos(x) / (x * x) - Math.sin(x) / x;
  for (let m = 1; m < n; m++) {
    const yn = ((2 * m + 1) / x) * y1 - y0;
    y0 = y1;
    y1 = yn;
  }
  return C(sum, -(n === 0 ? -Math.cos(x) / x : y1));
}
export function rigidSphere(ka: number, theta: number) {
  let angular = C(0),
    sigma = 0,
    P0 = 1,
    P1 = Math.cos(theta);
  for (let n = 0; n <= Math.ceil(ka + 12); n++) {
    const h = sphericalBessel(n, ka),
      dh =
        n === 0
          ? scale(sphericalBessel(1, ka), -1)
          : add(sphericalBessel(n - 1, ka), scale(h, -(n + 1) / ka));
    const q = div(C(dh.re), dh),
      P = n === 0 ? 1 : n === 1 ? P1 : ((2 * n - 1) * Math.cos(theta) * P1 - (n - 1) * P0) / n;
    if (n >= 2) {
      P0 = P1;
      P1 = P;
    }
    angular = add(angular, scale(q, (2 * n + 1) * P));
    sigma += (2 * n + 1) * magnitude(q) ** 2;
  }
  return { amplitude: magnitude(angular) / ka, crossSection: (4 * sigma) / (ka * ka) };
}
export const npToDb = (x: number) => (20 / Math.LN10) * x;
export function cylinderFar(ka: number, theta: number, soft = false) {
  let sum = C(0);
  for (let n = 0; n <= Math.ceil(ka + 12); n++) {
    const h = cylindrical(n, ka),
      dh = n === 0 ? scale(cylindrical(1, ka), -1) : add(cylindrical(n - 1, ka), scale(h, -n / ka));
    const dj = n === 0 ? -jn(1, ka) : jn(n - 1, ka) - (n / ka) * jn(n, ka);
    sum = add(
      sum,
      scale(div(C(soft ? jn(n, ka) : dj), soft ? h : dh), -(n === 0 ? 1 : 2) * Math.cos(n * theta)),
    );
  }
  return sum;
}
export function arrayPressure(
  x: number,
  y: number,
  N: number,
  d: number,
  Q: number,
  f: number,
  rho: number,
  c: number,
) {
  let total = C(0);
  for (let n = 0; n < N; n++)
    total = add(
      total,
      monopole(Q, f, rho, c, Math.max(0.005, Math.hypot(x, y - (n - (N - 1) / 2) * d))),
    );
  return total;
}
export function dipolePressure(
  x: number,
  y: number,
  d: number,
  Q: number,
  f: number,
  rho: number,
  c: number,
) {
  return add(
    monopole(Q, f, rho, c, Math.max(0.002, Math.hypot(x - d / 2, y))),
    scale(monopole(Q, f, rho, c, Math.max(0.002, Math.hypot(x + d / 2, y))), -1),
  );
}
export const pistonHalfAngle = (a: number, f: number, c: number) => {
  const ka = kWave(f, c) * a;
  return ka >= 1.616339948 ? (Math.asin(1.616339948 / ka) * 180) / Math.PI : NaN;
};
export const pistonNullAngle = (a: number, f: number, c: number) => {
  const ka = kWave(f, c) * a;
  return ka >= 3.83170597 ? (Math.asin(3.83170597 / ka) * 180) / Math.PI : NaN;
};
export function receivedPulse(t: number, f: number, a: number, c: number, disk = false) {
  let incident = 0,
    received = 0;
  for (let n = 1; n <= 16; n++) {
    const weight = Math.exp(-0.5 * ((n - 5) / 2) ** 2),
      w = 2 * Math.PI * f * n;
    const gamma = disk ? diskReceive((w * a) / c) : sphereReceive((w * a) / c);
    incident += weight * Math.cos(w * t);
    received += weight * (gamma.re * Math.cos(w * t) - gamma.im * Math.sin(w * t));
  }
  return { incident, received };
}
export const absorption = (re: number, im: number) => (4 * re) / ((re + 1) ** 2 + im * im);
export const thorp = (fHz: number) => {
  const f = fHz / 1000;
  return (0.11 * f * f) / (1 + f * f) + (44 * f * f) / (4100 + f * f) + 2.75e-4 * f * f + 0.003;
};
export const relaxation = (f: number, A: number, tau: number) =>
  (A * (2 * Math.PI * f) ** 2 * tau) / (1 + (2 * Math.PI * f * tau) ** 2);
export function porous(f: number, d: number, sigma: number, rho = 1.21, c = 343) {
  const X = (rho * f) / sigma;
  const Zc = C(1 + 0.0571 * X ** -0.754, -0.087 * X ** -0.732);
  const kd = scale(C(1 + 0.0978 * X ** -0.7, -0.189 * X ** -0.595), ((2 * Math.PI * f) / c) * d);
  const sin = C(Math.sin(kd.re) * Math.cosh(kd.im), Math.cos(kd.re) * Math.sinh(kd.im));
  const cos = C(Math.cos(kd.re) * Math.cosh(kd.im), -Math.sin(kd.re) * Math.sinh(kd.im));
  const z = mul(C(0, -1), mul(Zc, div(cos, sin)));
  return { alpha: absorption(z.re, z.im), z, X };
}
/** Sphere surface-average pressure coefficient; exact for a rigid sphere. */
export const sphereReceive = (ka: number) => div(C(1), C(1, ka));
/** Rayleigh single-face equivalent: 1+normalized piston radiation impedance.
 * Used as an explicitly labelled approximation to the lecture's disk curve. */
export function diskReceive(ka: number) {
  if (ka < 1e-6) return C(1);
  // H_1(z)=2 z²/pi integral_0^1 sqrt(1-t²) sin(z t)/(z t) dt.
  let integral = 0;
  const N = 512;
  for (let i = 0; i < N; i++) {
    const t = (i + 0.5) / N;
    integral += (Math.sqrt(1 - t * t) * Math.sin(2 * ka * t)) / N;
  }
  const H1 = ((4 * ka) / Math.PI) * integral;
  return C(2 - jn(1, 2 * ka) / ka, H1 / ka);
}
