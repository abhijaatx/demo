import { type Pool, type PoolClient } from "pg";

export type TransactionOperation<T> = (client: PoolClient) => Promise<T>;

export async function withTransaction<T>(
  pool: Pool,
  operation: TransactionOperation<T>
): Promise<T> {
  const client = await pool.connect();
  try {
    await client.query("BEGIN");
    const result = await operation(client);
    await client.query("COMMIT");
    return result;
  } catch (error) {
    try {
      await client.query("ROLLBACK");
    } catch {
      throw new Error("Database transaction failed and rollback could not be confirmed.");
    }
    throw error;
  } finally {
    client.release();
  }
}
