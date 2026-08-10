SECURITY REVIEW REQUEST

Change summary:

- Completed the local screen/webcam/both recorder flow with microphone, system-audio, device, pause, time-limit, and local editor handoff controls.
- Stored the captured video in bounded browser-only IndexedDB storage so the editor link does not upload media implicitly.

Files changed:

- apps/web/components/screen-camera-recorder-workbench.tsx
- apps/web/src/lib/local-capture-storage.ts
- apps/web/app/demos/[demoId]/edit/page.tsx
- apps/web/components/editor-shell.tsx
- tests/screen-camera-recorder.test.mjs
- tests/local-capture-storage.test.mjs

Trust boundaries and sensitive data affected:

- Screen, webcam, microphone, and system-audio streams granted by the browser; local IndexedDB media; local object URLs used by the editor.

Authorization model:

- This browser-only preview never sends recorder output to an API. Production recording must require an authenticated workspace session and server-side workspace authorization before persistence or publishing.

Threats considered:

- Accidental media upload, oversized blobs, malformed local capture identifiers, object-URL lifetime leaks, permission denial, and capture streams ending unexpectedly.

Security controls implemented:

- Browser permission APIs only; 120-second and 40 MB bounds; IndexedDB bundle validation; allowlisted WebM MIME types; bounded capture IDs; object URL cleanup; download fallback when local storage is unavailable.

Security tests added:

- tests/screen-camera-recorder.test.mjs checks permission APIs, bounds, and local handoff.
- tests/local-capture-storage.test.mjs checks IndexedDB bounds, identifier validation, Blob validation, and absence of network upload APIs.

Checks run and results:

- Targeted recorder tests passed.
- npm run typecheck passed.
- Targeted ESLint passed.

Checks not run:

- Browser permission and camera/screen capture interaction could not run because the in-app browser refused local/private URLs; run the recorder manually in a permitted browser context.
- Claude security review was unavailable in this environment.

Dependencies or infrastructure permissions added:

- None.

Known limitations and residual risks:

- IndexedDB is a local preview handoff, not production asset persistence. Production needs authenticated upload, object-storage scanning, quotas, retention, audit logging, and server-side authorization.

Please review the full diff and surrounding code for OWASP Top 10, tenant isolation,
authentication/authorization, input validation, XSS, SSRF, injection, upload safety,
secret exposure, privacy, dependency risk, insecure cloud configuration, and missing negative tests. Classify findings as BLOCKER, HIGH, MEDIUM, LOW, or NOTE.
