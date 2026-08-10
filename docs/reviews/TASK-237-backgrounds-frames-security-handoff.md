# TASK-237 Backgrounds & Frames Security Handoff

SECURITY REVIEW REQUEST

Change summary:

- Added Supademo-style Backgrounds & Frames controls for solid colors, preset gradients, and uploaded custom images.
- Persisted background settings in the demo document and applied them to the published viewer surface.
- Kept viewer background images behind a safe media URL boundary and bounded local uploads to 10 MB image files.

Files changed:

- packages/domain/src/demo-document.ts
- packages/domain/src/index.ts
- packages/domain/src/publication-pipeline.ts
- apps/web/components/editor-shell.tsx
- apps/web/components/demo-viewer.tsx
- apps/web/app/globals.css
- tests/demo-document.test.mjs
- tests/backgrounds-frames.test.mjs

Trust boundaries and sensitive data affected:

- Creator-selected colors and local image uploads are persisted in the browser-backed demo document and published into the viewer manifest.
- Viewer rendering consumes only parsed theme values and safe HTTPS/blob image URLs.

Authorization model:

- Existing editor read-only guards control background updates and image removal.
- Publication uses the existing creator flow; viewer access is unchanged and backgrounds do not expose new content or permissions.

Threats considered:

- Malicious image URL schemes, oversized uploads, and unsafe MIME declarations.
- CSS injection through background values, arbitrary query parameters, and unsafe HTML rendering.
- Persistence of local object URLs across draft/publish boundaries.

Security controls implemented:

- Presets are an allowlist; colors are constrained by the color input and parsed theme defaults.
- Background image values accept only bounded `blob:` or `https:` URLs; unsafe schemes become null.
- Uploads are limited to image MIME types and 10 MB before creating a local object URL.
- Viewer applies values through React style properties, not HTML/CSS string injection or unsafe markup.

Security tests added:

- Theme parser regression test for supported presets and rejection of `javascript:` image URLs.
- Editor/viewer source contract for bounded image upload, allowlisted presets, safe URL rendering, and absence of unsafe HTML sinks.

Checks run and results:

- Targeted background/document tests — passed.
- Browser verification — passed: selected Aurora, confirmed persistence across reload, published the demo, and verified the viewer rendered the gradient background.
- `npm run format` — passed.
- `npm run verify` — passed.
- `npm run build` — passed.
- `npm audit --omit=dev --audit-level=high` — passed with 0 vulnerabilities.
- Full `npm test` rerun — 467 passed, 1 skipped optional API integration.

Checks not run:

- Claude security review — unavailable in this environment; independent review remains required.
- Production object-storage upload scanning — this local MVP does not upload to object storage.

Dependencies or infrastructure permissions added:

- None.

Known limitations and residual risks:

- Local object URLs are browser-scoped and are not durable production assets; production uploads need private object storage, scanning, and derivative generation.
- Declared MIME types are checked client-side only; production must validate signatures and decoder results server-side.

Please review the full diff and surrounding code for OWASP Top 10, tenant isolation,
authentication/authorization, input validation, XSS, SSRF, injection, upload safety,
secret exposure, privacy, dependency risk, insecure cloud configuration, and missing
negative tests. Classify findings as BLOCKER, HIGH, MEDIUM, LOW, or NOTE.
