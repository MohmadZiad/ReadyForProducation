import { spawn } from "node:child_process";

const isWindows = process.platform === "win32";
const npmCmd = isWindows ? "npm.cmd" : "npm";
const children = [];

function start(script, label) {
  const child = spawn(npmCmd, ["run", "--silent", script], {
    stdio: ["ignore", "pipe", "pipe"],
    env: process.env,
    shell: isWindows,
  });

  child.stdout.on("data", (data) => {
    process.stdout.write(`[${label}] ${data}`);
  });

  child.stderr.on("data", (data) => {
    process.stderr.write(`[${label}] ${data}`);
  });

  child.on("exit", (code, signal) => {
    if (signal === "SIGTERM" || signal === "SIGINT") {
      return;
    }

    if (code !== 0) {
      console.error(`[${label}] exited with code ${code ?? 0}`);
      shutdown(code ?? 1);
    }
  });

  children.push(child);
}

function shutdown(code = 0) {
  for (const child of children) {
    if (!child.killed) {
      child.kill("SIGTERM");
    }
  }
  process.exit(code);
}

process.on("SIGINT", () => shutdown(0));
process.on("SIGTERM", () => shutdown(0));

start("dev:client", "client");
start("dev:server", "server");
