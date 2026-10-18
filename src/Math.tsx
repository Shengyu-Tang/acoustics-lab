import katex from "katex";
import "katex/dist/katex.min.css";
export default function MathText({ tex }: { tex: string }) {
  return (
    <div
      className="math-text"
      dangerouslySetInnerHTML={{
        __html: katex.renderToString(tex, { displayMode: true, throwOnError: true, trust: false }),
      }}
    />
  );
}

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
      part
    ),
  );
}
