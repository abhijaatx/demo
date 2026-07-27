export const packageName = "@supademo/domain" as const;

export {
  assertDemoStatusTransition,
  calculateTrashRetention,
  DemoConflictError,
  DemoStoreError,
  DemoValidationError,
  demoFingerprint,
  demoStatuses,
  demoTypes,
  normalizeDemoId,
  normalizeDemoStatus,
  parseCreateDemoInput,
  parseDemoPatch,
  TRASH_RETENTION_DAYS,
  type CreateDemoInput,
  type Demo,
  type DemoAuditAction,
  type DemoAuditEvent,
  type DemoPatch,
  type DemoRepository,
  type DemoStatus,
  type DemoType,
  type TrashItem
} from "./demo.js";

export {
  folderFingerprint,
  FolderConflictError,
  FolderStoreError,
  FolderValidationError,
  maxFolderDepth,
  normalizeFolderId,
  normalizeFolderVersion,
  parseAssignDemoFolderInput,
  parseCreateFolderInput,
  parseMoveFolderInput,
  parseUpdateFolderInput,
  type AssignDemoFolderInput,
  type CreateFolderInput,
  type Folder,
  type FolderRepository,
  type MoveFolderInput,
  type UpdateFolderInput
} from "./folder.js";

export {
  normalizeTagId,
  parseCreateTagInput,
  parseDemoSearchFilters,
  tagFingerprint,
  TagConflictError,
  TagStoreError,
  TagValidationError,
  type CreateTagInput,
  type DemoSearchFilters,
  type Tag,
  type TagRepository
} from "./tag.js";

export {
  InvitationConflictError,
  InvitationStoreError,
  InvitationValidationError,
  invitationExpiry,
  normalizeInvitationEmail,
  normalizeInvitationRole,
  normalizeInvitationToken,
  validateInvitationExpiry,
  type CreatedWorkspaceInvitation,
  type InvitationDelivery,
  type InvitationRole,
  type WorkspaceAuditEvent,
  type WorkspaceMember,
  type WorkspaceInvitation,
  type WorkspaceInvitationRepository
} from "./invitations.js";

export {
  AuthorizationDeniedError,
  can,
  capabilitiesForRole,
  requireCapability,
  requireWorkspaceCapability,
  type AuthorizationRole,
  type WorkspaceAuthorizationContext,
  type WorkspaceCapability
} from "./authorization.js";

export {
  defaultDisplayName,
  defaultUserPreferences,
  normalizeAvatarUrl,
  normalizeDisplayName,
  normalizeIdentitySubject,
  normalizeProfileEmail,
  normalizeTimezone,
  normalizeUserPreferences,
  parseUserProfilePatch,
  UserProfileStoreError,
  UserProfileValidationError,
  type UserIdentityInput,
  type UserPreferences,
  type UserProfile,
  type UserProfilePatch,
  type UserProfileRepository
} from "./profile.js";

export {
  normalizeIdempotencyKey,
  normalizeOrganizationName,
  normalizeUserId,
  normalizeWorkspaceName,
  normalizeWorkspaceSlug,
  parseCreateWorkspaceInput,
  workspaceFingerprint,
  WorkspaceConflictError,
  WorkspaceStoreError,
  WorkspaceValidationError,
  type CreateWorkspaceInput,
  type WorkspaceRepository,
  type WorkspaceRole,
  type WorkspaceSummary
} from "./workspace.js";

export {
  InMemoryTenantScopedRepository,
  requireTenantCapability,
  type TenantRecord,
  type TenantScope,
  type TenantScopedRepository
} from "./tenant.js";
