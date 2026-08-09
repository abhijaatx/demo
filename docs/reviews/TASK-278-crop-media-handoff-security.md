SECURITY REVIEW REQUEST

Change summary:

- Persisted crop/fit metadata with selected image and video blobs for a local editor handoff.
- Added non-destructive crop rendering in the editor and viewer while preserving original source blobs.
- Added a save-and-open-editor path from the crop workbench.

Files changed:

- apps/web/components/crop-media-workbench.tsx
- apps/web/components/editor-shell.tsx
- apps/web/components/demo-viewer.tsx
- apps/web/src/lib/local-capture-storage.ts
- packages/domain/src/demo-document.ts
- tests/crop-media-workbench.test.mjs
- tests/local-capture-storage.test.mjs

Trust boundaries and sensitive data affected:

- Creator-selected local media and normalized crop percentages are stored in browser IndexedDB and rendered through local object URLs.
- No upload, URL fetch, or server-side publication is performed by the crop handoff.

Authorization model:

- Local crop editing is browser-scoped and does not require authentication.
- Production persistence/publication must authorize the current user and workspace independently of the local capture ID and must revalidate media and crop metadata server-side.

Threats considered:

- Unsupported/oversized media, out-of-range crop coordinates, CSS transform abuse, filename injection, object URL leaks, storage exhaustion, and unauthorized publication.

Security controls implemented:

- Existing file MIME/size allowlists and eight-asset limit remain active.
- Crop x/y/width/height must be finite, positive, normalized percentages whose bounds do not exceed 100; fit is an allowlist.
- Media is never overwritten; object URLs are revoked on removal/unmount; crop metadata is stored as inert typed fields and React style values.

Security tests added:

- Crop workbench, local-capture, and document-model tests cover crop bounds, fit propagation, editor/viewer styling, local handoff, and unsafe API absence.

Checks run and results:

- npm run format:check — passed.
- npm run verify — passed.
- PATH=/Users/abhijaat/.nvm/versions/node/v20.20.2/bin:$PATH npm test — 548 passed, 1 skipped, 0 failed.
- npm audit --omit=dev --audit-level=high — 0 vulnerabilities.

Checks not run:

- Native file chooser interaction in the in-app browser is unavailable; the crop route loaded and its empty-state controls were verified, while representative image/video crop checks remain required.
- Claude independent security review is unavailable in this environment and must be performed before merge.

Dependencies or infrastructure permissions added:

- None.

Known limitations and residual risks:

- Local crop metadata is not a substitute for server-side media validation or authorization at publication time.
- The viewer uses non-destructive CSS framing; a production export pipeline must apply equivalent bounds before generating derivatives.

Please review the full diff and surrounding code for OWASP Top 10, tenant isolation,
authentication/authorization, input validation, XSS, SSRF, injection, upload safety,
secret exposure, privacy, dependency risk, insecure cloud configuration, and missing
negative tests. Classify findings as BLOCKER, HIGH, MEDIUM, LOW, or NOTE.

Claude security review status: unavailable in this environment; an independent Claude review is required before merge.
