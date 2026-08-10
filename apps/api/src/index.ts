import {
  AuthWorkflowService,
  InMemoryAuthRateLimiter,
  InMemoryAuthSessionStore
} from "@supademo/auth";
import { ConfigurationError, loadConfig } from "@supademo/config";
import {
  checkDatabaseHealth,
  closeDatabasePool,
  createDatabasePool,
  DatabaseDemoRepository,
  DatabaseFolderRepository,
  DatabaseTagRepository,
  DatabaseUserProfileRepository,
  DatabaseMembershipRepository,
  DatabaseWorkspaceRepository
} from "@supademo/database";
import { createHookedTracer, createJsonLogger, InMemoryMetrics } from "@supademo/observability";
import { createApiServer } from "./app.js";
import { LocalAuthProvider } from "./local-auth-provider.js";

await main().catch((error: unknown) => {
  console.error(configurationErrorMessage(error));
  process.exitCode = 1;
});

async function main(): Promise<void> {
  const config = await loadConfig();
  const pool = createDatabasePool({
    connectionString: config.database.url,
    applicationName: "supademo-api",
    onIdleClientError: () => {
      console.error(JSON.stringify({ level: "error", message: "database_idle_client_error" }));
    }
  });
  const localAuthProvider = config.auth.provider === "local" ? new LocalAuthProvider() : undefined;
  const authRuntime = localAuthProvider
    ? (() => {
        const authSessionStore = new InMemoryAuthSessionStore();
        const authWorkflow = new AuthWorkflowService({
          provider: localAuthProvider,
          rateLimiter: new InMemoryAuthRateLimiter()
        });
        return { authProvider: localAuthProvider, authWorkflow, authSessionStore };
      })()
    : {};
  const server = createApiServer({
    checkDatabaseHealth: () => checkDatabaseHealth(pool),
    userProfileRepository: new DatabaseUserProfileRepository(pool),
    workspaceRepository: new DatabaseWorkspaceRepository(pool),
    membershipRepository: new DatabaseMembershipRepository(pool),
    demoRepository: new DatabaseDemoRepository(pool),
    folderRepository: new DatabaseFolderRepository(pool),
    tagRepository: new DatabaseTagRepository(pool),
    ...authRuntime,
    authEnvironment: config.app.environment,
    allowedOrigins: config.app.allowedOrigins,
    logger: createJsonLogger({ service: "api" }),
    metrics: new InMemoryMetrics(),
    tracer: createHookedTracer()
  });

  try {
    await listen(server, config.app.host, config.app.port);
    console.log(`API listening at http://${config.app.host}:${config.app.port}`);

    let shuttingDown = false;
    const shutdown = async (signal: string): Promise<void> => {
      if (shuttingDown) {
        return;
      }
      shuttingDown = true;
      console.log(`API shutdown requested by ${signal}.`);

      const closeServer = new Promise<void>((resolve) => {
        if (!server.listening) {
          resolve();
          return;
        }
        server.close(() => resolve());
      });
      const timeout = new Promise<"timeout">((resolve) => {
        const timer = setTimeout(() => resolve("timeout"), 10_000);
        timer.unref();
      });
      const result = await Promise.race([closeServer.then(() => "closed" as const), timeout]);
      await closeDatabasePool(pool);
      if (result === "timeout") {
        process.exitCode = 1;
        console.error(JSON.stringify({ level: "error", message: "api_shutdown_timeout" }));
      }
    };

    const requestShutdown = (signal: string) => {
      void shutdown(signal).catch(() => {
        process.exitCode = 1;
        console.error(JSON.stringify({ level: "error", message: "api_shutdown_failed" }));
      });
    };

    process.once("SIGINT", () => requestShutdown("SIGINT"));
    process.once("SIGTERM", () => requestShutdown("SIGTERM"));
  } catch (error) {
    await closeDatabasePool(pool);
    throw error;
  }
}

function listen(
  server: ReturnType<typeof createApiServer>,
  host: string,
  port: number
): Promise<void> {
  return new Promise((resolve, reject) => {
    const onError = (error: Error) => {
      server.off("listening", onListening);
      reject(error);
    };
    const onListening = () => {
      server.off("error", onError);
      resolve();
    };
    server.once("error", onError);
    server.once("listening", onListening);
    server.listen(port, host);
  });
}

function configurationErrorMessage(error: unknown): string {
  if (error instanceof ConfigurationError) {
    return error.message;
  }
  return "API startup failed.";
}
