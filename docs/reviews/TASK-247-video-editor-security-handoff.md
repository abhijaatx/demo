# SECURITY REVIEW REQUEST

## Change summary

- Added a local video-editor workbench based on Supademo's documented split/trim/speed/mute/duplicate/delete workflow.
- Added bounded video metadata validation, segment controls, non-destructive timeline planning, and a JSON edit-plan download.
- Added an editor link and static security regression coverage.

## Files changed

- apps/web/app/video-editor/page.tsx
- apps/web/components/video-editor-workbench.tsx
- apps/web/components/editor-shell.tsx
- apps/web/app/globals.css
- tests/video-editor-workbench.test.mjs

## Trust boundaries and sensitive data affected

- A creator-selected local video is rendered via a browser blob URL. The workbench does not upload or mutate the source file.
- Edit metadata and downloaded JSON leave the browser only when the creator explicitly saves the local plan. Production media processing and publication remain authenticated server operations.

## Authorization model

- Local file selection, timeline editing, and plan export require an explicit creator action and do not perform a protected server mutation.
- Future save/publish operations must authorize identity, workspace scope, asset access, quota, and revision ownership on the server; the local plan is not authorization evidence.

## Threats considered

- Unsupported or oversized media, malformed duration metadata, excessive segment counts, invalid/overlapping ranges, unsafe filenames, XSS through UI copy, and unintended network upload.

## Security controls implemented

- Exact MP4/WebM/QuickTime allowlist, 40 MB file cap, 2-hour duration cap, and 40-segment cap.
- Segment start/end values are clamped to a minimum 50 ms interval; speed is restricted to a fixed allowlist; filenames and status copy are bounded/rendered as text.
- Blob URLs are revoked on replacement/unmount; export emits only bounded JSON edit metadata and makes no network request or dynamic code execution.
- Existing domain `createVideoEditTimeline` validation remains the final local-plan guard.

## Security tests added

- tests/video-editor-workbench.test.mjs checks media bounds, timeline controls, non-destructive export, object URL cleanup, and absence of unsafe DOM/network APIs.
- Existing video-editing domain tests cover trim range validation and duration calculations.

## Checks run and results

- npm run format:check — passed.
- npm run verify — passed (format, lint, workspace boundaries, and typecheck).
- node --test tests — passed (496 passed, 1 skipped).
- npm run build — passed (Next.js production build, including /video-editor).
- npm audit --omit=dev --audit-level=high — passed (0 vulnerabilities).
- Browser route verification — passed /video-editor empty-state snapshot; native file chooser/media playback remains unavailable in the in-app browser.

## Checks not run

- Real media selection and playback were not completed through the in-app browser because file chooser controls are unavailable there. Manual MP4/WebM/QuickTime checks remain required.
- Claude's independent security review is not available in this environment. This handoff is intentionally not an approval.

## Dependencies or infrastructure permissions added

- No packages, backend services, IAM actions, or production permissions were added.

## Known limitations and residual risks

- This workbench exports a plan rather than transcoding the video. A production pipeline must repeat signature, decoder, resource, quota, and tenant checks in isolated workers.
- Segment duplication references the same source range by design; the eventual renderer must honor ordering and prevent overlap bugs when materializing a rendition.

Please review the full diff and surrounding code for OWASP Top 10, tenant isolation,
authentication/authorization, input validation, XSS, SSRF, injection, upload safety,
secret exposure, privacy, dependency risk, insecure cloud configuration, and missing
negative tests. Classify findings as BLOCKER, HIGH, MEDIUM, LOW, or NOTE.
