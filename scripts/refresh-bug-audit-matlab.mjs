// Regenerate existing manifest entries after an exporter/model fix, retaining
// each downloaded parameter set, filename and original figure title.
import fs from "node:fs";
import path from "node:path";
import crypto from "node:crypto";
import { auditData } from "./bug-audit-data.mjs";
import { webExpectation } from "./matlab-audit-compare.mjs";
const data = await auditData();
for (const batch of ["", "round2-matlab", "final-matlab", "final-matlab-shard2"]) {
  const root = path.resolve("outputs/bug-audit-1", batch);
  const file = path.join(root, "browser.json");
  const manifest = JSON.parse(fs.readFileSync(file, "utf8"));
  const changed = [];
  for (const entry of manifest.exports.filter((e) => e.kind === "m")) {
    const topic = new URLSearchParams(entry.route.split("?")[1]).get("topic");
    const lecture = data.lectures.find((l) => l.id === topic);
    const old = fs.readFileSync(entry.file, "utf8");
    if (entry.category === "figure" && !lecture) {
      if (topic !== "3.S2") continue; // unchanged historical numeric snapshots
      const center = Number(old.match(/^x=\[([^\s\]]+)/m)?.[1]);
      if (!Number.isFinite(center)) throw new Error("Missing Doppler source position");
      entry.parameters = { ...data.legacyDefaults(data.legacyModels.doppler), v: center / -0.015 };
    }
    const { panels } = webExpectation(data, entry, old);
    const figure = entry.category === "figure" ? lecture?.figures[entry.figure] : undefined;
    const title = old.split(/\r?\n/)[0].slice(2);
    const code = data.matlab(panels, figure?.rows ?? panels.length, figure?.cols ?? 1, title);
    if (code !== old) {
      fs.writeFileSync(entry.file, code);
      entry.sha256 = crypto.createHash("sha256").update(code).digest("hex");
      entry.bytes = Buffer.byteLength(code);
      changed.push(path.basename(entry.file));
    }
  }
  fs.writeFileSync(file + ".new", JSON.stringify(manifest, null, 2));
  fs.renameSync(file + ".new", file);
  console.log(batch || "round1", "updated", changed.length, changed);
}
