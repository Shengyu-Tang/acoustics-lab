import fs from "node:fs";
import assert from "node:assert/strict";
import { createRequire } from "node:module";
import { build } from "esbuild";

fs.mkdirSync("outputs", { recursive: true });
await build({
  stdin: {
    contents: [
      ...["Home", "Calendar", "CourseTree", "Projects"].map(
        (name) => `export {default as ${name}} from './src/${name}';`,
      ),
      "export {createElement} from 'react';",
      "export {renderToStaticMarkup} from 'react-dom/server';",
    ].join("\n"),
    resolveDir: process.cwd(),
  },
  bundle: true,
  platform: "node",
  format: "cjs",
  jsx: "automatic",
  loader: { ".css": "empty" },
  define: { "import.meta.env.BASE_URL": '"./"' },
  outfile: "outputs/number-titles-check.cjs",
});
const { createElement, renderToStaticMarkup, ...pages } = createRequire(import.meta.url)(
  "../outputs/number-titles-check.cjs",
);
globalThis.location = { hash: "#/cases?project=ocean" };
try {
  for (const [name, Page] of Object.entries(pages)) {
    const html = renderToStaticMarkup(createElement(Page));
    let checked = 0;
    // Inspect actual rendered text, including adjacent JSX expressions and SVG labels.
    for (const [, , inner] of html.matchAll(/<(summary|h[1-6]|a|text)\b[^>]*>([\s\S]*?)<\/\1>/g)) {
      const text = inner.replace(/<[^>]+>/g, "").trim();
      const numbered = text.match(/^\d+(?:\.\d+)+(.*)$/s);
      if (!numbered || !numbered[1]) continue; // A bare lecture ID has no title.
      assert.match(numbered[1], /^\s/, `${name}: missing space in "${text}"`);
      checked++;
    }
    assert.ok(checked > 0, `${name}: rendered number-title labels were checked`);
    if (name === "Home") {
      assert.equal((html.match(/<summary>3\.\d+ /g) ?? []).length, 10);
      assert.doesNotMatch(html, /慕课/);
      assert.match(html, /课程讲次索引/);
    }
  }
} finally {
  delete globalThis.location;
}
console.log(
  "PASS: rendered home groups, course tree, calendar and case lecture links separate numbers from titles.",
);
