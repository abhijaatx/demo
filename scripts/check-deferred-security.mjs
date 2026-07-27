import { readFile } from "node:fs/promises";

const manifest = await readFile(
  new URL("../.github/security/scanner-placeholders.md", import.meta.url),
  "utf8"
);
const tools = process.argv
  .slice(2)
  .filter((argument) => argument.startsWith("--tool="))
  .map((argument) => argument.slice(7));
const requiredTools = tools.length > 0 ? tools : ["sast", "container", "iac"];
const missing = requiredTools.filter((tool) => !manifest.includes(`### ${tool}`));

if (missing.length > 0) {
  console.error(`Missing deferred scanner documentation for: ${missing.join(", ")}.`);
  process.exitCode = 1;
} else {
  console.log(`Deferred scanner placeholders documented: ${requiredTools.join(", ")}.`);
}
