import assert from "node:assert/strict";
import path from "node:path";
import { spawn } from "node:child_process";
if (process.platform !== "win32") {
  console.log("SKIP: Windows native process-tree cleanup");
  process.exit(0);
}
const root = spawn(
  process.execPath,
  [
    "-e",
    `const {spawn}=require('node:child_process');const child=spawn(process.execPath,['-e','setInterval(()=>{},1000)'],{windowsHide:true,stdio:'ignore'});console.log(JSON.stringify({root:process.pid,child:child.pid}));setInterval(()=>{},1000);`,
  ],
  { windowsHide: true, stdio: ["ignore", "pipe", "pipe"] },
);
const pids = await new Promise((resolve, reject) => {
  let text = "";
  root.stdout.on("data", (chunk) => {
    text += chunk;
    if (text.includes("\n")) resolve(JSON.parse(text.split("\n")[0]));
  });
  root.on("error", reject);
});
const alive = (pid) => {
  try {
    process.kill(pid, 0);
    return true;
  } catch {
    return false;
  }
};
try {
  assert.ok(alive(pids.root) && alive(pids.child), "fixture owns a live child process");
  const exit = await new Promise((resolve, reject) => {
    const helper = spawn(
      "python",
      ["-B", path.resolve("scripts/stop-process-tree.py"), String(pids.root)],
      { windowsHide: true, stdio: "ignore" },
    );
    helper.on("error", reject);
    helper.on("close", resolve);
  });
  assert.equal(exit, 0);
  for (let i = 0; i < 40 && (alive(pids.root) || alive(pids.child)); i++)
    await new Promise((r) => setTimeout(r, 50));
  assert.ok(
    !alive(pids.root) && !alive(pids.child),
    "cleanup terminates the launcher and descendant without WMI",
  );
  console.log("PASS: native Windows process-tree cleanup includes descendants");
} finally {
  if (alive(pids.root)) root.kill("SIGKILL");
  if (alive(pids.child)) process.kill(pids.child, "SIGKILL");
}
