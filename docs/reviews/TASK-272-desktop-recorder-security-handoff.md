SECURITY REVIEW REQUEST

Change summary:

- Completed desktop screen/window capture for ordered screenshot steps and local video recording.
- Added bounded IndexedDB handoff into the editor, with download fallback and capture cleanup.

Files changed:

- apps/web/components/desktop-recorder-workbench.tsx
- apps/web/src/lib/local-capture-storage.ts
- apps/web/app/demos/[demoId]/edit/page.tsx
- apps/web/components/editor-shell.tsx
- tests/desktop-recorder.test.mjs
- tests/local-capture-storage.test.mjs

Trust boundaries and sensitive data affected:

- User-selected desktop/window pixels; local screenshot data URLs converted to Blob objects; local IndexedDB and editor object URLs.

Authorization model:

- The preview is browser-local and unauthenticated by design. Production capture finalization must enforce the signed-in workspace and tenant scope on the server before any upload or publication.

Threats considered:

- Screenshot/video quota abuse, malformed data URLs, untrusted capture IDs, accidental network transfer, stale object URLs, and permission cancellation.

Security controls implemented:

- Screen/window selection through getDisplayMedia; 30-step, 1.8 MB screenshot-string, 40 MB video, and 120-second bounds; PNG-only data URL conversion; IndexedDB schema and Blob validation; safe local route construction; explicit download fallback.

Security tests added:

- tests/desktop-recorder.test.mjs checks source/mode controls, capture bounds, and local handoff.
- tests/local-capture-storage.test.mjs checks local storage limits and absence of network upload APIs.

Checks run and results:

- Targeted recorder tests passed.
- npm run typecheck passed.
- Targeted ESLint passed.

Checks not run:

- Native desktop picker interaction could not run because the in-app browser refused local/private URLs; run on macOS/Windows with the appropriate screen-recording permissions.
- Claude security review was unavailable in this environment.

Dependencies or infrastructure permissions added:

- None.

Known limitations and residual risks:

- This is a browser fallback for the native desktop application. Production desktop ingestion needs authenticated upload, malware/media scanning, quotas, isolated processing, retention, and audit controls.

Please review the full diff and surrounding code for OWASP Top 10, tenant isolation,
authentication/authorization, input validation, XSS, SSRF, injection, upload safety,
secret exposure, privacy, dependency risk, insecure cloud configuration, and missing negative tests. Classify findings as BLOCKER, HIGH, MEDIUM, LOW, or NOTE.
