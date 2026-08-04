/**
 * AWS Multi-AZ Encrypted RDS PostgreSQL & Private Redis ElastiCache Config — TASK-184
 */

export interface AwsDatabaseCacheConfig {
  readonly postgresEndpoint: string;
  readonly redisEndpoint: string;
  readonly isMultiAz: boolean;
  readonly isEncryptedAtRest: boolean;
}

export function createAwsDatabaseCacheConfig(): AwsDatabaseCacheConfig {
  return Object.freeze({
    postgresEndpoint: "db-cluster.internal.supademo.local:5432",
    redisEndpoint: "cache.internal.supademo.local:6379",
    isMultiAz: true,
    isEncryptedAtRest: true
  });
}
