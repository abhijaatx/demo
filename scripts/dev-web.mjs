import { spawn } from "node:child_process";
import { once } from "node:events";

const npmCommand = process.platform === "win32" ? "npm.cmd" : "npm";
const children = new Set();

const apiBuild = spawn(npmCommand, ["run", "build", "--workspace=@supademo/api"], {
  cwd: process.cwd(),
  stdio: "inherit"
});
const [buildResult] = await once(apiBuild, "close");
if (buildResult !== 0) process.exit(buildResult ?? 1);

const api = spawn(npmCommand, ["run", "start:api"], {
  cwd: process.cwd(),
  stdio: "inherit"
});
const web = spawn(npmCommand, ["run", "dev", "--workspace=@supademo/web"], {
  cwd: process.cwd(),
  stdio: "inherit"
});
children.add(api);
children.add(web);

const shutdown = (signal) => {
  for (const child of children) child.kill(signal);
};
process.once("SIGINT", () => shutdown("SIGINT"));
process.once("SIGTERM", () => shutdown("SIGTERM"));

const result = await Promise.race(
  [...children].map(async (child) => {
    const [code] = await once(child, "close");
    return { code: code ?? 1 };
  })
);
shutdown("SIGTERM");
process.exit(result.code);
