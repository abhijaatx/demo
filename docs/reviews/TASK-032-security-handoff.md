# SECURITY REVIEW REQUEST — TASK-032

## Change summary

- Added the `/demos` dashboard route with workspace-scoped live demo loading, responsive grid/list views, URL-backed search/sort/view/page state, 20-item rendering pages, demo cards, placeholder thumbnails, and pagination.
- Added one clear primary action, **Create demo**, with a bounded metadata/capture-type modal that calls the existing idempotent draft-creation API.
- Updated shell and home links to make Demos the real primary navigation destination and refresh dashboard data safely after a workspace change.

## Files changed

- `apps/web/src/lib/demo-client.ts`
- `apps/web/components/demo-dashboard-screen.tsx`, `apps/web/components/app-shell.tsx`
- `apps/web/app/demos/page.tsx`, `apps/web/app/page.tsx`, `apps/web/app/globals.css`
- `tests/demo-dashboard-screen.test.mjs`, `tests/app-shell.test.mjs`

## Trust boundaries and sensitive data affected

- Browser-provided workspace identifiers, URL view/sort/page values, user-entered demo title/description/capture type, cookie-authenticated API responses, and current-workspace changes.
- The dashboard renders API text through React elements only; it does not render rich HTML, remote assets, or user-controlled URLs.

## Authorization model

- The browser client always sends the selected workspace ID as a URL component; the server-side TASK-031 repository is authoritative for workspace membership, tenant scope, and `demo:*` capabilities.
- The dashboard uses returned `demo:create` capability only to disable/hide creation affordances. The API still independently enforces permission.
- A workspace-change event clears resident dashboard data before the new workspace is loaded, preventing prior-workspace cards from being presented while a switch is in progress.

## Threats considered

- Cross-workspace cache leakage after a workspace switch.
- UI-only authorization bypass for draft creation.
- CSRF against cookie-authenticated demo creation.
- Malformed/untrusted API response data rendered as a dashboard card.
- XSS through demo title/description or query-string view/sort/page values.
- Excessive rendering work with a 1,000-demo workspace.

## Security controls implemented

- `credentials: include`, `cache: no-store`, `X-CSRF-Token` on mutations, `Idempotency-Key` on create, and URL encoding for workspace identifiers.
- Strict browser-side response-shape checks reject invalid types/statuses and soft-deleted records before rendering.
- Query parameters are allowlisted (`grid`/`list`, defined sort values, a 200-character local search term, bounded numeric page); unknown values fall back to safe defaults.
- React text rendering and decorative local thumbnail components avoid unsafe HTML and remote media.
- Rendering is bounded to 20 sorted cards per page, and workspace transition resets the in-memory set before reloading.

## Security tests added

- Dashboard source checks cover primary navigation, route metadata, loading/error/permission/empty states, URL-backed view and sort controls, pagination, workspace reset, responsive CSS, and no unsafe DOM execution.
- Browser client source checks cover cookie/CSRF policy, idempotent creation, encoded workspace IDs, strict response validation, and no browser-exposed secrets.
- Existing API/domain tests continue to cover authenticated, tenant-scoped demo CRUD and permissions.

## Checks run and results

```text
npm run verify
Result: passed (format, lint, workspace boundaries, TypeScript, and web type generation).

npm run build
Result: passed; /demos route, API contract, generated client, and production web build completed.

npm test
Result: passed: 107 tests passed; 1 integration test skipped because local DATABASE_URL/REDIS_URL are not configured.

npm run security:placeholders
Result: passed; deferred SAST, container, and IaC scanner placeholders remain documented.

npm audit --audit-level=high
Result: failed with 7 high-severity upstream dependency findings in the pinned Next.js/OpenAPI toolchain; this remains a release blocker.

Browser visual inspection
Result: inspected the desktop `/demos` loading shell at 1280px width. The skeleton aligns with the final three-column card structure and the Demos navigation state is active. A short-lived fixture made populated endpoints reachable, but this browser session did not hydrate client fetches, so populated/modal interaction could not be inspected in-browser; the compiled functional paths are covered by tests.
```

## Checks not run

- Database integration tests require a configured local PostgreSQL/Redis stack and `.env`. Run `npm run stack:up && npm run db:migrate && npm run test:integration`.
- Secret scanning, Semgrep/CodeQL, container scanning, IaC scanning, and dynamic staging testing do not have configured repository commands. Risk: findings outside the checked code paths may remain undetected.

## Dependencies or infrastructure permissions added

- No package, runtime service, cloud permission, secret, IAM action, or external data transfer was added.

## Known limitations and residual risks

- This milestone intentionally uses metadata placeholder thumbnails; validated media thumbnails arrive with the asset pipeline and must keep the current no-remote-content default.
- Folders, tags, server-side pagination, and advanced filtering are planned in subsequent dashboard tasks. The current title/description search is local to the already tenant-scoped response; server-indexed search arrives with the dedicated search task. The 20-item page bounds browser rendering for the 1,000-record quality target.
- The documented upstream high-severity dependency findings from TASK-029 remain unresolved and block release unless remediated or explicitly accepted by an authorized human.

Please review the full diff and surrounding code for OWASP Top 10, tenant isolation,
authentication/authorization, input validation, XSS, SSRF, injection, upload safety,
secret exposure, privacy, dependency risk, insecure cloud configuration, and missing
negative tests. Classify findings as BLOCKER, HIGH, MEDIUM, LOW, or NOTE.

## Status

Pending independent Claude review. Do not mark TASK-032 complete in `TASKS.md` until BLOCKER/HIGH findings are resolved or explicitly accepted by an authorized human.
