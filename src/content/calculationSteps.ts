import type { P1Lecture, Values, Ask } from "./p1";
import type { ParameterDefinition } from "../Parameter";
import { toTex } from "../plot/export";
import { sphere, porous } from "../physics/chapter4";

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
  const add = (symbol: string, n: number, u = "—") => {
    if (Number.isFinite(n)) values.set(symbol, `\\left(${number(n)}${unit(u)}\\right)`);
  };
  // Fixed medium properties and derived intermediates are part of substitution
  // even when they do not have an editable input in this particular worksheet.
  for (const [key, v] of Object.entries(p)) add(key, v, given.find((d) => d.key === key)?.unit);
  for (const symbol of ["c_0", "c_1"]) add(symbol, p.c, "m/s");
  add("c_2", p.c2, "m/s");
  add("\\rho_0", p.rho, "kg/m³");
  for (const symbol of ["p_a", "p_i", "p_0"]) add(symbol, p.pa, "Pa");
  add("\\omega", 2 * Math.PI * p.f, "rad/s");
  add("k", (2 * Math.PI * p.f) / p.c, "rad/m");
  add("k_1", (2 * Math.PI * p.f) / p.c, "rad/m");
  add("k_2", (2 * Math.PI * p.f) / p.c2, "rad/m");
  add("\\lambda", p.c / p.f, "m");
  add("n", p.mode);
  add("v_0", p.v ?? p.v0, "m/s");
  if (p.obs !== undefined) add("r", p.obs, "m");
  if (p.mode !== undefined && p.h) add("f_n", (p.mode * p.c) / (2 * p.h), "Hz");
  if (p.a && p.v !== undefined) {
    const s = sphere(p.a, p.f, p.rho, p.c, p.v, p.r ?? 1);
    add("R_s", s.z.re, "kg/s");
    add("X_s", s.z.im, "kg/s");
    add("S", 4 * Math.PI * p.a * p.a, "m²");
  }
  if (p.res !== undefined) values.set("z_n", `(${number(p.res)}+j(${number(p.react)}))`);
  if (p.d && p.sigma) {
    const z = porous(p.f, p.d, p.sigma, p.rho, p.c).z;
    values.set(
      "Z_n",
      `[(${number(z.re)}+j(${number(z.im)}))\\times${number(p.rho * p.c)}\\,\\mathrm{Pa\\cdot s/m}]`,
    );
  }
  if (p.xB !== undefined) {
    add("x_A", 0, "m");
    add("y_A", 0, "m");
  }
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
    const re = new RegExp(`(?<![A-Za-z_\\\\])${escaped}(?![a-z0-9])`, "g");
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
      background: `${e.background.length < 120 ? l.engineering.text : ""}${e.background}以下计算采用已知条件表的当前数值。`,
      asks: e.asks.map((a) => ({
        ...a,
        sub: (p: Values) => numericSubstitution(a, p, e.given, e.asks),
      })),
    })),
  };
}
