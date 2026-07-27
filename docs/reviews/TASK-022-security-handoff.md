# TASK-022 security handoff

Status: pending independent Claude review.

## Scope reviewed

TASK-022 adds the provider-neutral account workflow contract and the accessible web account screen for sign-up, email verification, sign-in, sign-out, password recovery, password reset, and session refresh.

Primary files:

- `packages/auth/src/index.ts` — workflow service, provider-operation errors, input validation, rate-limit contracts, and session-cookie policy.
- `apps/api/src/app.ts` — bounded JSON auth route adapter for the workflow service.
- `apps/web/src/lib/auth-client.ts` — browser API client with credentialed, no-store requests and generic error handling.
- `apps/web/components/auth-screen.tsx` and `apps/web/app/auth/page.tsx` — labeled native forms and account flow UI.
- `apps/web/app/globals.css` — restrained account-screen layout styles.
- `tests/auth.test.mjs` and `tests/auth-screen.test.mjs` — workflow, policy, and source-level safety coverage.
- `docs/authentication.md` — provider and deployment boundary documentation.

## Security properties

- Provider-specific failures are mapped to generic public errors; sign-up and password recovery do not disclose account existence.
- Passwords are validated at the workflow boundary and are not logged, persisted, placed in URLs, or interpolated into HTML.
- Verification and recovery codes are bounded numeric input and are not reflected into markup.
- Every account operation is rate-limited before provider invocation. The in-memory implementation is bounded and explicitly documented as local/test-only; production needs a shared store.
- Production session-cookie defaults are `__Host-supademo_session`, `HttpOnly`, `Secure`, `SameSite=Lax`, `Path=/`, with a bounded max age. Local/test uses a separate cookie name and permits HTTP only for development.
- The browser client uses `credentials: include` and `cache: no-store`; the account page is `noindex`/`nofollow`.
- The UI uses native form submission, associated labels, accessible error/status semantics, and no raw HTML execution path.
- The implementation delegates password storage, email delivery, and token cryptography to the configured identity provider rather than adding custom cryptography.

## Verification performed

Run from the repository root:

```text
node --test tests/auth.test.mjs tests/auth-screen.test.mjs
npm test
npm run verify
npm run build
npm audit --audit-level=high
```

Final results:

- `node --test tests/auth.test.mjs tests/auth-screen.test.mjs`: 9 passed.
- `npm test`: 72 total, 71 passed, 1 expected integration test skipped because local database/Redis variables were not configured.
- `npm run verify`: passed formatting, lint, workspace boundaries, and type checks.
- `npm run build`: passed; the web build includes `/auth`.
- `npm audit --audit-level=high`: 0 vulnerabilities.

The targeted tests cover provider error mapping, enumeration resistance, rate limits, cookie policy, browser-client request policy, and the accessible screen contract. The API integration test exercises successful and failed auth workflow requests over HTTP; the repository-wide suite covers all prior tasks as well.

## Boundaries requiring follow-up

- Live Cognito, SES, JWKS rotation, and deployed cookie behavior were not exercised locally.
- A browser runner is not configured in this workspace, so full browser E2E, screen-reader, and cross-browser checks were not run.
- The API route adapter is present, but concrete Cognito/SES provider wiring, shared production rate-limit storage, CSRF enforcement, refresh-token rotation, session persistence, and protected-route authorization must be completed before production launch.
- This handoff is not a claim that the system is vulnerability-free. Independent Claude review must inspect the final diff and verification output before TASK-022 is marked complete.

## Claude review checklist

- [ ] Confirm no password, reset code, bearer token, or provider secret is logged or included in an exception/response.
- [ ] Confirm all account-operation routes use the workflow service and shared rate limiting.
- [ ] Confirm production wiring supplies Cognito/SES, shared rate-limit storage, secure cookie handling, CSRF protection, and session rotation.
- [ ] Confirm generic responses remain identical for existing and non-existing accounts.
- [ ] Confirm the final build, tests, verification, and dependency audit results are attached to the review.
