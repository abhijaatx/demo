SECURITY REVIEW REQUEST

Change summary:

- Added durable browser-only upload bundles for screenshots, videos, PDFs, and PowerPoint files.
- Upload export now stores validated blobs in IndexedDB and passes a scoped local capture ID into the editor.

Files changed:

- apps/web/components/upload-import-workbench.tsx
- apps/web/src/lib/local-capture-storage.ts
- apps/web/components/editor-shell.tsx
- apps/web/app/globals.css
- tests/local-capture-storage.test.mjs

Trust boundaries and sensitive data affected:

- User-selected local files cross the upload workbench into IndexedDB and local editor object URLs; no server upload is performed by this route.

Authorization model:

- The local importer is intentionally unauthenticated and browser-scoped. Any server upload/publish action continues through the existing authenticated, workspace-scoped API controls.

Threats considered:

- File-type spoofing, oversized files, object URL lifetime, local storage exhaustion, path/name injection, XSS through titles/descriptions, and accidental public exposure.

Security controls implemented:

- Existing allowlisted MIME types, eight-file/12 MB-per-file limits, image-size/dimension limits, bounded title/description fields, and aggregate 100 MB IndexedDB validation.
- Files use browser-generated object URLs and IndexedDB keys; user filenames never become filesystem paths or HTML.
- React text rendering and no unsafe DOM/network APIs keep metadata inert; URLs are revoked on removal/unmount.

Security tests added:

- tests/local-capture-storage.test.mjs verifies upload bundle validation and editor restoration wiring; existing upload workbench tests retain file/count and unsafe-API checks.

Checks run and results:

- npm run format (passed)
- npm run verify (passed after fixes)
- Focused and full test suites (to run with the batch suite)

Checks not run:

- Browser file selection/reload verification could not be exercised because the in-app browser refused local URLs.

Dependencies or infrastructure permissions added:

- None.

Known limitations and residual risks:

- The local upload flow is a browser handoff, not the production object-storage upload path; server-side signature scanning, quotas, and tenant authorization remain required for published assets.
- A user with local browser access can inspect their own IndexedDB data by design.

Please review the full diff and surrounding code for OWASP Top 10, tenant isolation,
authentication/authorization, input validation, XSS, SSRF, injection, upload safety,
secret exposure, privacy, dependency risk, insecure cloud configuration, and missing
negative tests. Classify findings as BLOCKER, HIGH, MEDIUM, LOW, or NOTE.

Claude security review status: unavailable in this environment; an independent Claude review is required before merge.
