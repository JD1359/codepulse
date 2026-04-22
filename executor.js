/**
 * services/executor.js — Docker Sandboxed Code Execution Engine
 *
 * Passes code via stdin to avoid volume mount issues on Windows Docker-over-TCP.
 */

const { spawn } = require("child_process");
const { v4: uuidv4 } = require("uuid");

const TIMEOUT_MS   = parseInt(process.env.EXEC_TIMEOUT_MS) || 10000;
const MEMORY_LIMIT = process.env.EXEC_MEMORY_LIMIT         || "50m";
const CPU_LIMIT    = process.env.EXEC_CPU_LIMIT            || "0.5";

const LANGUAGE_CONFIG = {
  python: {
    image:     "python:3.11-alpine",
    filename:  "code.py",
    run:       "python /sandbox/code.py",
  },
  javascript: {
    image:     "node:20-alpine",
    filename:  "code.js",
    run:       "node /sandbox/code.js",
  },
  java: {
    image:     "openjdk:17-alpine",
    filename:  "Main.java",
    run:       "cd /sandbox && javac Main.java && java Main",
  },
  cpp: {
    image:     "gcc:13-bookworm",
    filename:  "code.cpp",
    run:       "g++ -o /sandbox/out /sandbox/code.cpp && /sandbox/out",
  },
  go: {
    image:     "golang:1.21-alpine",
    filename:  "code.go",
    run:       "go run /sandbox/code.go",
  },
};

async function run({ code, language }) {
  const config = LANGUAGE_CONFIG[language];
  if (!config) throw new Error(`Unsupported language: ${language}`);

  // Shell script: receive code from stdin, write to file, then execute
  // This avoids any volume mounts — works on Windows Docker-over-TCP
  const shellScript = `
    mkdir -p /sandbox &&
    cat > /sandbox/${config.filename} &&
    ${config.run}
  `;

  const dockerArgs = [
    "run", "--rm",
    "--network", "none",
    `--memory=${MEMORY_LIMIT}`,
    `--cpus=${CPU_LIMIT}`,
    "--tmpfs", "/sandbox:rw,exec,size=50m",
    "--tmpfs", "/tmp:rw,size=10m",
    "-i",                                // Keep stdin open to receive code
    config.image,
    "sh", "-c", shellScript,
  ];

  return new Promise((resolve, reject) => {
    let stdout = "";
    let stderr = "";
    let killed = false;

    const proc = spawn("docker", dockerArgs);

    // Send code to container via stdin, then close
    proc.stdin.write(code, "utf8");
    proc.stdin.end();

    const timer = setTimeout(() => {
      killed = true;
      proc.kill("SIGKILL");
    }, TIMEOUT_MS);

    proc.stdout.on("data", (chunk) => {
      stdout += chunk.toString();
      if (stdout.length > 100_000) proc.kill("SIGKILL");
    });

    proc.stderr.on("data", (chunk) => {
      stderr += chunk.toString();
    });

    proc.on("close", (exitCode) => {
      clearTimeout(timer);
      if (killed) {
        resolve({
          stdout: stdout || "",
          stderr: `⏱️ Execution timed out after ${TIMEOUT_MS / 1000}s`,
          exitCode: 124,
        });
        return;
      }
      resolve({
        stdout: stdout.trimEnd(),
        stderr: stderr.trimEnd(),
        exitCode: exitCode ?? 1,
      });
    });

    proc.on("error", (err) => {
      clearTimeout(timer);
      if (err.code === "ENOENT") {
        reject(new Error("Docker is not installed or not running. Please start Docker Desktop."));
      } else {
        reject(err);
      }
    });
  });
}

async function isDockerAvailable() {
  return new Promise((resolve) => {
    const proc = spawn("docker", ["info"]);
    proc.on("close", (code) => resolve(code === 0));
    proc.on("error", () => resolve(false));
  });
}

module.exports = { run, isDockerAvailable, LANGUAGE_CONFIG };