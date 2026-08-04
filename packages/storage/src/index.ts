export const packageName = "@supademo/storage" as const;

export {
  S3CompatibleStorageAdapter,
  StorageAdapterError,
  type S3StorageConfig
} from "./s3-compatible.js";
export { InMemoryStorageAdapter } from "./memory.js";
