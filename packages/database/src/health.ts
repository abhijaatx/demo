import { type Pool } from "pg";
import { query } from "./pool.js";

export const databaseHealthQuery = "SELECT 1 AS health_check" as const;

export interface DatabaseHealth {
  readonly healthy: boolean;
  readonly latencyMs: number;
}

export async function checkDatabaseHealth(pool: Pool): Promise<DatabaseHealth> {
  const startedAt = performance.now();
  try {
    const result = await query<{ health_check: number }>(pool, databaseHealthQuery);
    return {
      healthy: result.rows[0]?.health_check === 1,
      latencyMs: Math.max(0, Math.round(performance.now() - startedAt))
    };
  } catch {
    return {
      healthy: false,
      latencyMs: Math.max(0, Math.round(performance.now() - startedAt))
    };
  }
}
