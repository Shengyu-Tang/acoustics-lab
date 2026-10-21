import katex from "katex";
import "katex/dist/katex-swap.min.css";
export { MathProse } from "./MathProse";
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
