SECURITY REVIEW REQUEST

Change summary:

- Added account analytics for Recent viewers and Recent accounts, bounded search/date controls, viewer journeys, account journeys, lead activity, and viewer-to-account navigation.
- Added the `/account-analytics` route and editor entry point.

Files changed:

- apps/web/components/account-analytics-workbench.tsx
- apps/web/app/account-analytics/page.tsx
- apps/web/app/globals.css
- apps/web/components/editor-shell.tsx
- tests/account-analytics-workbench.test.mjs

Trust boundaries and sensitive data affected:

- The route uses fixed illustrative names, emails, accounts, roles, and demo activity; no production lead data is fetched.
- Search text is untrusted browser input and is used only for in-memory filtering.

Authorization model:

- The local preview has no server persistence or authorization. Production viewer/account journeys must enforce workspace scope, role permissions, consent, and separate access policies for identified leads versus aggregate analytics.

Threats considered:

- Cross-tenant lead disclosure, unauthorized account-level aggregation, PII leakage, unbounded searches, and accidental use of analytics activity as authorization evidence.

Security controls implemented:

- Search is capped at 120 characters and normalized before matching; ranges and scopes are allowlisted.
- Viewer and account detail panels are read-only local state, with explicit preview/privacy disclaimers and no unsafe HTML or external calls.
- Account navigation derives from fixed IDs rather than user-controlled URLs or identifiers.

Security tests added:

- tests/account-analytics-workbench.test.mjs checks viewer/account tabs, journey detail controls, bounded search, local-data boundaries, safe rendering, and the editor entry link.

Checks run and results:

- npm run verify — passed.
- npm test — production build passed; the first concurrent run hit the existing timing-sensitive dashboard benchmark (516 passed, 1 failed, 1 skipped). `node --test --test-concurrency=1 tests` passed with 517 passed and 1 skipped.
- npm run build — passed; `/account-analytics` generated as a static route.
- npm audit --omit=dev --audit-level=high — 0 vulnerabilities.
- git diff --check — passed.
- Browser verification — switched between recent viewers/accounts, searched TechCorp, opened an account journey, and exercised viewer-to-account navigation.

Checks not run:

- No production CRM, identity-resolution service, analytics store, or workspace authorization endpoint was contacted.

Dependencies or infrastructure permissions added:

- None.

Known limitations and residual risks:

- The local date range is illustrative and no production identity resolution is performed. Production work must enforce consent, retention/deletion, tenant-scoped access, audit logging, rate limits, and data minimization before exposing identified viewer journeys.

Please review the full diff and surrounding code for OWASP Top 10, tenant isolation,
authentication/authorization, input validation, XSS, SSRF, injection, upload safety,
secret exposure, privacy, dependency risk, insecure cloud configuration, and missing
negative tests. Classify findings as BLOCKER, HIGH, MEDIUM, LOW, or NOTE.

Claude review status: unavailable in this environment; human/Claude review remains required before production use.
