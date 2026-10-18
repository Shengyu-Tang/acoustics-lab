import { porous } from "./chapter4";
export const thorpDbKm = (hz: number) => {
  const f2 = (hz / 1000) ** 2;
  return (0.11 * f2) / (1 + f2) + (44 * f2) / (4100 + f2) + 2.75e-4 * f2 + 0.003;
};
export const beamWidth = (a: number, f: number, c: number) =>
  (360 / Math.PI) * Math.asin(Math.min(1, (1.61633 * c) / (2 * Math.PI * f * a)));
export const transmission = (z1: number, z2: number) => (4 * z1 * z2) / (z1 + z2) ** 2;
export const spreadingLoss = (r: number, hz: number) =>
  20 * Math.log10(r) + (thorpDbKm(hz) * r) / 1000;
export const mountAmplitude = (p: Record<string, number>, f: number, R = p.Rm) =>
  p.F0 / Math.hypot(p.D - p.M * (2 * Math.PI * f) ** 2, R * 2 * Math.PI * f);
export const forceTransmission = (p: Record<string, number>, f: number, R = p.Rm) =>
  Math.hypot(p.D, R * 2 * Math.PI * f) /
  Math.hypot(p.D - p.M * (2 * Math.PI * f) ** 2, R * 2 * Math.PI * f);
export const bandAbsorption = (d: number, sigma: number, rho: number, c: number) =>
  Math.min(...Array.from({ length: 151 }, (_, i) => porous(500 + 10 * i, d, sigma, rho, c).alpha));
export function absorberThickness(
  sigma: number,
  rho: number,
  c: number,
  minimum: number,
  maximum: number,
) {
  for (let mm = 20; mm <= Math.floor(maximum * 1000 + 1e-9); mm++) {
    if (bandAbsorption(mm / 1000, sigma, rho, c) > minimum) return mm / 1000;
  }
  return 0;
}
