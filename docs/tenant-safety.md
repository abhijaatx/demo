# Tenant-safe repositories

TASK-028 establishes the repository pattern required for tenant-owned resources.

## Required repository shape

Tenant repositories receive a `TenantScope` on every operation:

```ts
type TenantScope = {
  userId: string;
  workspaceId: string;
  role: AuthorizationRole;
};
```

`list`, `get`, `create`, `update`, and `delete` all require this scope. Reads filter by `scope.workspaceId`; creates require the record workspace to equal the scope; updates cannot move a record between workspaces; deletes cannot affect a record outside the scope. Each method also requires the corresponding centralized demo capability.

## Application rules

- Do not add repository methods such as `getById(id)` for tenant-owned resources.
- SQL implementations must include the workspace predicate in the same parameterized statement as the resource ID and must not rely on a browser-provided workspace ID alone.
- Service methods must construct scope from authenticated identity plus server-resolved membership role.
- Cross-workspace misses should be indistinguishable from ordinary not-found results unless a product requirement explicitly says otherwise.
- The active-workspace preference is not an authorization source.

The current in-memory repository and source contract tests provide the pattern and negative coverage: workspace A cannot read, update, or delete workspace B’s record, and unsafe unscoped lookup signatures are rejected. Resource-specific database repositories will adopt this interface as demo persistence is introduced.
