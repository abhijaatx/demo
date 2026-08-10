# SECURITY REVIEW REQUEST

## Change summary

- Added a local video-hotspot workbench for placing pause and duration hotspots on a timeline.
- Added bounded video selection, metadata validation, preview overlays, editable copy/timing, marker seeking, and JSON plan export.
- Added an editor link and static security regression coverage.

## Files changed

- apps/web/app/video-hotspots/page.tsx
- apps/web/components/video-hotspots-workbench.tsx
- apps/web/components/editor-shell.tsx
- apps/web/app/globals.css
- tests/video-hotspots-workbench.test.mjs

## Trust boundaries and sensitive data affected

- The browser receives a creator-selected video and renders it through a local blob URL. The workbench does not upload the video or hotspot copy.
- Exported JSON is generated locally as a download. Publishing, storage, viewer delivery, and analytics remain authenticated server-side concerns.

## Authorization model

- Selecting a local file, editing hotspot metadata, seeking, and exporting a local plan are creator-initiated browser operations with no server authorization decision.
- Any future save, publish, or attach operation must authorize the current identity and workspace on the server; a local blob URL or exported JSON is not an authorization token.

## Threats considered

- Oversized or unsupported video files, malformed media metadata, excessive hotspot count, unbounded title/message input, object URL lifetime, and download abuse.
- Stored/reflected XSS through hotspot copy, SSRF, unsafe network upload, cross-workspace publication, and unauthorized viewer behavior.

## Security controls implemented

- Exact MP4, WebM, and QuickTime MIME allowlist, 40 MB file limit, 2-hour duration limit, and a 20-hotspot cap.
- Hotspot titles and viewer messages are bounded at 120 and 400 characters, respectively, and render through React text nodes.
- Timeline values are clamped to validated media duration and hotspot type controls whether an end time is used.
- Blob URLs are revoked on replacement/unmount; export creates a short-lived local JSON blob and does not send telemetry or network requests.
- Media preview reports load failures without exposing parser or internal error details.

## Security tests added

- tests/video-hotspots-workbench.test.mjs checks MIME, file, duration, hotspot, and copy bounds; blob cleanup; local-only export; and absence of unsafe DOM/network APIs.
- Existing editor capture tests continue to cover safe media URLs and authenticated media workflows.

## Checks run and results

- npm run format:check — passed.
- npm run verify — passed (format, lint, workspace boundaries, and typecheck).
- node --test tests — passed (493 passed, 1 skipped).
- npm run build — passed (Next.js production build, including /video-hotspots).
- npm audit --omit=dev --audit-level=high — passed (0 vulnerabilities).
- Browser route verification — passed /video-hotspots route snapshot and empty export validation; native file chooser selection remains unavailable in the in-app browser.

## Checks not run

- A real media file was not selected through the in-app browser because its available control surface does not expose file chooser selection. Manual checks with representative MP4, WebM, and QuickTime files remain required.
- Claude's independent security review is not available in this environment. This handoff is intentionally not an approval.

## Dependencies or infrastructure permissions added

- No packages, backend services, IAM actions, or production permissions were added.

## Known limitations and residual risks

- This is a local preparation and export workflow, not a production video processing pipeline. Production publication must validate media signatures, scan/process uploads in isolated workers, enforce quotas, scope objects to the workspace, and authorize viewer delivery.
- Pause hotspot overlays remain visible after their trigger while the video time is at or after the pause point; the exported plan is authoritative for the eventual player behavior.
- Client-side bounds are defense in depth and must be repeated at every authenticated upload/save API boundary.

Please review the full diff and surrounding code for OWASP Top 10, tenant isolation,
authentication/authorization, input validation, XSS, SSRF, injection, upload safety,
secret exposure, privacy, dependency risk, insecure cloud configuration, and missing
negative tests. Classify findings as BLOCKER, HIGH, MEDIUM, LOW, or NOTE.
