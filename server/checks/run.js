/**
 * One command that proves the API works end to end.
 *
 *     npm run verify
 *
 * It starts the API with the rate limiter disabled, waits for /api/health,
 * runs checks/smoke.js against it, then shuts it down again. Nothing is left
 * running afterwards.
 */
const { spawn } = require("node:child_process");
const path = require("node:path");

const PORT = process.env.VERIFY_PORT || "3100";
const BASE = `http://127.0.0.1:${PORT}`;
const serverEntry = path.join(__dirname, "..", "server.js");

const child = spawn(process.execPath, [serverEntry], {
  env: {
    ...process.env,
    PORT,
    DISABLE_RATE_LIMIT: "1",
    NODE_ENV: "test",
  },
  stdio: ["ignore", "pipe", "pipe"],
});

let output = "";
child.stdout.on("data", (chunk) => {
  output += chunk.toString();
});
child.stderr.on("data", (chunk) => {
  output += chunk.toString();
});

const sleep = (ms) => new Promise((resolve) => setTimeout(resolve, ms));

async function waitForReady(timeoutMs = 20000) {
  const deadline = Date.now() + timeoutMs;
  while (Date.now() < deadline) {
    try {
      const response = await fetch(`${BASE}/api/health`);
      if (response.ok) return true;
    } catch {
      /* not listening yet */
    }
    await sleep(400);
  }
  return false;
}

async function main() {
  const ready = await waitForReady();
  if (!ready) {
    console.error("The API did not become ready. Server output:\n" + output);
    child.kill();
    process.exit(1);
  }

  const smoke = spawn(process.execPath, [path.join(__dirname, "smoke.js")], {
    env: { ...process.env, API_URL: BASE, DISABLE_RATE_LIMIT: "1" },
    stdio: "inherit",
  });

  const code = await new Promise((resolve) => smoke.on("exit", resolve));
  child.kill();
  process.exit(code ?? 0);
}

main();

process.on("exit", () => {
  if (!child.killed) child.kill();
});
