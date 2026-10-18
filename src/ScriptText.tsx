/** Keep plot/export source strings intact; use real script layout in the browser. */
const lower = "₀₁₂₃₄₅₆₇₈₉₊₋₌₍₎ₐₑₒₓₔₕₖₗₘₙₚₛₜ";
const lowerPlain = "0123456789+-=()aeoxəhklmnpst";
const upper = "⁰¹²³⁴⁵⁶⁷⁸⁹⁺⁻⁼⁽⁾ⁿⁱ";
const upperPlain = "0123456789+-=()ni";
export function scriptParts(text: string) {
  return text
    .replaceAll("⁻π", "^{-π}")
    .split(/([\u2080-\u209c]+|[⁰¹²³⁴⁵⁶⁷⁸⁹⁺⁻⁼⁽⁾ⁿⁱ]+|[_^](?:\{[^}]+\}|[A-Za-z0-9]+))/g)
    .map((part) => {
      const sub = /^[\u2080-\u209c]/.test(part) || part.startsWith("_");
      const sup = upper.includes(part[0]) || part.startsWith("^");
      const value = /^[\u2080-\u209c]/.test(part)
        ? [...part].map((c) => lowerPlain[lower.indexOf(c)] ?? c).join("")
        : upper.includes(part[0])
          ? [...part].map((c) => upperPlain[upper.indexOf(c)] ?? c).join("")
          : sub || sup
            ? part.slice(1).replace(/^\{|\}$/g, "")
            : part;
      return { value, shift: sub ? "sub" : sup ? "super" : null };
    });
}
export default function ScriptText({ text, svg = false }: { text: string; svg?: boolean }) {
  return scriptParts(text).map(({ value, shift }, i) =>
    !shift ? (
      value
    ) : svg ? (
      <tspan key={i} baselineShift={shift} fontSize="75%">
        {value}
      </tspan>
    ) : shift === "sub" ? (
      <sub key={i}>{value}</sub>
    ) : (
      <sup key={i}>{value}</sup>
    ),
  );
}
