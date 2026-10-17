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
