import fs from "node:fs";
import path from "node:path";
import { spawn, spawnSync } from "node:child_process";
import { models } from "./p4-models.mjs";
const { lectures, matlab } = await models(),
  folder = "specs/redesign/matlab-check/P4";
fs.mkdirSync(folder, { recursive: true });
const l = lectures.find((l) => l.id === "4.1"),
  f = l.figures[1],
  file = path.resolve(folder + "/fig_4_1_2_set0.m");
fs.writeFileSync(file, matlab(f.plot(l.defaults, 0), 1, 1, f.title));
const work = path.resolve("outputs/P4/matlab");
for (const d of [work, work + "/tmp", work + "/prefs"]) fs.mkdirSync(d, { recursive: true });
const env = {
    ...process.env,
    TEMP: work + "/tmp",
    TMP: work + "/tmp",
    MATLAB_PREFDIR: work + "/prefs",
  },
  quote = (s) => s.replaceAll("\\", "/").replaceAll("'", "''"),
  script = work + "/runtime_probe.m";
fs.writeFileSync(
  script,
  "fid=fopen('" +
    quote(work + "/entered.txt") +
    "','w');fprintf(fid,'entered batch');fclose(fid);\nrun('" +
    quote(file) +
    "');\nexportgraphics(gcf,'" +
    quote(path.resolve(folder + "/fig_4_1_2_set0.png")) +
    "');\n",
);
const start = Date.now(),
  log = fs.openSync(work + "/startup.log", "w");
const p = spawn(
  "C:/Program Files/MATLAB/R2024b/bin/matlab.exe",
  ["-sd", work, "-logfile", work + "/matlab.log", "-batch", "run('" + quote(script) + "')"],
  { cwd: work, env, windowsHide: true, stdio: ["ignore", log, log] },
);
console.log("One MATLAB R2024b attempt; 300 s timeout; PID " + p.pid);
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
      "MATLAB " +
        Math.round((Date.now() - start) / 1000) +
        " s; entered batch: " +
        fs.existsSync(work + "/entered.txt"),
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
fs.writeFileSync(folder + "/runtime-attempt.json", JSON.stringify(report, null, 2) + "\n");
console.log(report);
