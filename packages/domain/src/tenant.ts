import {
  requireWorkspaceCapability,
  type AuthorizationRole,
  type WorkspaceCapability
} from "./authorization.js";

export type TenantScope = Readonly<{
  userId: string;
  workspaceId: string;
  role: AuthorizationRole;
}>;

export type TenantRecord = Readonly<{
  id: string;
  workspaceId: string;
}>;

export interface TenantScopedRepository<TRecord extends TenantRecord> {
  list(scope: TenantScope): readonly TRecord[];
  get(scope: TenantScope, id: string): TRecord | null;
  create(scope: TenantScope, record: TRecord): TRecord;
  update(scope: TenantScope, id: string, update: (record: TRecord) => TRecord): TRecord | null;
  delete(scope: TenantScope, id: string): boolean;
}

export class InMemoryTenantScopedRepository<
  TRecord extends TenantRecord
> implements TenantScopedRepository<TRecord> {
  private readonly records = new Map<string, TRecord>();

  constructor(records: readonly TRecord[] = []) {
    for (const record of records) this.records.set(record.id, Object.freeze({ ...record }));
  }

  list(scope: TenantScope): readonly TRecord[] {
    requireTenantCapability(scope, "demo:read");
    return Object.freeze(
      [...this.records.values()].filter((record) => record.workspaceId === scope.workspaceId)
    );
  }

  get(scope: TenantScope, id: string): TRecord | null {
    requireTenantCapability(scope, "demo:read");
    const record = this.records.get(id);
    return record?.workspaceId === scope.workspaceId ? record : null;
  }

  create(scope: TenantScope, record: TRecord): TRecord {
    requireTenantCapability(scope, "demo:create");
    if (record.workspaceId !== scope.workspaceId || this.records.has(record.id)) {
      throw new Error("The tenant resource could not be created.");
    }
    const stored = Object.freeze({ ...record });
    this.records.set(stored.id, stored);
    return stored;
  }

  update(scope: TenantScope, id: string, update: (record: TRecord) => TRecord): TRecord | null {
    requireTenantCapability(scope, "demo:update");
    const current = this.records.get(id);
    if (!current || current.workspaceId !== scope.workspaceId) return null;
    const next = update(current);
    if (next.id !== id || next.workspaceId !== scope.workspaceId) {
      throw new Error("Tenant resource ownership cannot change.");
    }
    const stored = Object.freeze({ ...next });
    this.records.set(id, stored);
    return stored;
  }

  delete(scope: TenantScope, id: string): boolean {
    requireTenantCapability(scope, "demo:delete");
    const current = this.records.get(id);
    if (!current || current.workspaceId !== scope.workspaceId) return false;
    this.records.delete(id);
    return true;
  }
}

export function requireTenantCapability(scope: TenantScope, capability: WorkspaceCapability): void {
  if (!scope.userId || !scope.workspaceId) throw new Error("A tenant scope is required.");
  requireWorkspaceCapability(scope, scope.workspaceId, capability);
}
