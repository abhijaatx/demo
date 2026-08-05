SECURITY REVIEW REQUEST

Change summary:

- Completed the bounded Figma prototype import flow: connect a file reference, select local frame exports, annotate and reorder frames, then export a local draft into the editor.

Files changed:

- apps/web/components/figma-import-workbench.tsx
- tests/figma-import-workbench.test.mjs
- tests/figma-import.test.mjs

Trust boundaries and sensitive data affected:

- User-selected PNG/JPG/WebP frame files; frame names/descriptions; localStorage draft document; browser object/data URLs.

Authorization model:

- The current route is a local preview and does not call Figma or Supademo APIs. A production plugin must authenticate the Figma user, verify workspace membership server-side, and scope every imported file and asset to that workspace.

Threats considered:

- Malicious image MIME declarations, oversized files, malformed image payloads, unsafe names/descriptions, localStorage quota failures, and unauthorized cross-workspace imports.

Security controls implemented:

- PNG/JPEG/WebP allowlist; 1.2 MB per-frame, 8-frame, 1.8 MB encoded-data, 10,000-pixel dimension, and bounded text limits; browser image decode validation; local-only export; safe domain conversion and fail-closed export handling.

Security tests added:

- tests/figma-import-workbench.test.mjs checks the client-side bounds and no unsafe DOM execution.
- tests/figma-import.test.mjs covers ordered, scoped document conversion.

Checks run and results:

- Targeted Figma tests passed.
- npm run typecheck passed.
- Targeted ESLint passed.

Checks not run:

- Figma plugin authentication/API integration and live file selection could not run because no Figma connector was available and the local browser URL was refused.
- Claude security review was unavailable in this environment.

Dependencies or infrastructure permissions added:

- None.

Known limitations and residual risks:

- The local route accepts exported frames rather than calling the Figma API. Production requires OAuth/token handling, encrypted credentials, least-privilege scopes, tenant checks, upload scanning, and server-side asset quotas.

Please review the full diff and surrounding code for OWASP Top 10, tenant isolation,
authentication/authorization, input validation, XSS, SSRF, injection, upload safety,
secret exposure, privacy, dependency risk, insecure cloud configuration, and missing negative tests. Classify findings as BLOCKER, HIGH, MEDIUM, LOW, or NOTE.
