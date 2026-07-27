import { readFileSync } from "node:fs";

const messageFile = process.argv[2];
if (!messageFile) {
  console.error("Usage: npm run check:commit -- <commit-message-file>");
  process.exit(2);
}

const message = readFileSync(messageFile, "utf8");
const firstMeaningfulLine = message
  .split(/\r?\n/u)
  .map((line) => line.trim())
  .find((line) => line.length > 0 && !line.startsWith("#"));

const conventionalCommit =
  /^(build|chore|ci|docs|feat|fix|perf|refactor|revert|security|test)(\([a-z0-9._/-]+\))?!?: [^\s].{0,71}$/u;

if (!firstMeaningfulLine || !conventionalCommit.test(firstMeaningfulLine)) {
  console.error(
    "Commit message must match Conventional Commits with an allowed type and a 1-72 character summary."
  );
  process.exit(1);
}

console.log("Commit message convention passed.");
