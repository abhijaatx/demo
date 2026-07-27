# TASK-023 security handoff

Status: pending independent Claude review.

## Scope reviewed

TASK-023 adds the local user/profile model, idempotent identity reconciliation, authenticated profile API routes, and the profile settings screen.

Primary files:

- `packages/database/migrations/2026071200200_user_profiles.sql` — profile table, foreign key, URL/timezone/JSON constraints, and bounded preferences storage.
- `packages/domain/src/profile.ts` — profile types and shared input validation.
- `packages/database/src/users.ts` — parameterized transactional user synchronization and profile updates.
- `packages/auth/src/index.ts` — optional validated email claim carried through identity normalization.
- `apps/api/src/app.ts` and `apps/api/src/openapi.ts` — authenticated `GET/PATCH /api/v1/me/profile` adapter and contract.
- `apps/web/src/lib/profile-client.ts`, `apps/web/components/profile-settings-screen.tsx`, and `apps/web/app/settings/profile/page.tsx` — credentialed client and accessible settings UI.
- `tests/profile.test.mjs`, `tests/profile-screen.test.mjs`, and `tests/api.test.mjs` — validation, repository, UI-contract, and HTTP authorization coverage.

## Security properties

- Profile ownership is derived from the authenticated identity subject. No client-provided user ID, email, or identity subject selects the target record.
- Unauthenticated profile reads and writes return 401 before repository access.
- Identity synchronization is transactional and idempotent with unique database constraints for identity subject and email.
- SQL values are parameterized; user-controlled subjects and emails are never interpolated into query text.
- Display names, timezones, avatar URLs, and preferences have length, character, scheme, and allowlist validation. Unknown preference keys are rejected.
- Avatar URLs must be HTTPS and are not fetched or proxied by the server.
- Preferences are constrained to a small object and database storage is capped at 16 KiB.
- Identity-provider email claims are optional at the general auth layer but required by the profile boundary; malformed claims are rejected during token normalization.
- The UI uses native labeled controls, read-only email display, generic errors, loading/denied/saving states, and no raw HTML or dynamic code execution.
- Profile settings are not indexed by search engines.

## Verification performed

Focused command:

```text
node --test tests/profile.test.mjs tests/profile-screen.test.mjs tests/api.test.mjs
```

Final repository results:

```text
npm test: 78 total, 77 passed, 1 expected integration test skipped because DATABASE_URL/REDIS_URL were not configured.
npm run verify: passed formatting, lint, workspace boundaries, and type checks.
npm audit --audit-level=high: 0 vulnerabilities.
```

The production build passed and includes `/settings/profile`. The focused suite covers unsafe URL/timezone/preferences, idempotent synchronization, generic repository failures, unauthenticated access, identity-subject binding, valid updates, invalid unknown fields, and profile UI states.

## Boundaries requiring follow-up

- The production identity provider and API server composition still need to inject a real Cognito verifier and a trusted email-claim/provider lookup.
- Live PostgreSQL migration execution and concurrent identity-reconciliation testing require the local database stack; those were not run unless the environment was configured.
- Account deletion, provider-side deletion, workspace membership/ownership transfer, audit-log retention, and dependent-data cleanup remain future work. The profile table’s cascade is not a complete account-deletion workflow.
- A browser runner is not configured in this workspace, so full browser E2E, screen-reader, and cross-browser checks were not run.
- This handoff is not a claim that the implementation is vulnerability-free. Independent Claude review must inspect the final diff and verification output before TASK-023 is marked complete.

## Claude review checklist

- [ ] Confirm every profile query is scoped by authenticated identity subject and no IDOR path exists.
- [ ] Confirm identity email claims are trusted only after provider signature/claim validation.
- [ ] Confirm avatar URLs cannot use script/data/HTTP schemes and are never server-fetched.
- [ ] Confirm preferences and profile fields remain bounded at API, domain, and database layers.
- [ ] Confirm deletion implications and membership/audit retention are handled before account deletion ships.
- [ ] Confirm final build, tests, verification, migration checks, and dependency audit results are attached.
