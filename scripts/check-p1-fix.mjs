// Serial Windows acceptance; capture native stderr in logs without treating
// successful-build warnings as PowerShell terminating errors.
import fs from "node:fs";
import path from "node:path";
import { spawn } from "node:child_process";
const root = process.cwd(),
  tmp = path.join(root, "outputs/final-tmp");
fs.mkdirSync(tmp, { recursive: true });
const env = {
  ...process.env,
  TEMP: tmp,
  TMP: tmp,
  npm_config_cache: path.join(root, ".npm-cache"),
};
const checks = [
  ["npm-ci", "npm ci"],
  ["tests", "npm test"],
  ["animations", "node scripts/check-animations.mjs"],
  ["build", "npm run build"],
  ["browser", "node scripts/check-browser.mjs"],
  ["capture", "node scripts/capture-p1-fix.mjs"],
  ["format-check", "npm run format:check"],
  ["whitespace", "git diff --check"],
];
const results = [];
for (const [name, command] of checks) {
  const log = path.join(root, `outputs/final-${name}.log`),
    fd = fs.openSync(log, "w"),
    start = Date.now();
  const exit = await new Promise((resolve, reject) => {
    const child = spawn("cmd.exe", ["/d", "/c", command], {
      cwd: root,
      env,
      windowsHide: true,
      stdio: ["ignore", fd, fd],
    });
    child.on("error", reject);
    child.on("close", resolve);
  });
  fs.closeSync(fd);
  results.push({
    command,
    exit,
    seconds: (Date.now() - start) / 1000,
    log: path.relative(root, log),
  });
  fs.writeFileSync("outputs/final-acceptance.json", JSON.stringify(results, null, 2) + "\n");
  if (exit !== 0) throw new Error(`${command} failed (${exit}); see ${log}`);
  console.log(`PASS ${command}`);
}
console.log("Final serial acceptance passed.");
