# Workspace switching and onboarding

TASK-025 adds the first-run workspace path and a persisted current-workspace preference while keeping workspace data behind authenticated, server-side membership checks.

## User flow

- An authenticated user with no available workspace sees an explicit empty state linking to `/onboarding/workspace`.
- The onboarding form collects organization name, workspace name, and slug. The API normalizes and validates the values and creates the workspace transactionally.
- The shell loads the user-scoped workspace list and current selection. The switcher is a native, labelled `select`, so keyboard and mobile browser flows work without custom menu behavior.
- Selecting a workspace sends `PUT /api/v1/workspaces/current` and refreshes the route so server-rendered data is re-read for the new tenant.

## Current-workspace API

- `GET /api/v1/workspaces/current` returns the persisted selection when it is still a member selection.
- If the saved ID is stale or deleted, the API lists the authenticated user’s memberships, selects the first available workspace, persists that fallback, and returns it.
- If no workspace exists, the API returns a generic 404 and the UI presents onboarding.
- `PUT /api/v1/workspaces/current` accepts exactly `{ "workspaceId": "..." }`; the repository updates only a workspace where the authenticated user has membership.

The database stores `current_workspace_id` on the local user profile with `ON DELETE SET NULL`, preventing a deleted workspace from leaving an invalid foreign key. The browser never supplies a redirect destination; onboarding uses the fixed internal route `/` after successful creation.

## Safety boundaries

- Workspace lists and current-workspace reads are derived from the authenticated local user, not a browser-supplied user ID.
- The client uses `cache: "no-store"` for workspace reads and refreshes after switching to avoid displaying the previous tenant’s cached server data.
- The switcher has loading, unavailable, empty, and stale-selection recovery states.
- Route-level access control for future demo resources must continue to derive the active tenant from authenticated membership; the current-workspace preference is a navigation aid, not an authorization grant.

Browser automation was not run because this repository has no configured browser runner. Automated source/contract tests cover the route, fallback, safe redirect, accessibility labels, and no-unsafe-HTML requirements.
