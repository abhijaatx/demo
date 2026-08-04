SECURITY REVIEW REQUEST

Change summary:

- Repaired the shared `/auth` account-creation and sign-in flow so successful local account creation and login redirect to `/home`.
- Added bounded client-side validation for email, password, verification-code, and reset-password inputs before any API request or staged signup transition.
- Normalized email and verification-code values before submission, cleared sensitive form state when returning to sign-in, and exposed the existing reset-code path.
- Added stable handling for network failures and bounded public API error messages in the browser auth client.
- Preserved the existing dedicated `/signup` surface, CSRF-protected client requests, HttpOnly session model, and server-side authorization behavior.

Files changed:

- `apps/web/components/auth-screen.tsx`
- `apps/web/src/lib/auth-client.ts`
- `tests/auth-screen.test.mjs`

Trust boundaries and sensitive data affected:

- Browser auth forms accept untrusted email addresses, passwords, verification codes, and reset-password values.
- The browser client sends credentialed requests through the same-origin Next rewrite to the API and receives only bounded public responses; the session remains in the server-controlled HttpOnly cookie.
- The per-session CSRF token remains in the established client mechanism for session refresh, sign-out, and other cookie-authenticated mutations. Public account operations retain the existing server policy for fresh sessions.
- Passwords and reset codes are held only in React state long enough to submit and are cleared when the user returns to sign-in; they are not rendered into markup, URLs, logs, or analytics.

Authorization model:

- The API's `AuthWorkflowService` and configured identity provider remain authoritative for account creation, email verification, sign-in, recovery, password reset, session issuance, and authorization errors.
- The browser only chooses which established workflow operation to call; client validation does not grant access or replace server validation.
- Successful sign-in/account creation receives the server-issued session and routes to `/home`; all protected workspace authorization remains server-side and tenant-scoped.

Threats considered:

- Malformed, oversized, or control-character input reaching auth endpoints.
- Accidental submission of invalid staged-signup data or reset codes.
- Credential and account-enumeration leakage through client errors, URLs, DOM, or logs.
- XSS through API-provided error text or proof-panel content.
- Network failures and non-JSON/proxy responses leaving the form stuck or exposing upstream details.
- Login/signup navigation that appears successful without establishing the server session.

Security controls implemented:

- Email is trimmed, bounded to 254 characters, and checked against a conservative address shape; passwords are bounded to 8–128 characters and reject CR/LF; verification codes are bounded to 4–12 digits.
- Input validation runs before API calls and before the dedicated signup flow advances from email to password.
- Auth client responses are parsed as text, public error messages are accepted only from a bounded `error.message` field (maximum 240 characters), and malformed/non-JSON responses fall back to stable generic errors.
- Requests continue to use `credentials: "include"`, `cache: "no-store"`, and the existing CSRF header behavior.
- Static proof-panel assets use fixed reviewed URLs, empty alt text where decorative, and `referrerPolicy="no-referrer"`; no user-controlled URL or HTML is rendered.

Security tests added:

- `tests/auth-screen.test.mjs` covers bounded validation messages, staged signup transitions, reset-code recovery reachability, bounded API error parsing, network-failure handling, login alias wiring, and unsafe-DOM exclusions.
- Existing `tests/auth.test.mjs` and API tests cover provider failures, rate limits, enumeration-resistant recovery, session issuance/revocation, CSRF, and production/local provider boundaries.
- Browser smoke checks covered `/auth` account creation, successful login redirect, invalid credentials, `/signup` validation, staged signup completion, and the same flow from `http://10.2.13.175:3000`.

Checks run and results:

- `npx prettier --write apps/web/components/auth-screen.tsx apps/web/src/lib/auth-client.ts tests/auth-screen.test.mjs` — passed.
- `node --test --test-name-pattern='auth|workflow|local account' tests/auth-screen.test.mjs tests/auth.test.mjs` — 9 passed, 7 skipped by name filter, 0 failed.
- `npm run verify` — passed (format check, ESLint, boundary check, and typecheck).
- `npm test` — passed with port binding enabled: 436 passed, 1 skipped, 0 failed.
- `npm audit --omit=dev --audit-level=high` — passed; 0 vulnerabilities reported.
- `npm run security:placeholders` — passed; deferred SAST/container/IaC scanner placeholders are documented by the repository.
- `git diff --check` — passed.
- Impeccable detector — only pre-existing global CSS warnings (side-tab borders, Arial, and the legacy tiled grid) were reported; no auth-specific finding was emitted.

Checks not run:

- Gitleaks, Semgrep/CodeQL, container-image scanning, and infrastructure-policy scanning were not available as configured commands in this environment; CI or Claude should run them before release.
- Production Cognito/SES integration, durable distributed session storage, and real email delivery were not exercised because this verification uses the local provider and local API stack.
- An independent Claude review has not yet been performed; this handoff is not an approval or a claim that the implementation is vulnerability-free.

Dependencies or infrastructure permissions added:

- None.

Known limitations and residual risks:

- The local identity provider stores accounts and sessions in memory and intentionally auto-verifies accounts with a local-only provider; process restart clears local accounts. Production must continue to inject a managed identity provider and durable shared session store.
- Google, Microsoft, and SSO buttons on the reference signup surface remain explicit unavailable-state controls because no provider integrations are configured in this local environment.
- Existing upstream dependency and deployment risks outside this auth UI change remain subject to their prior handoffs and release gates.

Please review the full diff and surrounding code for OWASP Top 10, tenant isolation,
authentication/authorization, input validation, XSS, SSRF, injection, upload safety,
secret exposure, privacy, dependency risk, insecure cloud configuration, and missing
negative tests. Classify findings as BLOCKER, HIGH, MEDIUM, LOW, or NOTE.
