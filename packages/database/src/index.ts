export const packageName = "@supademo/database" as const;

export {
  createDatabasePool,
  closeDatabasePool,
  query,
  type DatabasePoolOptions,
  type SqlExecutor
} from "./pool.js";
export { checkDatabaseHealth, databaseHealthQuery, type DatabaseHealth } from "./health.js";
export { withTransaction, type TransactionOperation } from "./transaction.js";
export { createUuidV7, isUuidV7, type UuidV7 } from "./ids.js";
export { DatabaseUserProfileRepository } from "./users.js";
export { DatabaseWorkspaceRepository } from "./workspaces.js";
export { DatabaseMembershipRepository } from "./memberships.js";
export { DatabaseDemoRepository } from "./demos.js";
export { DatabaseFolderRepository } from "./folders.js";
export { DatabaseTagRepository } from "./tags.js";
export { DatabaseCommentRepository } from "./comments.js";
export { DatabaseNotificationRepository } from "./notifications.js";
