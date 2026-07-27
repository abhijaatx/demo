import { Pool, type PoolClient, type PoolConfig, type QueryResult, type QueryResultRow } from "pg";

export interface DatabasePoolOptions {
  readonly connectionString: string;
  readonly max?: number;
  readonly idleTimeoutMillis?: number;
  readonly connectionTimeoutMillis?: number;
  readonly applicationName?: string;
  readonly ssl?: PoolConfig["ssl"];
  readonly onIdleClientError: (error: Error) => void;
}

export interface SqlExecutor {
  query<T extends QueryResultRow = QueryResultRow>(
    text: string,
    values?: unknown[]
  ): Promise<QueryResult<T>>;
}

export function createDatabasePool(options: DatabasePoolOptions): Pool {
  const pool = new Pool({
    connectionString: options.connectionString,
    max: options.max ?? 10,
    idleTimeoutMillis: options.idleTimeoutMillis ?? 30_000,
    connectionTimeoutMillis: options.connectionTimeoutMillis ?? 5_000,
    application_name: options.applicationName ?? "supademo",
    ssl: options.ssl
  });

  pool.on("error", options.onIdleClientError);
  return pool;
}

export async function closeDatabasePool(pool: Pool): Promise<void> {
  await pool.end();
}

export function query<T extends QueryResultRow>(
  executor: Pool | PoolClient,
  text: string,
  values: unknown[] = []
): Promise<QueryResult<T>> {
  return executor.query<T>(text, values);
}
