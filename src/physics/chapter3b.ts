/** Lossless fluid acoustics, with the exp(j omega t) convention. */
export type Complex = { re: number; im: number };
export const complex = (re: number, im = 0): Complex => ({ re, im });
export const add = (a: Complex, b: Complex) => complex(a.re + b.re, a.im + b.im);
export const mul = (a: Complex, b: Complex) =>
  complex(a.re * b.re - a.im * b.im, a.re * b.im + a.im * b.re);
export const scale = (a: Complex, s: number) => complex(a.re * s, a.im * s);
export const divide = (a: Complex, b: Complex) => {
  const d = b.re * b.re + b.im * b.im;
  return complex((a.re * b.re + a.im * b.im) / d, (a.im * b.re - a.re * b.im) / d);
};
export const magnitude = (a: Complex) => Math.hypot(a.re, a.im);
export const phase = (a: Complex) => Math.atan2(a.im, a.re);
export const harmonic = (a: Complex, phi: number) => a.re * Math.cos(phi) - a.im * Math.sin(phi);
export const polar = (r: number, phi: number) => complex(r * Math.cos(phi), r * Math.sin(phi));
export function normalInterface(Z1: number, Z2: number) {
  const R = (Z2 - Z1) / (Z2 + Z1),
    D = (2 * Z2) / (Z2 + Z1),
    r = R * R,
    t = (4 * Z1 * Z2) / (Z1 + Z2) ** 2;
  return { R, D, Ru: -R, Du: (2 * Z1) / (Z1 + Z2), r, t, TL: -10 * Math.log10(t) };
}
export function oblique(Z1: number, Z2: number, c1: number, c2: number, degrees: number) {
  const angle = (Math.min(degrees, 89.999999) * Math.PI) / 180,
    ci = Math.cos(angle),
    st = (c2 / c1) * Math.sin(angle);
  const ct =
    st <= 1 ? complex(Math.sqrt(Math.max(0, 1 - st * st))) : complex(0, -Math.sqrt(st * st - 1));
  const R = divide(add(complex(Z2 * ci), scale(ct, -Z1)), add(complex(Z2 * ci), scale(ct, Z1)));
  const D = add(complex(1), R),
    r = magnitude(R) ** 2,
    tI = (Z1 / Z2) * magnitude(D) ** 2;
  return {
    R,
    D,
    ci,
    st,
    ct,
    r,
    tI,
    t: (tI * ct.re) / ci,
    theta: st <= 1 ? (Math.asin(st) * 180) / Math.PI : NaN,
    evanescent: st > 1,
  };
}
export function interfaceAngles(Z1: number, Z2: number, c1: number, c2: number) {
  const q = c2 / c1,
    den = Z1 * Z1 * q * q - Z2 * Z2;
  const s2 = (Z1 * Z1 - Z2 * Z2) / den;
  return {
    critical: q > 1 ? (Math.asin(1 / q) * 180) / Math.PI : NaN,
    brewster:
      s2 >= 0 && s2 < 1 && s2 * q * q < 1 ? (Math.asin(Math.sqrt(s2)) * 180) / Math.PI : NaN,
  };
}
export function refractionAngle(c1: number, c2: number, theta: number) {
  const s = (c2 / c1) * Math.sin((theta * Math.PI) / 180);
  return s <= 1 ? (Math.asin(s) * 180) / Math.PI : NaN;
}
export function surfaceReflection(resistance: number, reactance: number) {
  const R = divide(complex(resistance - 1, reactance), complex(resistance + 1, reactance)),
    r = magnitude(R);
  return { R, r, G: (1 + r) / Math.max(1e-15, 1 - r), alpha: 1 - r * r, phi: phase(R) };
}
/** d is positive distance from a surface into the incident medium. */
export function standingPressure(d: number, k: number, R: Complex) {
  return add(polar(1, k * d), mul(R, polar(1, -k * d)));
}
export function standingVelocity(d: number, k: number, R: Complex) {
  return add(polar(1, k * d), scale(mul(R, polar(1, -k * d)), -1));
}
export function sphericalImpedance(kr: number) {
  return complex((kr * kr) / (1 + kr * kr), kr / (1 + kr * kr));
}
export function sphericalState(r: number, t: number, A: number, f: number, rho: number, c: number) {
  const w = 2 * Math.PI * f,
    k = w / c,
    psi = w * t - k * r;
  const p = (A / r) * Math.cos(psi),
    u = (A / (rho * c * r)) * (Math.cos(psi) + Math.sin(psi) / (k * r));
  return {
    p,
    u,
    flux: p * u,
    intensity: (A * A) / (2 * rho * c * r * r),
    cu: c * (1 + 1 / (k * r) ** 2),
  };
}
/** Integer Bessel functions: convergent series in the near field, asymptotic series outside. */
const besselCache = new Map<number, { J0: number; Y0: number; J1: number; Y1: number }>();
export function cylindricalBessel(x: number) {
  const cached = besselCache.get(x);
  if (cached) return cached;
  const result = computeCylindricalBessel(x);
  if (besselCache.size > 100000) besselCache.clear();
  besselCache.set(x, result);
  return result;
}
function computeCylindricalBessel(x: number) {
  if (x >= 12) {
    const one = (n: number) => {
      const mu = 4 * n * n;
      let term = 1,
        P = 1,
        Q = 0,
        previous = Infinity;
      for (let m = 1; m < 80; m++) {
        term *= (mu - (2 * m - 1) ** 2) / (m * 8 * x);
        if (Math.abs(term) > previous) break;
        previous = Math.abs(term);
        if (m % 2) Q += (m % 4 === 1 ? 1 : -1) * term;
        else P += (m % 4 === 0 ? 1 : -1) * term;
        if (Math.abs(term) < 1e-17) break;
      }
      const z = x - (n * Math.PI) / 2 - Math.PI / 4,
        a = Math.sqrt(2 / (Math.PI * x));
      return [a * (P * Math.cos(z) - Q * Math.sin(z)), a * (P * Math.sin(z) + Q * Math.cos(z))];
    };
    const [J0, Y0] = one(0),
      [J1, Y1] = one(1);
    return { J0, Y0, J1, Y1 };
  }
  let term = 1,
    J0 = 1,
    J1 = 0,
    H = 0,
    S = 0,
    Sp = 0;
  for (let m = 1; m < 100; m++) {
    term *= (-x * x) / (4 * m * m);
    J0 += term;
    J1 += (-2 * m * term) / x;
    H += 1 / m;
    S += -H * term;
    Sp += (-H * term * 2 * m) / x;
    if (Math.abs(term) < 1e-18) break;
  }
  const L = Math.log(x / 2) + 0.5772156649015329;
  const Y0 = (2 / Math.PI) * (L * J0 + S),
    Y1 = (2 / Math.PI) * (-J0 / x + L * J1 - Sp);
  return { J0, Y0, J1, Y1 };
}
export function cylindricalImpedance(kr: number) {
  const b = cylindricalBessel(kr);
  return mul(complex(0, 1), divide(complex(b.J0, -b.Y0), complex(b.J1, -b.Y1)));
}
export function cylindricalState(kr: number, tau: number) {
  const b = cylindricalBessel(kr);
  // p=H0^(2), u=-j H1^(2), normalized by rho*c.
  const p = harmonic(complex(b.J0, -b.Y0), tau),
    u = harmonic(complex(-b.Y1, -b.J1), tau);
  return { p, u, flux: p * u, intensity: 1 / (Math.PI * kr) };
}
export function guideMode(n: number, f: number, h: number, c: number) {
  const fc = (n * c) / (2 * h),
    k = (2 * Math.PI * f) / c,
    kx = (n * Math.PI) / h,
    propagating = f > fc;
  const kz = Math.sqrt(Math.max(0, k * k - kx * kx)),
    decay = Math.sqrt(Math.max(0, kx * kx - k * k));
  return {
    fc,
    k,
    kx,
    kz,
    decay,
    propagating,
    cp: propagating ? (c * k) / kz : NaN,
    cg: propagating ? (c * kz) / k : 0,
    theta: propagating ? (Math.asin(kx / k) * 180) / Math.PI : NaN,
  };
}
export function guideCoefficients(
  source: number,
  offset: number,
  width: number,
  a1: number,
  a2: number,
  a3: number,
) {
  if (source === 0) return [1, 0, 0, 0, 0, 0];
  if (source === 2) return [1, a1, a2, a3, 0, 0];
  return Array.from({ length: 6 }, (_, n) => {
    let sum = 0;
    const N = 400;
    for (let i = 0; i <= N; i++) {
      const x = i / N;
      sum +=
        (i === 0 || i === N ? 0.5 : 1) *
        Math.exp(-(((x - offset) / width) ** 2)) *
        Math.cos(n * Math.PI * x);
    }
    return (sum / N) * (n === 0 ? 1 : 2);
  });
}
export function whisperRays(radius: number, source: number, angle: number, segments = 16) {
  let x = radius * source,
    y = 0,
    dx = Math.cos((angle * Math.PI) / 180),
    dy = Math.sin((angle * Math.PI) / 180);
  const pts: [number, number][] = [[x, y]];
  for (let i = 0; i < segments; i++) {
    const dot = x * dx + y * dy,
      L = -dot + Math.sqrt(Math.max(0, dot * dot + radius * radius - x * x - y * y));
    x += L * dx;
    y += L * dy;
    const hitNorm = Math.hypot(x, y);
    x *= radius / hitNorm;
    y *= radius / hitNorm;
    pts.push([x, y]);
    const d = (dx * x) / radius + (dy * y) / radius;
    dx -= (2 * d * x) / radius;
    dy -= (2 * d * y) / radius;
    const directionNorm = Math.hypot(dx, dy);
    dx /= directionNorm;
    dy /= directionNorm;
  }
  return pts;
}
