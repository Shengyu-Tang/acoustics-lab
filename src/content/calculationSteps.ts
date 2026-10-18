import type { P1Lecture, Values, Ask } from "./p1";
import type { ParameterDefinition } from "../Parameter";
import { toTex } from "../plot/export";

const number = (v: number) =>
  Number(v.toPrecision(4))
    .toString()
    .replace(/e([+-]?\d+)/, "\\times10^{$1}");
const unit = (u: string) =>
  u === "—"
    ? ""
    : `\\,\\mathrm{${u.replaceAll("·", "\\cdot ").replaceAll("²", "^2").replaceAll("³", "^3").replaceAll("⁻¹", "^{-1}")}}`;
const canonical = (s: string) => s.replace(/([_^])\{([A-Za-z0-9]+)\}/g, "$1$2");
/** Display the equation with this parameter set substituted, including units.
 * The numerical answer still comes exclusively from Ask.calc, as does grading.
 */
export function numericSubstitution(a: Ask, p: Values, given: ParameterDefinition[], asks: Ask[]) {
  const values = new Map<string, string>();
  for (const d of given) {
    const value = `\\left(${number(p[d.key])}${unit(d.unit)}\\right)`;
    values.set(canonical(toTex(d.symbol)), value);
    values.set(d.key, value);
  }
  // An earlier sub-question is a calculated intermediate in the design chain.
  for (const q of asks.slice(0, asks.indexOf(a))) {
    const lhs = canonical(q.tex.split("=")[0].trim());
    if (/^[A-Za-z\\][A-Za-z0-9_{}\\]*$/.test(lhs))
      values.set(lhs, `\\left(${number(q.calc(p))}${unit(q.unit)}\\right)`);
  }
  let rhs = canonical(a.tex.slice(a.tex.indexOf("=") + 1));
  const replacements: string[] = [];
  for (const [symbol, value] of [...values].sort((a, b) => b[0].length - a[0].length)) {
    const escaped = symbol.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
    const re = new RegExp(`(?<![A-Za-z\\\\])${escaped}(?![A-Za-z0-9])`, "g");
    rhs = rhs.replace(re, () => {
      replacements.push(value);
      return `@@${replacements.length - 1}@@`;
    });
  }
  rhs = rhs.replace(/@@(\d+)@@/g, (_, i) => replacements[Number(i)]);
  // Keep authored intermediate calculations (roots, quadrature, complex models)
  // alongside the substituted expression rather than silently hiding them.
  return `代入：$${rhs}$。${a.sub(p)}`;
}
export function completeExamples<T extends P1Lecture>(l: T): T {
  return {
    ...l,
    examples: l.examples.map((e) => ({
      ...e,
      asks: e.asks.map((a) => ({
        ...a,
        sub: (p: Values) => numericSubstitution(a, p, e.given, e.asks),
      })),
    })),
  };
}
