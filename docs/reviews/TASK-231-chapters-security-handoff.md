# SECURITY REVIEW REQUEST

Change summary:

- Added first-class chapters to the canonical demo document model, including beginning, middle, and end placement.
- Added accessible chapter authoring with bounded title/body/media fields, presenter notes, and CTA buttons targeting the next step, an internal step, or a validated URL.
- Added chapter previews, published-viewer interstitials, end-of-demo chapters, chapter CTA routing, safe chapter media rendering, and chapter content in SOP exports.
- Sanitized published/exported chapter metadata so presenter notes and unsafe destinations never enter public output.

Files changed:

- packages/domain/src/demo-document.ts
- packages/domain/src/chapter-model.ts
- packages/domain/src/publication-pipeline.ts
- packages/domain/src/sharing-exports.ts
- apps/web/components/editor/chapter-editor.tsx
- apps/web/components/editor-shell.tsx
- apps/web/components/demo-viewer.tsx
- apps/web/app/globals.css
- tests/chapter-model.test.mjs
- tests/demo-document.test.mjs
- tests/publication-pipeline.test.mjs
- tests/editor-shell.test.mjs
- tests/editor-sharing.test.mjs
- docs/reviews/TASK-231-chapters-security-handoff.md

Trust boundaries and sensitive data affected:

- Chapter title, body, image URL, presenter notes, CTA labels, target IDs, and destinations are untrusted editor/local-draft data.
- Published manifests and public viewer rendering are a separate output boundary from authoring state.
- Chapter CTA navigation can cross the app boundary through user-configured URLs.

Authorization model:

- The existing editor route and save/publish controls remain the authorization boundary; read-only editor mode disables chapter mutations.
- Public viewer playback only reads the published local manifest and never receives privileged presenter controls.
- Chapter deletion, placement, content, button, and publish mutations all pass through the existing EditorShell mutation path and `readOnly` guard.

Threats considered:

- Stored/reflected XSS through chapter text, CTA labels, image URLs, and external destinations.
- JavaScript/data/vbscript URL execution and unsafe image loading.
- Private presenter-note exposure through published manifests, JSON exports, SOP output, or viewer markup.
- Oversized chapter content, button-count abuse, malformed chapter JSON, and invalid target IDs.
- Viewer navigation to missing or malformed internal targets.

Security controls implemented:

- Chapter title/body/notes/IDs/labels/URLs and button count are bounded in `parseDemoChapter`.
- CTA and chapter media URLs are validated with the existing safe URL policy; unsafe URL actions fail closed to a linear continuation and unsafe media is omitted from public output.
- Published manifests and editor exports strip presenter notes and normalize chapter destinations.
- Viewer only renders validated HTTPS/blob media and uses `validateSafeUrl` before navigation.
- React text rendering is used throughout; no `innerHTML`, dynamic code execution, or unsanitized HTML injection was added.
- Existing `readOnly` mutation guards and local draft parsing remain in force.

Security tests added:

- `tests/chapter-model.test.mjs` covers URL rejection and content/button bounds.
- `tests/demo-document.test.mjs` covers chapter parsing and beginning/middle/end ordering.
- `tests/publication-pipeline.test.mjs` covers presenter-note stripping and unsafe destination removal.
- `tests/editor-shell.test.mjs` and `tests/editor-sharing.test.mjs` cover chapter controls and viewer wiring contracts.
- Browser verification covered safe/unsafe URL editing, beginning chapter continuation, internal CTA routing, and end chapter completion.

Checks run and results:

- `npm run format` — passed.
- `npm run build --workspace=@supademo/domain` — passed.
- Targeted chapter/editor/publication tests — passed (13 tests).
- `npm run verify` — passed (format, lint, boundaries, TypeScript, and Next route type generation).
- `npm test` — passed (447 passed, 1 skipped optional integration test).
- `npm audit --omit=dev --audit-level=high` — passed (0 vulnerabilities).
- `git diff --check` — passed.

Checks not run:

- Claude security review is unavailable in this environment; an independent review remains required before merge.

Dependencies or infrastructure permissions added:

- None.

Known limitations and residual risks:

- Chapter images currently use validated HTTPS/blob URLs; server-side asset upload, malware scanning, and quota enforcement are not part of this UI slice.
- Published storage and viewer access continue to use the repository's existing local-browser manifest path; production tenant authorization must still be enforced by the server publication/read APIs.
- URL CTAs navigate in the same tab because the observed reference behavior did not establish a new-tab requirement.

Please review the full diff and surrounding code for OWASP Top 10, tenant isolation,
authentication/authorization, input validation, XSS, SSRF, injection, upload safety,
secret exposure, privacy, dependency risk, insecure cloud configuration, and missing
negative tests. Classify findings as BLOCKER, HIGH, MEDIUM, LOW, or NOTE.
