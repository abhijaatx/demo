SECURITY REVIEW REQUEST

Change summary:

- Made `APP_ENV` and `CONFIG_SOURCE` mandatory so an omitted deployment environment cannot start as local with local service defaults and local authentication.
- Replaced the account-menu redirect-only sign-out action with the established CSRF-protected auth-client sign-out request, followed by navigation to `/auth` only after success.
- Added regression coverage for omitted configuration and for the shell using the authenticated sign-out path.

Files changed:

- packages/config/src/index.ts
- apps/web/components/app-shell.tsx
- tests/config.test.mjs
- tests/app-shell-overlays.test.mjs
- docs/reviews/browser-qa-security-remediation-handoff.md

Trust boundaries and sensitive data affected:

- Service bootstrap configuration determines runtime environment, credential source, local authentication availability, and local database/cache/object-storage endpoints.
- The account-menu action operates on the cookie-authenticated session and CSRF token. The server revokes the opaque session and expires its cookie through `POST /api/v1/auth/sign-out`.

Authorization model:

- `APP_ENV=local|test` must be explicitly supplied before local fallbacks can be used. Staging and production continue to require the AWS configuration source.
- Sign-out uses the established browser auth client, which sends credentials and the validated CSRF token. The server revokes the existing session and expires its cookie; a client redirect alone is not treated as logout.

Threats considered:

- A staging or production deployment omitting environment variables silently booting with local authentication and local defaults.
- A user believing their session ended after a UI redirect while its server-side session and cookie remain valid.
- CSRF-protected logout failures being hidden from the user.

Security controls implemented:

- Configuration parsing fails closed when `APP_ENV` or `CONFIG_SOURCE` is absent.
- Local credentials and endpoints remain available only after explicit `APP_ENV=local|test` selection.
- The account menu calls `createAuthClient().signOut()`, which uses the repository's credential and CSRF handling, and displays an error without redirecting when revocation fails.

Security tests added:

- `tests/config.test.mjs`: asserts omitted runtime environment and configuration source cause a `ConfigurationError` that identifies both missing settings.
- `tests/app-shell-overlays.test.mjs`: asserts the shell uses the auth client sign-out path, routes to `/auth` after success, exposes a failure message, and does not use the redirect-only implementation.

Checks run and results:

- `npm run verify` — passed (format check, lint, workspace boundary check, TypeScript checks).
- `npm test` — passed: 394 tests passed, 1 integration test skipped because `.env` was absent.
- `npm audit --audit-level=high` — still fails with 3 high-severity advisories in the current latest Next release's bundled `postcss@8.4.31` and optional `sharp@0.34.5`. Root overrides updated `brace-expansion` to `5.0.8` and `js-yaml` to `4.3.0`, removing four prior high findings.

Checks not run:

- Browser logout end-to-end test against a running local API stack — not run because `npm run stack:up` could not connect to the local Docker daemon. Remaining risk: the UI-to-server integration was build- and test-covered, but not exercised against a live cookie session in this review. Run `npm run stack:up`, start the API with `APP_ENV=local CONFIG_SOURCE=env npm run start:api`, and then verify sign-in/sign-out in a browser after Docker is available.

Dependencies or infrastructure permissions added:

- None.

Known limitations and residual risks:

- The audit's three high-severity Next dependency advisories remain unresolved and block release under `AGENTS.md`. `next@16.2.12` is the latest registry release, and `npm audit fix --force` proposes an unrelated downgrade to `next@9.3.3`; resolving them requires an upstream update, an alternative framework decision, or an authorized, time-bounded risk acceptance.
- The added shell regression test follows the repository's current source-contract test style. Live browser session revocation still requires local-stack verification.

Please review the full diff and surrounding code for OWASP Top 10, tenant isolation,
authentication/authorization, input validation, XSS, SSRF, injection, upload safety,
secret exposure, privacy, dependency risk, insecure cloud configuration, and missing
negative tests. Classify findings as BLOCKER, HIGH, MEDIUM, LOW, or NOTE.
