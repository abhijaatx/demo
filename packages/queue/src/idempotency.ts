export type IdempotencyClaim = "started" | "in_progress" | "completed";

export interface IdempotencyStore {
  begin(idempotencyKey: string, jobId: string): Promise<IdempotencyClaim>;
  complete(idempotencyKey: string, jobId: string): Promise<void>;
  release(idempotencyKey: string, jobId: string): Promise<void>;
}

interface MemoryClaim {
  readonly jobId: string;
  status: "processing" | "completed";
  leaseExpiresAt: number;
}

export class InMemoryIdempotencyStore implements IdempotencyStore {
  private readonly claims = new Map<string, MemoryClaim>();
  private readonly leaseMs: number;

  constructor(leaseMs = 60_000) {
    if (!Number.isSafeInteger(leaseMs) || leaseMs < 1_000 || leaseMs > 86_400_000) {
      throw new Error("The idempotency lease is invalid.");
    }
    this.leaseMs = leaseMs;
  }

  async begin(idempotencyKey: string, jobId: string): Promise<IdempotencyClaim> {
    const existing = this.claims.get(idempotencyKey);
    const now = Date.now();
    if (existing?.status === "completed") {
      return "completed";
    }
    if (existing !== undefined && existing.leaseExpiresAt > now) {
      return "in_progress";
    }
    this.claims.set(idempotencyKey, {
      jobId,
      status: "processing",
      leaseExpiresAt: now + this.leaseMs
    });
    return "started";
  }

  async complete(idempotencyKey: string, jobId: string): Promise<void> {
    const existing = this.claims.get(idempotencyKey);
    if (existing?.jobId === jobId) {
      existing.status = "completed";
      existing.leaseExpiresAt = Number.MAX_SAFE_INTEGER;
    }
  }

  async release(idempotencyKey: string, jobId: string): Promise<void> {
    const existing = this.claims.get(idempotencyKey);
    if (existing?.jobId === jobId && existing.status === "processing") {
      this.claims.delete(idempotencyKey);
    }
  }
}
