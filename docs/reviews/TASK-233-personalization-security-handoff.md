# TASK-233 Dynamic Variables and Personalized Links Security Handoff

SECURITY REVIEW REQUEST

Change summary:

- Added bounded dynamic variables with `{{name}}` and fallback syntax support.
- Added author controls for the variable allowlist and fallback text.
- Added personalized share-link generation using `v_*` query parameters.
- Rendered allowlisted values in viewer text, chapter titles, buttons, step titles, and hotspots.

Files changed:

- packages/domain/src/personalized-links.ts
- packages/domain/src/variable-rendering.ts
- packages/domain/src/demo-document.ts
- packages/domain/src/index.ts
- apps/web/components/editor-shell.tsx
- apps/web/components/demo-viewer.tsx
- apps/web/app/globals.css
- tests/personalization.test.mjs
- tests/personalized-links.test.mjs
- tests/variable-rendering.test.mjs
- tests/demo-document.test.mjs
- tests/demo-viewer-personalization.test.mjs

Trust boundaries and sensitive data affected:

- Creator-authored templates are serialized into local draft and published demo documents.
- Public viewer URLs can carry untrusted viewer or campaign values.
- Values are displayed in React text nodes and are not treated as HTML, scripts, URLs, or authorization evidence.

Authorization model:

- Variable configuration is editable only through the existing creator editor and read-only guard.
- Viewer query parameters can personalize copy but cannot change document structure, destinations, permissions, or publication state.
- Only author-allowlisted variable names are accepted; unknown query keys are ignored.

Threats considered:

- Reflected/stored XSS through variable values and fallback text.
- Prototype pollution and unknown-key injection through query parameters or allowlists.
- Oversized values, excessive variable counts, malformed variable names, and URL parameter confusion.
- Open redirects or SSRF through personalized links.
- Sensitive-data leakage through share URLs and local persistence.

Security controls implemented:

- Variable names are restricted to `[A-Za-z][A-Za-z0-9_]{0,31}` and capped at 12 variables.
- Values are trimmed and capped at 160 characters before use or URL generation.
- `v_*` query keys are normalized against the allowlist; unknown keys and duplicate over-limit entries are ignored.
- Fallback syntax is bounded and rendered through React text nodes; no `dangerouslySetInnerHTML`, `eval`, or dynamic URL navigation is introduced.
- Personalized links preserve the existing `ref` tracking label but do not grant access or alter authorization.

Security tests added:

- Settings bounds and prototype-key rejection.
- `v_*` extraction, unknown-key, and oversized-value negative tests.
- Token discovery and fallback rendering tests.
- Viewer source contract test confirming allowlisted extraction and absence of unsafe HTML sinks.

Checks run and results:

- npm run build — passed.
- Targeted personalization/document/viewer tests — passed (14/14 in the targeted run).
- git diff --check — passed.
- npm audit --omit=dev --audit-level=high — passed (0 vulnerabilities).
- npm test after the final feature batch — passed (462 total; 461 passed, 1 skipped optional API integration).
- Browser verification — passed: generated a personalized link with `v_name=Alice&v_company=Acme`; viewer rendered “Hello Alice from Acme”; no-value viewer rendered the inline fallback.

Checks not run:

- Claude security review — unavailable in this environment; an independent review is still required before merge.
- Production URL redaction/retention policy — the local MVP does not send variable values to a server.

Dependencies or infrastructure permissions added:

- None.

Known limitations and residual risks:

- Variable values in share URLs can be visible to browser history, referrers, and analytics systems; production should document/redact sensitive values and offer a POST or tokenized link mode where appropriate.
- Dynamic image variables and voiceover substitution are not included in this slice.
- Local-only publication/storage is not tenant-scoped server persistence.

Please review the full diff and surrounding code for OWASP Top 10, tenant isolation,
authentication/authorization, input validation, XSS, SSRF, injection, upload safety,
secret exposure, privacy, dependency risk, insecure cloud configuration, and missing
negative tests. Classify findings as BLOCKER, HIGH, MEDIUM, LOW, or NOTE.
