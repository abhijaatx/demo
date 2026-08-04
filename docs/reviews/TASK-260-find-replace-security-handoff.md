SECURITY REVIEW REQUEST

Change summary:

- Added a local Find & Replace workbench covering bounded text replacement, case/exact matching, all-page scope, email anonymization, date maintenance, and the documented image-replacement coming-soon state.

Files changed:

- apps/web/components/find-replace-workbench.tsx
- apps/web/app/find-replace/page.tsx
- apps/web/app/globals.css
- apps/web/components/editor-shell.tsx
- tests/find-replace-workbench.test.mjs

Trust boundaries and sensitive data affected:

- Captured text, email-shaped values, and dates are represented as local sample nodes.
- Replacement input is user-controlled but bounded to 160 characters; rendered previews use React text and mark nodes, not HTML sinks.

Authorization model:

- The workbench is a local authoring preview and performs no server mutation. Production implementation must authorize the active workspace, demo, and page scope for each bulk edit and audit the resulting revision.

Threats considered:

- Stored/reflected XSS, regex or parser abuse, PII leakage during anonymization, accidental cross-page edits, and unsafe image replacement claims.

Security controls implemented:

- Input length bounds, explicit text matching modes, fixed sample-node count, reserved example.test anonymized addresses, deterministic local previews, and a disabled/clear image coming-soon state.
- No innerHTML, dynamic regex construction, fetch, logging of source email values, or external mutation.

Security tests added:

- tests/find-replace-workbench.test.mjs checks bounds, match modes, email/date/image workflows, text-safe rendering, no unsafe sinks, and editor entry link.

Checks run and results:

- npm run verify — passed.
- node --test tests — 508 passed, 1 skipped.
- npm run build — passed; /find-replace generated.
- npm audit --omit=dev --audit-level=high — 0 vulnerabilities.
- git diff --check — passed.
- Browser verification — replaced matching text, selected-email anonymization, custom date range, and image coming-soon state.

Checks not run:

- No production workspace API or uploaded/captured HTML was used; the screen is intentionally local and uses illustrative nodes.

Dependencies or infrastructure permissions added:

- None.

Known limitations and residual risks:

- Production bulk replacement must add server-side tenant authorization, revision conflicts/idempotency, audit logs, PII retention rules, and content-aware sanitization for captured HTML. The local sample does not validate production media or HTML pipelines.

Please review the full diff and surrounding code for OWASP Top 10, tenant isolation,
authentication/authorization, input validation, XSS, SSRF, injection, upload safety,
secret exposure, privacy, dependency risk, insecure cloud configuration, and missing
negative tests. Classify findings as BLOCKER, HIGH, MEDIUM, LOW, or NOTE.

Claude review status: unavailable in this environment; human/Claude review remains required before production use.
