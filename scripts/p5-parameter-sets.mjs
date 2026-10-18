export function secondSet(e) {
  const p = { ...e.defaults };
  for (const d of e.given) {
    const candidate = p[d.key] === d.max ? p[d.key] * 0.87 : p[d.key] * 1.13;
    p[d.key] = Math.min(
      d.max,
      Math.max(d.min, d.min + Math.round((candidate - d.min) / d.step) * d.step),
    );
  }
  return p;
}
