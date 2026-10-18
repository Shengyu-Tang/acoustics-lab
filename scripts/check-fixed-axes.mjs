import fs from "node:fs";
import { lectures } from "./check-parameter-sensitivity.mjs";
const failures = [];
for (const l of lectures)
  for (const f of l.figures) {
    const axes = (panels) => panels.map((p) => [p.xlim, p.ylim, p.rightLim, p.field?.limits]);
    const baseline = JSON.stringify(axes(f.plot(l.defaults, 0)));
    for (const d of l.parameters)
      for (const v of [d.min, d.max])
        for (const t of [0, (l.animationPeriod?.(l.defaults) ?? 1) / 7]) {
          const next = JSON.stringify(axes(f.plot({ ...l.defaults, [d.key]: v }, t)));
          if (next !== baseline)
            failures.push(`${l.id} -- ${d.key}=${v} -- ${f.number}: axes changed`);
        }
  }
fs.writeFileSync("outputs/fixed-axes.json", JSON.stringify({ failures }, null, 2));
if (failures.length) {
  console.error(`FAIL: ${failures.length} axis changes\n${failures.join("\n")}`);
  process.exitCode = 1;
} else console.log("PASS: fixed x/y/right/colour axes for every parameter and animation snapshot");
