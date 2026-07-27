import { mkdir, writeFile } from "node:fs/promises";
import { dirname, resolve } from "node:path";
import { createOpenApiDocument } from "../apps/api/dist/openapi.js";

const outputPath = resolve("apps/api/openapi.json");
await mkdir(dirname(outputPath), { recursive: true });
await writeFile(outputPath, `${JSON.stringify(createOpenApiDocument(), null, 2)}\n`, "utf8");
console.log(`Generated ${outputPath}.`);
