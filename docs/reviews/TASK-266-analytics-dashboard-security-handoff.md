SECURITY REVIEW REQUEST

Change summary:

- Added an analytics dashboard with Supademo/Showcase scope tabs, viewer/source/date filters, views-versus-engagement chart controls, ranked demos, detail drawers, and CSV export.
- Added the `/analytics-dashboard` route and editor entry point.

Files changed:

- apps/web/components/analytics-dashboard-workbench.tsx
- apps/web/app/analytics-dashboard/page.tsx
- apps/web/app/globals.css
- apps/web/components/editor-shell.tsx
- tests/analytics-dashboard-workbench.test.mjs

Trust boundaries and sensitive data affected:

- The route renders fixed illustrative analytics and source labels only; it does not query production viewer data.
- CSV output and selected demo details could contain viewer-related metrics in a production implementation.

Authorization model:

- The local preview has no server persistence or authorization. Production analytics queries and exports must enforce workspace, demo, role, and identified-viewer permissions independently on the server.

Threats considered:

- Cross-tenant analytics disclosure, PII leakage through CSV/detail views, CSV formula injection, unbounded filters, and treating analytics properties as authorization evidence.

Security controls implemented:

- Viewer, source, scope, metric, and date controls are fixed allowlists; no free-form query is sent to a server.
- CSV cells use the existing `sanitizeCsvCell` helper to neutralize spreadsheet formulas.
- The detail drawer is local state only, and the page explicitly labels data as illustrative preview data.
- No external requests, unsafe HTML sinks, raw request logging, or client-provided authorization claims are added.

Security tests added:

- tests/analytics-dashboard-workbench.test.mjs checks filter/scope/metric controls, bounded inputs, CSV sanitization, safe rendering, and the editor entry link.
- Existing analytics tests cover tenant-scoped aggregation, retention, and safe CSV generation.

Checks run and results:

- npm run verify — passed.
- npm test — production build passed; the first concurrent run hit the existing timing-sensitive dashboard benchmark (516 passed, 1 failed, 1 skipped). `node --test --test-concurrency=1 tests` passed with 517 passed and 1 skipped.
- npm run build — passed; `/analytics-dashboard` generated as a static route.
- npm audit --omit=dev --audit-level=high — 0 vulnerabilities.
- git diff --check — passed.
- Browser verification — changed Supademo/Showcase scope, viewer/source filters, engagement metric, and opened a filtered demo detail drawer.

Checks not run:

- No production analytics store, workspace authorization endpoint, or export audit service was contacted.

Dependencies or infrastructure permissions added:

- None.

Known limitations and residual risks:

- Sample date ranges are presentation controls rather than a server query. Production implementation must add tenant-scoped queries, identified-viewer consent/retention, rate limits, pagination, export auditing, and aggregation safeguards.

Please review the full diff and surrounding code for OWASP Top 10, tenant isolation,
authentication/authorization, input validation, XSS, SSRF, injection, upload safety,
secret exposure, privacy, dependency risk, insecure cloud configuration, and missing
negative tests. Classify findings as BLOCKER, HIGH, MEDIUM, LOW, or NOTE.

Claude review status: unavailable in this environment; human/Claude review remains required before production use.
