SECURITY REVIEW REQUEST

Change summary:

- Added a local editor handoff for the HTML editing workbench.
- Stores bounded structured node metadata, preview variables, scroll preference, and optional image blobs rather than captured executable markup.
- Restores the plan as ordered, inert editor steps and keeps the existing sanitizer-backed preview/export behavior.

Files changed:

- apps/web/components/html-edit-workbench.tsx
- apps/web/components/editor-shell.tsx
- apps/web/src/lib/local-capture-storage.ts
- tests/html-edit-workbench.test.mjs
- tests/local-capture-storage.test.mjs

Trust boundaries and sensitive data affected:

- User-entered element copy, personalization variables, and optional local replacement images cross from React state into browser IndexedDB.
- No raw page HTML, scripts, event handlers, iframes, network references, or server request is persisted by this handoff.

Authorization model:

- Local editing and local export are browser-scoped and unauthenticated.
- Any future captured-page save, publish, embed, or viewer access must use the canonical authenticated workspace policy and a separately authorized server-side asset.

Threats considered:

- Stored/reflected XSS, script/event-handler injection, unsafe HTML execution, oversized node/variable input, image payload abuse, object URL leaks, and cross-tenant publication.

Security controls implemented:

- Node/tag allowlist, 60-node cap, 400-character text cap, 160-character variables, 10-variable cap, bounded image assets, normalized IDs, and aggregate 100 MB IndexedDB cap.
- Structured node data is rendered as React text; no innerHTML, outerHTML, eval, Function, or network fetch is used by the handoff.
- Image blobs use allowlisted MIME types and browser object URLs with cleanup; editor restores text nodes without executing markup.

Security tests added:

- HTML workbench and local-capture tests cover structured-plan storage, editor restoration, size limits, and unsafe API absence.

Checks run and results:

- npm run format:check — passed.
- npm run verify — passed.
- PATH=/Users/abhijaat/.nvm/versions/node/v20.20.2/bin:$PATH npm test — 548 passed, 1 skipped, 0 failed.
- npm audit --omit=dev --audit-level=high — 0 vulnerabilities.

Checks not run:

- Native file chooser interaction in the in-app browser is unavailable; the HTML route loaded and Save changes reported sanitized local persistence, while manual image replacement and editor reload checks remain required.
- Claude independent security review is unavailable in this environment and must be performed before merge.

Dependencies or infrastructure permissions added:

- None.

Known limitations and residual risks:

- This does not yet clone arbitrary live-page HTML; it intentionally hands off the safe structured plan to avoid executing untrusted captured markup. A future true HTML clone requires a separate-origin sandbox, strict allowlist sanitizer, CSP, and postMessage validation.
- Local variables are preview-only until a server-side personalization policy is applied during publication.

Please review the full diff and surrounding code for OWASP Top 10, tenant isolation,
authentication/authorization, input validation, XSS, SSRF, injection, upload safety,
secret exposure, privacy, dependency risk, insecure cloud configuration, and missing
negative tests. Classify findings as BLOCKER, HIGH, MEDIUM, LOW, or NOTE.

Claude security review status: unavailable in this environment; an independent Claude review is required before merge.
