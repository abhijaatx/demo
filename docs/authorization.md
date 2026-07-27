# Centralized authorization

TASK-027 defines capability-based policy checks shared by domain and persistence code. The server is authoritative; the `capabilities` array returned to the UI is only a presentation hint.

## Capability matrix

| Role             | Capabilities                                                                                       |
| ---------------- | -------------------------------------------------------------------------------------------------- |
| Owner            | All workspace, member, demo, publish/share/export, and analytics capabilities                      |
| Admin            | Workspace read/update; member read/invite/update/remove/leave; all demo and analytics capabilities |
| Editor / Creator | Workspace read; member read/leave; demo read/create/update/publish/share/export; analytics read    |
| Viewer           | Workspace read; member read/leave; demo read; analytics read                                       |
| Guest            | Demo read only                                                                                     |

The domain exposes `can`, `requireCapability`, and `requireWorkspaceCapability`. A workspace authorization context must match the requested workspace before the role capability is evaluated. Unknown or missing capabilities fail closed with a generic 403 error.

## Integration rules

- Repository methods must authorize the capability needed for the operation before reading or mutating tenant records.
- API handlers may use capability hints for disabled states and navigation visibility, but they must still call the server-authoritative policy path.
- A browser-selected workspace never grants access by itself; membership and role are resolved server-side.
- New demo, analytics, sharing, export, and member endpoints must use the centralized policy functions rather than adding route-local role conditionals.

The current role names preserve the workspace schema’s `owner`, `admin`, `editor`, and `viewer` values. “Creator” is the product-facing label for the editor creation capability; it is not a separate persisted role.
