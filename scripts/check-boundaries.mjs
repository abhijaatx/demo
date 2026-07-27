import { readFileSync, readdirSync } from "node:fs";
import { dirname, join, relative, resolve } from "node:path";
import { fileURLToPath } from "node:url";

const repositoryRoot = resolve(dirname(fileURLToPath(import.meta.url)), "..");
const workspaceRoots = ["apps", "packages"];
const workspaceDirectories = workspaceRoots.flatMap((root) => {
  const absoluteRoot = join(repositoryRoot, root);
  return readdirSync(absoluteRoot, { withFileTypes: true })
    .filter((entry) => entry.isDirectory())
    .map((entry) => join(absoluteRoot, entry.name));
});

const workspaces = workspaceDirectories.map((directory) => {
  const packageJson = JSON.parse(readFileSync(join(directory, "package.json"), "utf8"));
  return {
    directory,
    name: packageJson.name,
    type: directory.includes("/apps/") ? "app" : "package",
    packageJson
  };
});

const workspaceByName = new Map(workspaces.map((workspace) => [workspace.name, workspace]));
const localPackageNames = workspaces
  .filter((workspace) => workspace.type === "package")
  .map((workspace) => workspace.name);

const packageDependencies = new Map([
  ["@supademo/config", []],
  ["@supademo/auth", []],
  ["@supademo/domain", []],
  ["@supademo/analytics", ["@supademo/domain"]],
  ["@supademo/database", ["@supademo/config", "@supademo/domain"]],
  ["@supademo/storage", ["@supademo/config", "@supademo/domain"]],
  ["@supademo/queue", ["@supademo/config", "@supademo/domain"]],
  ["@supademo/observability", []],
  ["@supademo/integrations", ["@supademo/config", "@supademo/domain"]],
  ["@supademo/ai", ["@supademo/config", "@supademo/domain"]],
  ["@supademo/player", ["@supademo/domain"]],
  ["@supademo/ui", []]
]);

const errors = [];

for (const workspace of workspaces) {
  if (workspace.type === "package" && !packageDependencies.has(workspace.name)) {
    errors.push(`${workspace.name} is missing from the package dependency policy.`);
    continue;
  }

  const allowedDependencies = new Set(
    workspace.type === "app" ? localPackageNames : packageDependencies.get(workspace.name)
  );

  const manifestDependencyGroups = [
    workspace.packageJson.dependencies,
    workspace.packageJson.devDependencies,
    workspace.packageJson.peerDependencies,
    workspace.packageJson.optionalDependencies
  ];

  for (const dependencies of manifestDependencyGroups) {
    for (const dependencyName of Object.keys(dependencies ?? {})) {
      if (!workspaceByName.has(dependencyName)) {
        continue;
      }

      if (!allowedDependencies.has(dependencyName)) {
        errors.push(`${workspace.name} may not depend on ${dependencyName}.`);
      }
    }
  }

  for (const sourceFile of findTypeScriptFiles(join(workspace.directory, "src"))) {
    const source = readFileSync(sourceFile, "utf8");
    for (const specifier of findModuleSpecifiers(source)) {
      if (workspaceByName.has(specifier)) {
        if (!allowedDependencies.has(specifier)) {
          errors.push(`${relative(repositoryRoot, sourceFile)} may not import ${specifier}.`);
        }
        continue;
      }

      if (specifier.startsWith("@supademo/")) {
        errors.push(
          `${relative(repositoryRoot, sourceFile)} imports unknown local module ${specifier}.`
        );
        continue;
      }

      if (specifier.startsWith(".")) {
        const importedPath = resolve(dirname(sourceFile), specifier);
        const importedWorkspace = workspaces.find((candidate) =>
          isWithin(candidate.directory, importedPath)
        );
        if (importedWorkspace && importedWorkspace.name !== workspace.name) {
          errors.push(
            `${relative(repositoryRoot, sourceFile)} may not cross workspace boundaries with relative import ${specifier}.`
          );
        }
      }
    }
  }
}

if (errors.length > 0) {
  console.error("Workspace boundary check failed:");
  for (const error of errors) {
    console.error(`- ${error}`);
  }
  process.exitCode = 1;
} else {
  console.log("Workspace boundary check passed.");
}

function findTypeScriptFiles(directory) {
  try {
    return readdirSync(directory, { withFileTypes: true }).flatMap((entry) => {
      const entryPath = join(directory, entry.name);
      if (entry.isDirectory()) {
        return findTypeScriptFiles(entryPath);
      }
      return entry.isFile() && entry.name.endsWith(".ts") ? [entryPath] : [];
    });
  } catch {
    return [];
  }
}

function findModuleSpecifiers(source) {
  const specifiers = [];
  const expressions = [
    /\b(?:import|export)\s+(?:[\s\S]*?\s+from\s+)?["']([^"']+)["']/g,
    /\bimport\s*\(\s*["']([^"']+)["']\s*\)/g
  ];

  for (const expression of expressions) {
    for (const match of source.matchAll(expression)) {
      const specifier = match[1];
      if (specifier) {
        specifiers.push(specifier);
      }
    }
  }
  return specifiers;
}

function isWithin(parent, candidate) {
  const pathToCandidate = relative(parent, candidate);
  return (
    pathToCandidate === "" ||
    (!pathToCandidate.startsWith("..") && !pathToCandidate.startsWith("/"))
  );
}
