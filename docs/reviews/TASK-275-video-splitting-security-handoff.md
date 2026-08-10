SECURITY REVIEW REQUEST

Change summary:

- Added frame capture at the video playhead, bounded image-step editing, and a local editor handoff for video splits.
- Extended browser-only capture storage and editor restoration to preserve video segments and still frames.

Files changed:

- apps/web/components/video-editor-workbench.tsx
- apps/web/src/lib/local-capture-storage.ts
- apps/web/components/editor-shell.tsx
- apps/web/app/globals.css
- tests/local-capture-storage.test.mjs

Trust boundaries and sensitive data affected:

- User-selected local video files and canvas-derived still frames remain in the browser and are later rendered by the local editor.

Authorization model:

- The workbench is local and unauthenticated; it does not publish or send media. Saving/publishing uses the existing editor/API authorization path.

Threats considered:

- Oversized media, canvas memory pressure, object URL leaks, unsafe file types, malformed timeline data, and accidental network upload.

Security controls implemented:

- Existing MP4/WebM/QuickTime allowlist, 40 MB file cap, two-hour duration cap, 40 segment cap, 20 image-step cap, and 1.8 MB per-frame cap.
- Canvas dimensions are reduced to a 2,000-pixel maximum and storage validates segment ranges, speed, IDs, dimensions, MIME types, and aggregate 100 MB bundle size.
- Object URLs are revoked on replacement/unmount/removal; no network APIs are used for local capture.

Security tests added:

- tests/local-capture-storage.test.mjs checks video-split schemas, segment/image bounds, and editor handoff wiring.

Checks run and results:

- npm run format (passed)
- npm run verify (passed after fixes)
- Focused and full test suites (to run with the batch suite)

Checks not run:

- Browser video/canvas interaction could not be exercised because local URLs were refused by the in-app browser.

Dependencies or infrastructure permissions added:

- None.

Known limitations and residual risks:

- The local editor represents split ranges as ordered video steps with bounded descriptive timing metadata; server-side media rendering is still required for production exports.
- Browser resource limits can still reject very large or unusual codecs; failure is surfaced without uploading the source.

Please review the full diff and surrounding code for OWASP Top 10, tenant isolation,
authentication/authorization, input validation, XSS, SSRF, injection, upload safety,
secret exposure, privacy, dependency risk, insecure cloud configuration, and missing
negative tests. Classify findings as BLOCKER, HIGH, MEDIUM, LOW, or NOTE.

Claude security review status: unavailable in this environment; an independent Claude review is required before merge.
