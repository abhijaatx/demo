import assert from "node:assert/strict";
import { spawn } from "node:child_process";
import { once } from "node:events";
import test from "node:test";

const node = process.execPath;
const integrationEnvironment = {
  APP_ENV: "test",
  CONFIG_SOURCE: "env",
  PORT: "33103",
  AWS_REGION: process.env.AWS_REGION ?? "us-east-1",
  AWS_ACCESS_KEY_ID: process.env.AWS_ACCESS_KEY_ID ?? "integration-access-key",
  AWS_SECRET_ACCESS_KEY: process.env.AWS_SECRET_ACCESS_KEY ?? "integration-secret-key",
  DATABASE_URL: process.env.DATABASE_URL,
  REDIS_URL: process.env.REDIS_URL
};

if (!integrationEnvironment.DATABASE_URL || !integrationEnvironment.REDIS_URL) {
  test("API integration requires DATABASE_URL and REDIS_URL", {
    skip: "copy .env.example to .env first"
  });
} else {
  test("API starts against local services and reports database readiness", async () => {
    const api = spawn(node, ["apps/api/dist/index.js"], {
      env: { ...process.env, ...integrationEnvironment },
      stdio: ["ignore", "pipe", "pipe"]
    });

    try {
      await waitForOutput(api.stdout, "API listening at");
      const readiness = await waitForResponse("http://127.0.0.1:33103/api/v1/readiness");
      assert.equal(readiness.status, 200);
      const body = await readiness.json();
      assert.equal(body.status, "ready");
      assert.equal(body.dependencies.database.status, "ok");
      assert.equal(typeof body.dependencies.database.latencyMs, "number");
    } finally {
      api.kill("SIGTERM");
      await once(api, "exit");
    }
  });
}

async function waitForResponse(url) {
  let lastError;
  for (let attempt = 0; attempt < 30; attempt += 1) {
    try {
      return await fetch(url);
    } catch (error) {
      lastError = error;
      await new Promise((resolve) => setTimeout(resolve, 50));
    }
  }
  throw lastError;
}

function waitForOutput(stream, expected) {
  return new Promise((resolve, reject) => {
    let output = "";
    const timeout = setTimeout(() => {
      reject(new Error(`Timed out waiting for ${expected}. Output: ${output}`));
    }, 5_000);

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
