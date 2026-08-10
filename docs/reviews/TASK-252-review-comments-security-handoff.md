# TASK-252 security handoff: internal and external comments

SECURITY REVIEW REQUEST

Change summary:

- Added a review route with internal and external comment modes.
- Reused the existing CommentsPanel for threaded replies, editing, deletion, emoji reactions, filtering, and resolve/reopen actions.
- Added a bounded in-browser client so the documented interactions can be exercised without a network request.

Files changed:

- apps/web/app/comments/page.tsx
- apps/web/components/review-comments-workbench.tsx
- apps/web/components/editor-shell.tsx
- apps/web/app/globals.css
- tests/review-comments-workbench.test.mjs
- tests/editor-capture-entry.test.mjs

Trust boundaries and sensitive data affected:

- Comment text, mentions, reactions, and viewer feedback are untrusted collaborative input.
- The review route uses local memory only; the existing authenticated client/API is the production trust boundary.

Authorization model:

- The local route intentionally has no server authorization because it is an interaction preview and stores data only in memory.
- Production CommentsPanel calls the authenticated `/api/v1/workspaces/{workspaceId}/comments` contract with credentials included; the API authenticates the user and repository scopes reads/writes by workspace, target, and actor permissions.

Threats considered:

- Cross-workspace comment access or an attacker changing workspace/target IDs.
- Stored XSS in comment text or mentions.
- Unauthorized resolve, edit, delete, reaction, or reply operations.
- Duplicate comment creation during retries.
- External comments being confused with private internal threads.

Security controls implemented:

- Existing production client preserves credentialed requests and idempotency keys for creates.
- Existing domain/API validation bounds comment content, IDs, mentions, and emojis and rejects unknown fields.
- UI renders comment content as text, not HTML.
- Internal and external scopes use separate target IDs in the local preview and explicit audience labels.
- The local client keeps data in an in-memory map and never sends it over the network.
- No new dependencies or permissions.

Security tests added:

- tests/review-comments-workbench.test.mjs verifies internal/external modes and the full panel interaction surface without unsafe DOM APIs.
- Existing comment-client, API comment, authorization, and domain validation tests cover the production path.

Checks run and results:

- npm run format:check — passed.
- npm run verify — passed (format, lint, workspace boundaries, and typecheck).
- node --test tests — passed (499 passed, 1 skipped).
- npm run build — passed (Next.js production build, including /comments).
- npm audit --omit=dev --audit-level=high — passed (0 vulnerabilities).
- Browser route verification — passed internal/external tabs, unresolved/all filtering, external comment creation, and rendered thread states.

Checks not run:

- Live authenticated cross-tenant comment API tests were not run in the in-app browser because no authenticated workspace session was available. Run the protected API integration and workspace-A/workspace-B negative tests before release.

Dependencies or infrastructure permissions added:

- None.

Known limitations and residual risks:

- The local preview must never be used as evidence that production authorization works; it exists only to demonstrate the interaction contract.
- The current panel shows abbreviated author IDs. Production identity display and privacy policy should be reviewed with the workspace profile model.

Please review the full diff and surrounding code for OWASP Top 10, tenant isolation,
authentication/authorization, input validation, XSS, SSRF, injection, upload safety,
secret exposure, privacy, dependency risk, insecure cloud configuration, and missing
negative tests. Classify findings as BLOCKER, HIGH, MEDIUM, LOW, or NOTE.
