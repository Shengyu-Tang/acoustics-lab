import katex from "katex";
import ScriptText from "./ScriptText";

/** Prose uses $...$ for inline mathematics; display equations stay separate. */
export function MathProse({ text }: { text: string }) {
  return text.split(/(\$[^$]+\$)/g).map((part, i) =>
    part.startsWith("$") && part.endsWith("$") ? (
      <span
        key={i}
        dangerouslySetInnerHTML={{
          __html: katex.renderToString(part.slice(1, -1), {
            displayMode: false,
            throwOnError: true,
            trust: false,
          }),
        }}
      />
    ) : (
      <ScriptText key={i} text={part} />
    ),
  );
}
