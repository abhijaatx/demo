import { spawn } from "node:child_process";
import { once } from "node:events";
import { mkdir, writeFile } from "node:fs/promises";

const artifactsDirectory = "artifacts";
const coverageDirectory = `${artifactsDirectory}/v8-coverage`;
await mkdir(coverageDirectory, { recursive: true });

const child = spawn(process.execPath, ["--test", "tests"], {
  env: { ...process.env, NODE_V8_COVERAGE: coverageDirectory },
  stdio: ["ignore", "pipe", "pipe"]
});
let output = "";
child.stdout.on("data", (chunk) => {
  const text = chunk.toString();
  output += text;
  process.stdout.write(text);
});
child.stderr.on("data", (chunk) => {
  const text = chunk.toString();
  output += text;
  process.stderr.write(text);
});

const [exitCode, signal] = await once(child, "exit");
await writeFile(`${artifactsDirectory}/test-results.txt`, output, "utf8");
process.exitCode = signal === null ? exitCode : 1;
