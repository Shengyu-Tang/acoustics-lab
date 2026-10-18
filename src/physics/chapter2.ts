/** Flexible string and slender rod approximations, all inputs in SI units. */
export const stringSpeed = (tension: number, linearDensity: number) =>
  Math.sqrt(tension / linearDensity);
export const stringFrequency = (n: number, c: number, L: number) => (n * c) / (2 * L);
export function stringElement(T: number, L: number, height: number) {
  const slopes = [0.4, 0.6].map((x) => ((height * Math.PI) / L) * Math.cos(Math.PI * x));
  const leftY = (-T * slopes[0]) / Math.hypot(1, slopes[0]),
    rightY = (T * slopes[1]) / Math.hypot(1, slopes[1]);
  return { slopes, leftY, rightY, netY: leftY + rightY };
}
