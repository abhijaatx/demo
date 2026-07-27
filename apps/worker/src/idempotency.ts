import type { SqlExecutor } from "@supademo/database";
import type { IdempotencyClaim, IdempotencyStore } from "@supademo/queue";

export class SqlIdempotencyStore implements IdempotencyStore {
  private readonly leaseSeconds: number;

  constructor(
    private readonly database: SqlExecutor,
    leaseSeconds: number
  ) {
    if (!Number.isSafeInteger(leaseSeconds) || leaseSeconds < 5 || leaseSeconds > 86_400) {
      throw new Error("The idempotency lease is invalid.");
    }
    this.leaseSeconds = leaseSeconds;
  }

  async begin(idempotencyKey: string, jobId: string): Promise<IdempotencyClaim> {
    const inserted = await this.database.query<{ readonly status: string }>(
      `
        INSERT INTO queue_idempotency (idempotency_key, job_id, status, lease_expires_at)
        VALUES ($1, $2, 'processing', now() + ($3 * interval '1 second'))
        ON CONFLICT (idempotency_key) DO NOTHING
        RETURNING status
      `,
      [idempotencyKey, jobId, this.leaseSeconds]
    );
    if (inserted.rows.length > 0) {
      return "started";
    }

    const reclaimed = await this.database.query<{ readonly status: string }>(
      `
        UPDATE queue_idempotency
        SET job_id = $2,
            status = 'processing',
            lease_expires_at = now() + ($3 * interval '1 second'),
            updated_at = now()
        WHERE idempotency_key = $1
          AND status = 'processing'
          AND lease_expires_at < now()
        RETURNING status
      `,
      [idempotencyKey, jobId, this.leaseSeconds]
    );
    if (reclaimed.rows.length > 0) {
      return "started";
    }

    const existing = await this.database.query<{ readonly status: string }>(
      "SELECT status FROM queue_idempotency WHERE idempotency_key = $1",
      [idempotencyKey]
    );
    return existing.rows[0]?.status === "completed" ? "completed" : "in_progress";
  }

  async complete(idempotencyKey: string, jobId: string): Promise<void> {
    await this.database.query(
      `
        UPDATE queue_idempotency
        SET status = 'completed', completed_at = now(), updated_at = now()
        WHERE idempotency_key = $1 AND job_id = $2 AND status = 'processing'
      `,
      [idempotencyKey, jobId]
    );
  }

  async release(idempotencyKey: string, jobId: string): Promise<void> {
    await this.database.query(
      "DELETE FROM queue_idempotency WHERE idempotency_key = $1 AND job_id = $2 AND status = 'processing'",
      [idempotencyKey, jobId]
    );
  }
}
