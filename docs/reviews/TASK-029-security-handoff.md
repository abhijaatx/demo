# SECURITY REVIEW REQUEST — TASK-029

## Change summary

- Added bounded opaque server-side browser sessions with active lookup and revocation by session or subject.
- Issued `HttpOnly`, `SameSite=Lax`, environment-appropriate session cookies only when a session store is supplied; browser responses expose only a CSRF token, never identity claims or access tokens.
- Required a matching CSRF token for all unsafe requests that carry a valid session cookie, while retaining bearer-token support for API/extension clients.
- Added exact CORS-origin configuration, validated preflight methods/headers, and restrictive API security headers.
- Bounded server-side session lifetime to the cookie policy lifetime; sign-out revokes the server session and expires the cookie.
- Upgraded Next.js from `16.2.10` to `16.2.12` and PostCSS from `8.5.17` to `8.5.23` at the workspace root.

## Files changed

- `packages/auth/src/index.ts`
- `apps/api/src/app.ts`
- `apps/api/src/index.ts`
- `apps/web/src/lib/auth-client.ts`
- `packages/config/src/index.ts`
- `apps/web/package.json`, `package.json`, `package-lock.json`, `.env.example`
- `docs/authentication.md`
- `tests/auth.test.mjs`, `tests/api.test.mjs`, `tests/config.test.mjs`, `tests/memberships.test.mjs`

## Trust boundaries and sensitive data affected

- Browser cookies, CSRF tokens, verified identity claims held only in a server-side store, browser origins, CORS preflights, and bearer-token API authentication.
- The session identifier is opaque; the CSRF token is returned only after a successful session-issuing sign-in/refresh response and is not placed in a cookie.
- `CORS_ALLOWED_ORIGINS` accepts 1–20 exact HTTP(S) origins and rejects wildcards, paths, duplicates, and non-HTTP schemes.

## Authorization model

- Protected routes authenticate either a verified bearer token or an active opaque session record.
- Existing server-side profile/workspace/membership authorization remains unchanged after identity resolution.
- Cookie-authenticated unsafe requests require the per-session CSRF token before handlers parse or mutate domain data.
- Bearer requests do not depend on cookie CSRF because they do not authenticate through ambient browser credentials.

## Threats considered

- Forged cross-origin requests and permissive CORS/preflights.
- CSRF against cookie-authenticated profile, workspace, membership, and auth mutations.
- Session fixation/replay after sign-in, refresh, sign-out, or subject-level revocation.
- Identity/token leakage in cookie values or authentication response bodies.
- Session lifetime exceeding the configured cookie lifetime.
- Malformed cookie values, unsupported origins, and unapproved request headers.

## Security controls implemented

- Exact origin allowlist, `Vary: Origin`, credentialed CORS only for approved origins, bounded preflight methods/headers, and no wildcard response.
- API CSP `default-src 'none'`, `X-Frame-Options: DENY`, `nosniff`, no-referrer policy, restrictive permissions policy, COOP, and CORP.
- Opaque server-side session store with bounded local/test implementation, expiry pruning, and revocation APIs.
- `HttpOnly`, `Secure` outside local/test, `SameSite=Lax`, path-rooted cookie policy; production uses the `__Host-` cookie name.
- Per-session CSRF secret, required on unsafe session-cookie requests; successful sign-in/refresh rotates the session ID and CSRF secret.
- Server-side session expiry is capped at the cookie-policy maximum.
- CORS configuration is sourced from AWS Parameter Store outside local/test.

## Security tests added

- Foreign browser origin is rejected without an allow-origin response.
- Allowed preflight succeeds only for allowlisted method/headers; an unapproved header is rejected.
- Cookie-authenticated mutation without a CSRF token is rejected and makes no update.
- Valid CORS origin plus CSRF token permits the intended update.
- Revoked session cookies cannot authenticate a read.
- Sign-in returns an `HttpOnly` cookie and CSRF token without serializing identity claims.
- Session store revocation by subject is covered.
- CORS config defaults and production parameter handling are covered.

## Checks run and results

```text
npm run verify
Result: passed (format, lint, workspace boundaries, TypeScript, web type generation).

npm test
Result: passed: 94 tests passed, 1 integration test skipped because local DATABASE_URL/REDIS_URL are not configured.

npm audit --audit-level=high
Result: 7 high findings remain; see the next section.
```

## Checks not run

- Integration tests against PostgreSQL/Redis: local services and `.env` were not configured; one test was skipped by design.
- Secret scanning, Semgrep/CodeQL, container scanning, IaC scanning, and dynamic staging testing were not available as configured repository commands.

## Dependencies or infrastructure permissions added

- No new runtime service, IAM permission, secret, or third-party data transfer.
- Next.js updated to `16.2.12`; root PostCSS updated to `8.5.23`.

## Known limitations and residual risks

- `InMemoryAuthSessionStore` is local/test-only. A shared durable store adapter must be supplied when multiple production API instances are enabled; the API does not issue a cookie unless a session store is injected.
- The current production entrypoint has not yet wired the Cognito workflow/provider or a shared session store, so its auth endpoints fail closed rather than providing production login.
- `npm audit --audit-level=high` still reports seven upstream dependency findings: Next.js `16.2.12` bundles `postcss@8.4.31` and optional `sharp@0.34.5`; the pinned `openapi-typescript@7.13.0` requires the vulnerable `@redocly/openapi-core@1.34.17` chain (`brace-expansion`/`js-yaml`). An attempted override to Redocly 2.x broke the generator because it imports non-exported 1.x paths, so it was reverted. These high findings require an authorized remediation/acceptance decision before release.

Please review the full diff and surrounding code for OWASP Top 10, tenant isolation,
authentication/authorization, input validation, XSS, SSRF, injection, upload safety,
secret exposure, privacy, dependency risk, insecure cloud configuration, and missing
negative tests. Classify findings as BLOCKER, HIGH, MEDIUM, LOW, or NOTE.

## Status

Pending independent Claude review. Do not mark TASK-029 complete in `TASKS.md` until BLOCKER/HIGH findings are resolved or explicitly accepted by an authorized human.
