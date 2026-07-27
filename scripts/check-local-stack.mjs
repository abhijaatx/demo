import { execFileSync } from "node:child_process";

const composeArguments = ["compose", "-f", "docker/compose.yml"];
const expectedServices = new Map([
  ["postgres", "healthy"],
  ["redis", "healthy"],
  ["minio", "healthy"],
  ["elasticmq", "healthy"],
  ["mailpit", "healthy"],
  ["minio-bootstrap", "exited"]
]);

const containers = readComposeStatus();
const failures = [];

for (const [service, expectedState] of expectedServices) {
  const container = containers.find((candidate) => candidate.Service === service);
  if (!container) {
    failures.push(`${service} container is missing.`);
    continue;
  }

  if (expectedState === "healthy" && container.Health !== "healthy") {
    failures.push(`${service} is ${container.Status}, not healthy.`);
  }

  if (expectedState === "exited" && (container.State !== "exited" || container.ExitCode !== 0)) {
    failures.push(`${service} did not exit successfully.`);
  }
}

await checkHttp("MinIO readiness", "http://127.0.0.1:9000/minio/health/ready", [200]);
await checkHttp("Mailpit readiness", "http://127.0.0.1:8025/readyz", [200]);
await checkHttp("ElasticMQ SQS endpoint", "http://127.0.0.1:9324/", [400]);

if (failures.length > 0) {
  console.error("Local service stack check failed:");
  for (const failure of failures) {
    console.error(`- ${failure}`);
  }
  process.exitCode = 1;
} else {
  console.log("Local service stack is healthy and MinIO bootstrap completed.");
}

function readComposeStatus() {
  const output = execFileSync("docker", [...composeArguments, "ps", "--all", "--format", "json"], {
    encoding: "utf8"
  });

  return output
    .split("\n")
    .filter(Boolean)
    .map((line) => JSON.parse(line));
}

async function checkHttp(label, url, acceptedStatuses) {
  try {
    const response = await fetch(url);
    if (!acceptedStatuses.includes(response.status)) {
      failures.push(`${label} returned HTTP ${response.status}.`);
    }
  } catch (error) {
    failures.push(`${label} could not be reached: ${error.message}`);
  }
}
