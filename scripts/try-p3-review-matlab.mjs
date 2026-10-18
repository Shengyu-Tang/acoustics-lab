import fs from "node:fs";
import path from "node:path";
import { spawn, spawnSync } from "node:child_process";
const work = path.resolve("outputs/P3-1/matlab");
for (const d of [work, work + "/tmp", work + "/prefs"]) fs.mkdirSync(d, { recursive: true });
const env = {
  ...process.env,
  TEMP: work + "/tmp",
  TMP: work + "/tmp",
  MATLAB_PREFDIR: work + "/prefs",
};
const quote = (s) => s.replaceAll("'", "''").replaceAll("\\", "/");
const script = work + "/runtime_probe.m";
fs.writeFileSync(
  script,
  `fid=fopen('${quote(work + "/entered.txt")}','w');fprintf(fid,'entered batch');fclose(fid);\nrun('${quote(path.resolve("specs/redesign/matlab-check/P3/fig_3_6_6_2_set0.m"))}');\nexportgraphics(gcf,'${quote(work + "/standing-energy.png")}');\nrun('${quote(path.resolve("specs/redesign/matlab-check/P3/fig_3_6_11_E1_set0.m"))}');\nexportgraphics(gcf,'${quote(work + "/circular-example.png")}');\n`,
);
const start = Date.now(),
  log = fs.openSync(work + "/startup.log", "w");
const p = spawn(
  "C:/Program Files/MATLAB/R2024b/bin/matlab.exe",
  ["-sd", work, "-logfile", work + "/matlab.log", "-batch", `run('${quote(script)}')`],
  { cwd: work, env, windowsHide: true, stdio: ["ignore", log, log] },
);
console.log(`One MATLAB startup attempt (PID ${p.pid}), timeout 300 seconds.`);
let timedOut = false;
const timer = setTimeout(() => {
  timedOut = true;
  spawnSync(
    "powershell.exe",
    [
      "-NoProfile",
      "-File",
      path.resolve("scripts/stop-process-tree.ps1"),
      "-RootPid",
      String(p.pid),
    ],
    { env, windowsHide: true, timeout: 30000 },
  );
  p.kill();
}, 300000);
const interval = setInterval(
  () =>
    console.log(
      `MATLAB elapsed ${Math.round((Date.now() - start) / 1000)} s; batch entered: ${fs.existsSync(work + "/entered.txt")}`,
    ),
  30000,
);
const exit = await new Promise((resolve, reject) => {
  p.on("error", reject);
  p.on("exit", (code, signal) => resolve({ code, signal }));
});
clearTimeout(timer);
clearInterval(interval);
fs.closeSync(log);
const report = {
  attempts: 1,
  timeoutSeconds: 300,
  elapsedSeconds: (Date.now() - start) / 1000,
  timedOut,
  entered: fs.existsSync(work + "/entered.txt"),
  exit,
  runtimeValidated: !timedOut && exit.code === 0,
};
fs.writeFileSync(
  "specs/redesign/matlab-check/P3-1/runtime-attempt.json",
  JSON.stringify(report, null, 2) + "\n",
);
console.log(JSON.stringify(report));
