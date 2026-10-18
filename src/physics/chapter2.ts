/** Flexible string and slender rod approximations, all inputs in SI units. */
export const stringSpeed = (tension: number, linearDensity: number) =>
  Math.sqrt(tension / linearDensity);
export const stringFrequency = (n: number, c: number, L: number) => (n * c) / (2 * L);
export const pluckCoefficient = (n: number, height: number, fraction: number) =>
  (2 * height * Math.sin(n * Math.PI * fraction)) /
  (Math.PI * Math.PI * n * n * fraction * (1 - fraction));
export function pluckWave(
  x: number,
  t: number,
  c: number,
  L: number,
  height: number,
  fraction: number,
  terms = 12,
  direction = 0,
) {
  let sum = 0;
  for (let n = 1; n <= terms; n++) {
    const k = (n * Math.PI) / L,
      w = c * k,
      b = pluckCoefficient(n, height, fraction);
    sum += direction
      ? (b / 2) * Math.sin(k * x + direction * w * t)
      : b * Math.sin(k * x) * Math.cos(w * t);
  }
  return sum;
}
export const quarterFrequency = (n: number, c: number, L: number) => ((2 * n - 1) * c) / (4 * L);
export function endCompliance(f: number, c: number, L: number, rigidity: number) {
  if (f === 0) return L / rigidity;
  const k = (2 * Math.PI * f) / c;
  return Math.abs(Math.cos(k * L)) < 1e-12 ? Infinity : Math.abs(Math.tan(k * L) / (rigidity * k));
}
export function stringElement(T: number, L: number, height: number) {
  const slopes = [0.4, 0.6].map((x) => ((height * Math.PI) / L) * Math.cos(Math.PI * x));
  const leftY = (-T * slopes[0]) / Math.hypot(1, slopes[0]),
    rightY = (T * slopes[1]) / Math.hypot(1, slopes[1]);
  return { slopes, leftY, rightY, netY: leftY + rightY };
}
