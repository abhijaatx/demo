import assert from "node:assert/strict";
import { spawn, spawnSync } from "node:child_process";
import { once } from "node:events";
import { mkdtemp, rm, writeFile } from "node:fs/promises";
import { tmpdir } from "node:os";
import { join } from "node:path";
import test from "node:test";

const node = process.execPath;

test("API placeholder serves only the local health endpoint", async (context) => {
  const api = start("apps/api/dist/index.js", "33101", configurationEnvironment);
  context.after(() => stop(api));

  const health = await waitForResponse("http://127.0.0.1:33101/health");
  assert.equal(health.status, 200);
  assert.deepEqual(await health.json(), { status: "ok" });
  assert.equal(health.headers.get("cache-control"), "no-store");

  const missing = await fetch("http://127.0.0.1:33101/not-found");
  assert.equal(missing.status, 404);
  const missingBody = await missing.json();
  assert.equal(missingBody.error.code, "not_found");
  assert.equal(missingBody.error.requestId, missing.headers.get("x-request-id"));
});

test("web placeholder is available only over a caller-selected local port", async (context) => {
  const web = start("apps/web/dist/index.js", "33100");
  context.after(() => stop(web));

  const response = await waitForResponse("http://127.0.0.1:33100/");
  assert.equal(response.status, 200);
  assert.match(await response.text(), /Record → Edit → Share/u);
  assert.match(response.headers.get("content-security-policy") ?? "", /default-src 'none'/u);
  assert.equal(response.headers.get("x-content-type-options"), "nosniff");
});

test("placeholder HTTP servers reject unsafe local ports", () => {
  const result = spawnSync(node, ["apps/api/dist/index.js"], {
    encoding: "utf8",
    env: { ...process.env, ...configurationEnvironment, PORT: "80" }
  });

  assert.notEqual(result.status, 0);
  assert.match(result.stderr, /PORT must be between 1024 and 65535/u);
});

test("worker exits cleanly after SIGTERM", async () => {
  const worker = spawn(node, ["apps/worker/dist/index.js"], {
    env: { ...process.env, ...configurationEnvironment },
    stdio: ["ignore", "pipe", "pipe"]
  });

  await waitForOutput(worker.stdout, '"message":"worker_started"');
  worker.kill("SIGTERM");
  const [exitCode, signal] = await once(worker, "exit");

  assert.equal(exitCode, 0);
  assert.equal(signal, null);
});

test("commit-message validator enforces the repository convention", async () => {
  const directory = await mkdtemp(join(tmpdir(), "supademo-commit-"));
  const validPath = join(directory, "valid.txt");
  const invalidPath = join(directory, "invalid.txt");

  try {
    await writeFile(validPath, "security(scaffold): enforce quality checks\n", "utf8");
    await writeFile(invalidPath, "WIP changes\n", "utf8");

    const valid = spawnSync(node, ["scripts/check-commit-message.mjs", validPath], {
      encoding: "utf8"
    });
    const invalid = spawnSync(node, ["scripts/check-commit-message.mjs", invalidPath], {
      encoding: "utf8"
    });

    assert.equal(valid.status, 0);
    assert.equal(invalid.status, 1);
  } finally {
    await rm(directory, { force: true, recursive: true });
  }
});

function start(entrypoint, port, environment = {}) {
  return spawn(node, [entrypoint], {
    env: { ...process.env, ...environment, PORT: port },
    stdio: ["ignore", "pipe", "pipe"]
  });
}

async function waitForResponse(url) {
  let lastError;
  for (let attempt = 0; attempt < 30; attempt += 1) {
    try {
      return await fetch(url);
    } catch (error) {
      lastError = error;
      await delay(50);
    }
  }
  throw lastError;
}

async function stop(process) {
  if (process.exitCode !== null || process.signalCode !== null) {
    return;
  }

  process.kill("SIGTERM");
  await once(process, "exit");
}

function waitForOutput(stream, expected) {
  return new Promise((resolve, reject) => {
    let output = "";
    const timeout = setTimeout(() => {
      reject(new Error(`Timed out waiting for ${expected}. Output: ${output}`));
    }, 1_500);

    stream.on("data", (chunk) => {
      output += chunk.toString();
      if (output.includes(expected)) {
        clearTimeout(timeout);
        resolve();
      }
    });
    stream.once("error", (error) => {
      clearTimeout(timeout);
      reject(error);
    });
  });
}

function delay(milliseconds) {
  return new Promise((resolve) => setTimeout(resolve, milliseconds));
}

const configurationEnvironment = {
  APP_ENV: "test",
  CONFIG_SOURCE: "env",
  DATABASE_URL: "postgresql://test:test@127.0.0.1:5432/test",
  REDIS_URL: "redis://:test@127.0.0.1:6379",
  AWS_REGION: "us-east-1",
  AWS_ACCESS_KEY_ID: "test-access-key",
  AWS_SECRET_ACCESS_KEY: "test-secret-key"
};
