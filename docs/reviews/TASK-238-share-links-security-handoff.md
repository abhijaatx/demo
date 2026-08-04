# Security review request — TASK-238 share links

## Change summary

- Added bounded trackable share-link labels using the `ref` query parameter.
- Added one-based `step` deep links and viewer URL updates as viewers navigate.
- Added selectable expiring links with opaque browser-generated tokens and a fail-closed viewer check.
- Preserved existing query parameters when composing share-link variants.

## Files changed

- `packages/domain/src/share-link.ts`
- `packages/domain/src/index.ts`
- `apps/web/components/editor-shell.tsx`
- `apps/web/components/demo-viewer.tsx`
- `apps/web/app/globals.css`
- `tests/share-link.test.mjs`
- `tests/editor-share-link.test.mjs`

## Trust boundaries and sensitive data affected

- Creator-entered tracking labels become URL query parameters and viewer analytics attributes.
- Share tokens and expiry timestamps are accepted from public viewer URLs.
- The current local/demo implementation stores expiring-link records in browser `localStorage`; no production secret or customer data is added.

## Authorization model

- Publishing and creating expiring links require the existing editor write path and are disabled for read-only editors.
- Viewer step links remain subject to the existing published-document resolution.
- Expiring links require a valid bounded token, a valid expiry timestamp, a non-expired window, and a matching local record; missing or malformed records fail closed.
- A production implementation must move token issuance, tenant scoping, revocation, and expiry enforcement to the server before external release.

## Threats considered

- Reflected XSS or open redirects through tracking labels and query parameters.
- Token tampering, malformed timestamps, expired links, and replay of deleted local records.
- Cross-tenant or cross-demo link reuse.
- URL composition accidentally dropping or overwriting existing access parameters.
- Oversized step/label/token values and unsafe characters.

## Security controls implemented

- Allowlisted/bounded labels, step numbers, token shape, and expiry timestamp parsing.
- URL construction uses `URL`/`URLSearchParams`; no HTML or script sinks are used.
- Viewer checks expiry before rendering and fails closed when the local token record is unavailable.
- Browser storage is bounded to the latest 50 records.
- Existing query parameters are preserved unless the caller explicitly changes that parameter.

## Security tests added

- `tests/share-link.test.mjs` covers expiry calculation/parsing, label sanitization, invalid values, token/step bounds, and composed-link parameter preservation.
- `tests/editor-share-link.test.mjs` verifies the editor and viewer expose the security-critical controls and enforcement paths.

## Checks run and results

- `npm run format` — passed.
- `npx tsc --build` — passed.
- `node --test tests/share-link.test.mjs tests/editor-share-link.test.mjs` — 5 passed.
- `npm run verify` — passed (format, lint, workspace boundaries, and typecheck).
- `npm run build` — passed (API contract/types and Next.js production build).
- `npm test` — 472 passed, 1 optional API integration skipped, 0 failed (473 total).
- `npm audit --omit=dev --audit-level=high` — 0 vulnerabilities.
- `git diff --check` — passed.

## Checks not run

- Claude security review is not available in this environment; an independent review remains required before production release.
- The local browser test harness uses isolated tab storage, so cross-tab success of the browser-only expiring-link fallback could not be demonstrated; the viewer correctly rejects unavailable records.

## Dependencies or infrastructure permissions added

- None.

## Known limitations and residual risks

- Expiring-link records are local-only and therefore are not shareable across devices or browser storage partitions. They are a development fallback, not production access control.
- Before production, implement a server-backed, tenant-scoped opaque token record with short-lived expiry, revocation, rate limits, audit events, and authorization checks. Do not accept a client-supplied future expiry as proof of access.
- Trackable `ref` values are attribution metadata, not authorization evidence, and should be redacted from sensitive logs.

Please review the full diff and surrounding code for OWASP Top 10, tenant isolation,
authentication/authorization, input validation, XSS, SSRF, injection, upload safety,
secret exposure, privacy, dependency risk, insecure cloud configuration, and missing
negative tests. Classify findings as BLOCKER, HIGH, MEDIUM, LOW, or NOTE.
