# SECURITY REVIEW REQUEST — TASK-021

## Change summary

- Added the `@supademo/auth` identity-provider abstraction.
- Added fixture-backed local/test identity verification that refuses staging and production construction.
- Added a production/staging Cognito adapter contract with injected signature/JWKS verification and issuer/audience/expiry/token-use validation.
- Added bounded bearer-token request middleware, generic 401 normalization, opaque session model helpers, and a Node API adapter.
- Added typed auth configuration with local defaults and production Cognito requirements.

## Files changed

- `packages/auth/package.json`
- `packages/auth/tsconfig.json`
- `packages/auth/src/index.ts`
- `apps/api/src/auth-middleware.ts`
- `apps/api/package.json`
- `apps/api/tsconfig.json`
- `packages/config/src/index.ts`
- `tests/auth.test.mjs`
- `tests/config.test.mjs`
- `scripts/check-boundaries.mjs`
- `.env.example`
- `package-lock.json`
- `docs/authentication.md`
- `docs/configuration.md`
- `docs/reviews/TASK-021-security-handoff.md`

## Trust boundaries and sensitive data affected

This task introduces the authentication trust boundary for future protected routes. Bearer tokens are untrusted network input. Provider verification output is treated as untrusted until normalized claim validation completes. The package does not persist tokens, log tokens, expose provider errors, or make workspace authorization decisions. No existing API route was converted to authenticated behavior in this task.

## Authorization model

The identity provider establishes a normalized caller identity only. Workspace membership, roles, permissions, tenant scope, and action authorization remain server-side responsibilities for later tasks. The API adapter returns an authenticated request context but does not authorize a resource or operation.

## Threats considered

- Local fixture auth accidentally enabled in staging or production.
- Malformed, expired, future-issued, wrong-issuer, wrong-audience, wrong-token-use, or structurally invalid tokens.
- Missing, duplicated, malformed, oversized, or non-Bearer authorization headers.
- Provider/JWKS failures leaking sensitive SDK or key details.
- Confusing Cognito ID tokens with access tokens.
- Session identifiers becoming unbounded or remaining active after expiry.
- Implementing custom JWT signature logic that diverges from Cognito verification.
- Treating identity claims as workspace authorization evidence.

## Security controls implemented

- `LocalIdentityProvider` requires `local` or `test` environment and explicitly supplied fixture tokens; there is no default user or token.
- `CognitoIdentityProvider` requires an HTTPS issuer, bounded audience, injected signature verifier, `token_use=access`, exact issuer, matching `aud`/`client_id`, integer expiry, and bounded subject.
- Bearer parsing accepts one bounded `Authorization` header and rejects malformed or multiple values.
- Middleware revalidates normalized identities and maps all provider failures to generic 401 errors.
- Local fixture lookup uses constant-time comparison for equal-length tokens and does not include token values in errors.
- Session IDs are opaque, bounded, frozen in the returned session record, and checked against expiry.
- Auth configuration rejects `AUTH_PROVIDER=local` outside local/test and requires HTTPS Cognito issuer plus audience in staging/production.
- No custom JWT parsing or cryptographic signature verification is implemented; deployment code must supply the reviewed Cognito JWKS verifier.

## Security tests added

- `tests/auth.test.mjs` covers local-production rejection, valid local identities, invalid local tokens, valid Cognito claims, malformed/expired/wrong issuer/wrong audience/wrong token-use claims, signature failures, bearer parsing, generic provider error handling, API adaptation, and session expiry.
- `tests/config.test.mjs` covers local auth defaults and production Cognito configuration values.

## Checks run and results

- `npm run build` — passed; auth package, API adapter, API contract, generated web types, and web build completed.
- `node --test tests/auth.test.mjs` — 5 passed.
- `npm test` — 67 total; 66 passed and 1 expected integration test skipped because local dependency environment variables were absent.
- `npm run verify` — passed: formatting, ESLint, workspace boundaries, and TypeScript checks.
- `npm audit --audit-level=high` — passed; 0 vulnerabilities reported.
- No new third-party dependency, IAM action, cloud resource, or credential was added. The workspace lockfile/link metadata was refreshed for the new internal package.

## Checks not run

- Live Cognito issuer/JWKS retrieval, key rotation, signature algorithm enforcement, and production cookie/session integration were not run because AWS credentials and a deployed Cognito user pool are not present. The deployment adapter must run those integration tests before production authentication is enabled.
- No authenticated route was wired to the API yet; tenant authorization and cross-workspace negative tests belong to later tasks.
- Independent Claude review has not yet been performed.

## Known limitations and residual risks

- The Cognito signature verifier is an explicit contract only; a future deployment implementation must validate JWKS key IDs, algorithm allowlists, issuer, audience, expiry, and key rotation without logging tokens or claims unnecessarily.
- Sessions are a model and validation helper only; secure cookie attributes, refresh-token rotation, revocation, storage, CSRF, sign-in, and recovery are deferred to TASK-022.
- Identity validation does not authorize workspace access. Every protected repository and route must add tenant-scoped permission checks.
- `AUTH_ISSUER` and `AUTH_AUDIENCE` are configuration values, not secrets; they must still be sourced through the approved AWS parameter boundary in production.

## Requested Claude review

Please independently inspect the full diff and surrounding code for token parsing, JWT/JWKS trust assumptions, issuer/audience/expiry validation, local-production separation, header ambiguity, provider-error leakage, session lifecycle, configuration-source confusion, dependency boundaries, and missing authentication/authorization negative tests. Classify findings as BLOCKER, HIGH, MEDIUM, LOW, or NOTE. Do not rely only on this summary.

### Status

Pending independent Claude review. Do not mark TASK-021 complete in `TASKS.md` until BLOCKER/HIGH findings are resolved or explicitly accepted by an authorized human.
