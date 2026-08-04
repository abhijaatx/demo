# SECURITY REVIEW REQUEST

## Change summary

- Added a browser screen, camera, and combined screen-plus-camera recorder.
- Added microphone and optional system-audio controls, device selection after permission, pause/resume, a bounded local recording, and a local download/editor handoff.
- Added a recorder route, download-page link, editor capture link, responsive styling, and static security regression coverage.

## Files changed

- apps/web/app/screen-recorder/page.tsx
- apps/web/components/screen-camera-recorder-workbench.tsx
- apps/web/components/editor-shell.tsx
- apps/web/components/marketing-download.tsx
- apps/web/app/globals.css
- tests/screen-camera-recorder.test.mjs

## Trust boundaries and sensitive data affected

- The browser receives screen pixels, camera frames, microphone audio, and optional system audio only after the user invokes the recorder and approves native permission prompts.
- A canvas composite and `MediaRecorder` keep the result in browser memory and a blob URL. This route does not call an API, upload media, or persist device identifiers.
- The editor link is the next trust boundary; any future server upload must use authenticated, tenant-scoped upload sessions and must not trust this browser-only draft as authorization evidence.

## Authorization model

- Recording requires a visible user action and browser-managed screen/camera/microphone permission. The application cannot silently grant those permissions.
- The route performs no protected server operation. Download and editor navigation are explicit user actions.
- Existing editor and upload APIs remain responsible for authentication, workspace scope, quotas, and publication authorization.

## Threats considered

- Accidental recording of private screens, camera, microphone, or system audio.
- Permission denial, stream termination, unsupported browser APIs, resource exhaustion, and oversized recording blobs.
- Device-label leakage, XSS through device labels or status text, unsafe outbound requests, and recording data being uploaded without user intent.
- Cross-workspace publication if a future implementation treats a local blob or query parameter as an authorized asset.

## Security controls implemented

- `getDisplayMedia` and `getUserMedia` are called only from the Start recording action; system audio and microphone capture are opt-in checkboxes.
- Camera and microphone device lists are capped at eight entries and are only queried after permission. Device labels are rendered as text in native select options.
- Recordings are capped at 120 seconds and 40 MB. Tracks, animation frames, object URLs, and media streams are stopped or revoked on finish, error, stream termination, clear, and unmount.
- Combined recordings are composited locally on a bounded 1920×1080 canvas with a bounded camera bubble size and allowlisted position values.
- The route does not use fetch, sendBeacon, unsafe DOM APIs, dynamic code execution, or remote media URLs. Errors explicitly state that no recording data was uploaded.

## Security tests added

- tests/screen-camera-recorder.test.mjs checks screen/camera permission calls, all layouts, audio controls, recording bounds, local object-URL handling, no-upload behavior, and the absence of unsafe DOM/network APIs.
- Existing desktop recorder, upload, editor, and media security tests continue to cover adjacent capture and upload boundaries.

## Checks run and results

- npm run format:check — passed.
- npm run verify — passed (format, lint, workspace boundaries, and typecheck).
- node --test tests — passed (493 passed, 1 skipped).
- npm run build — passed (Next.js production build, including /screen-recorder).
- npm audit --omit=dev --audit-level=high — passed (0 vulnerabilities).
- Browser route verification — passed route snapshot and recorder-control checks; native permission prompts remain unavailable in the in-app browser.

## Checks not run

- Native screen, camera, microphone, and system-audio permission prompts cannot be fully approved or exercised through the available in-app browser controls. Manual checks on supported Chrome, Edge, and Safari remain required.
- Claude's independent security review is not available in this environment. This handoff is intentionally not an approval.

## Dependencies or infrastructure permissions added

- No packages, backend services, IAM actions, or production permissions were added.

## Known limitations and residual risks

- Browser support and OS permission policy determine which display surfaces, camera devices, microphone devices, and system-audio tracks are available.
- The recorder produces a local WebM blob; production upload, virus scanning, media processing, quotas, and tenant-scoped publication are not part of this route.
- Device labels become available only after permission and remain in transient component state; no device identifiers are persisted.

Please review the full diff and surrounding code for OWASP Top 10, tenant isolation,
authentication/authorization, input validation, XSS, SSRF, injection, upload safety,
secret exposure, privacy, dependency risk, insecure cloud configuration, and missing
negative tests. Classify findings as BLOCKER, HIGH, MEDIUM, LOW, or NOTE.
