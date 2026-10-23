// Partition an already prepared suite between independent runners and reports.
// Run before the first runner reaches the second half of its sorted inventory.
import fs from "node:fs";
import path from "node:path";
const root = path.resolve("outputs/bug-audit-1/final-matlab");
const shard = path.resolve("outputs/bug-audit-1/final-matlab-shard2");
const manifest = JSON.parse(fs.readFileSync(path.join(root, "browser.json"), "utf8"));
const files = manifest.exports.map((e) => path.basename(e.file)).sort();
const selected = new Set(files.slice(Math.ceil(files.length / 2)));
fs.mkdirSync(path.join(shard, "exports"), { recursive: true });
fs.writeFileSync(path.join(root, "complete-prepared.json"), JSON.stringify(manifest, null, 2));
const first = [],
  second = [];
for (const entry of manifest.exports) {
  if (!selected.has(path.basename(entry.file))) {
    first.push(entry);
    continue;
  }
  const source = path.resolve(entry.file);
  const target = path.join(shard, "exports", path.basename(entry.file));
  if (!source.startsWith(root + path.sep) || !target.startsWith(shard + path.sep))
    throw new Error("Partition paths must remain inside the audit output directories");
  fs.renameSync(source, target);
  second.push({ ...entry, file: path.relative(process.cwd(), target) });
}
fs.writeFileSync(
  path.join(root, "browser.json"),
  JSON.stringify({ ...manifest, exports: first }, null, 2),
);
fs.writeFileSync(
  path.join(shard, "browser.json"),
  JSON.stringify({ ...manifest, exports: second }, null, 2),
);
console.log(
  `Partitioned ${first.length} + ${second.length} scripts; each keeps its own process report.`,
);
