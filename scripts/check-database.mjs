import { checkDatabaseHealth, closeDatabasePool, createDatabasePool } from "@supademo/database";

const connectionString = process.env["DATABASE_URL"];
if (!connectionString) {
  console.error("DATABASE_URL is required to check database health.");
  process.exit(1);
}

const pool = createDatabasePool({
  connectionString,
  applicationName: "supademo-db-health",
  onIdleClientError: () => {
    process.exitCode = 1;
  }
});

try {
  const health = await checkDatabaseHealth(pool);
  if (!health.healthy) {
    console.error("Database health query failed.");
    process.exitCode = 1;
  } else {
    console.log(`Database health query passed in ${health.latencyMs}ms.`);
  }
} finally {
  await closeDatabasePool(pool);
}
