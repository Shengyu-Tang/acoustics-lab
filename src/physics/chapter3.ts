/** Ideal, homogeneous fluid; real fields use exp(j omega t). Pressures are
 * peak amplitudes unless the function name explicitly says rms. */
export const AIR = { rho: 1.21, c: 343, reference: 20e-6 };
export const WATER = { rho: 1000, c: 1500, reference: 1e-6 };
export function planeQuantities(pa: number, f: number, rho: number, c: number) {
  const Z = rho * c,
    ua = pa / Z;
  return {
    Z,
    ua,
    displacement: ua / (2 * Math.PI * f),
    density: pa / c ** 2,
    compression: pa / (rho * c ** 2),
    intensity: pa ** 2 / (2 * Z),
    energy: pa ** 2 / (2 * rho * c ** 2),
    wavelength: c / f,
  };
}
export function gasSpeed(T: number, gamma = 1.4, P0 = 101325) {
  const rho = P0 / (287.05 * (T + 273.15));
  return { rho, adiabatic: Math.sqrt((gamma * P0) / rho), isothermal: Math.sqrt(P0 / rho) };
}
export const liquidSpeed = (bulk: number, rho: number) => Math.sqrt(bulk / rho);
export const densityRate = (rho: number, left: number, right: number, length: number) =>
  (rho * (left - right)) / length;
export const acousticEnergy = (p: number, u: number, rho: number, c: number) => ({
  kinetic: (rho * u * u) / 2,
  potential: (p * p) / (2 * rho * c * c),
});
export const meanIntensity = (pa: number, ua: number, phase: number) =>
  (pa * ua * Math.cos(phase)) / 2;
export const pressureLevel = (rms: number, reference = 20e-6) => 20 * Math.log10(rms / reference);
export const pressureFromLevel = (level: number, reference = 20e-6) =>
  reference * 10 ** (level / 20);
export const powerLevel = (value: number, reference = 1e-12) => 10 * Math.log10(value / reference);
export const powerFromLevel = (level: number, reference = 1e-12) => reference * 10 ** (level / 10);
export const sumLevels = (levels: number[]) => {
  const max = Math.max(...levels);
  return max + 10 * Math.log10(levels.reduce((sum, L) => sum + 10 ** ((L - max) / 10), 0));
};
export function waveVector(k: number, azimuth: number, elevation: number) {
  const a = (azimuth * Math.PI) / 180,
    e = (elevation * Math.PI) / 180;
  return [k * Math.cos(e) * Math.cos(a), k * Math.cos(e) * Math.sin(a), k * Math.sin(e)];
}
export function helmholtzY(k: number, kx: number) {
  return {
    real: Math.sqrt(Math.max(0, k * k - kx * kx)),
    decay: Math.sqrt(Math.max(0, kx * kx - k * k)),
  };
}
export function helmholtzField(x: number, y: number, k: number, ratio: number, phase = 0) {
  const ky = helmholtzY(k, ratio * k);
  // ky=-j alpha gives decay for the exp(-j ky y) convention.
  return Math.exp(-ky.decay * y) * Math.cos(phase - ratio * k * x - ky.real * y);
}
export function potential(
  r: number,
  t: number,
  pa: number,
  f: number,
  rho: number,
  c: number,
  spherical = false,
) {
  const w = 2 * Math.PI * f,
    k = w / c,
    phase = w * t - k * r;
  const a = pa / (rho * w),
    scale = spherical ? 1 / r : 1;
  return {
    phi: a * scale * Math.sin(phase),
    p: pa * scale * Math.cos(phase),
    u: a * scale * (k * Math.cos(phase) + (spherical ? Math.sin(phase) / r : 0)),
  };
}
export function pulse(
  s: number,
  shape: number,
  custom: number[] = [0, 0.3, 1, 0.2, -0.5, 0, 0, 0, 0],
) {
  if (shape === 0) return Math.exp(-(((s - 0.6) / 0.12) ** 2));
  if (shape === 1) return Math.max(0, 1 - Math.abs((s - 0.6) / 0.2));
  const q = Math.max(0, Math.min(8, s * 4)),
    i = Math.min(7, Math.floor(q));
  return s < 0 || s > 2 ? 0 : custom[i] * (1 - q + i) + custom[i + 1] * (q - i);
}
