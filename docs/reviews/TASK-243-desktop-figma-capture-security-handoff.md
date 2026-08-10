# SECURITY REVIEW REQUEST

## Change summary

- Added a browser-based desktop capture workbench for screenshot steps and short local video recordings.
- Added a Figma frame import workbench that connects a local file key, accepts bounded frame exports, supports ordering and annotations, and exports a local draft to the existing editor.
- Added download-page links and editor capture-mode labels for the two capture paths.

## Files changed

- apps/web/app/desktop-recorder/page.tsx
- apps/web/app/figma-plugin/page.tsx
- apps/web/components/desktop-recorder-workbench.tsx
- apps/web/components/figma-import-workbench.tsx
- apps/web/components/editor-shell.tsx
- apps/web/app/demos/[demoId]/edit/page.tsx
- apps/web/components/marketing-download.tsx
- apps/web/app/globals.css
- tests/desktop-recorder.test.mjs
- tests/figma-import-workbench.test.mjs
- tests/download.test.mjs

## Trust boundaries and sensitive data affected

- The desktop recorder receives pixels from a user-approved `getDisplayMedia` stream and keeps screenshots, video blobs, and object URLs in the current browser tab only. No capture is uploaded by these routes.
- The Figma importer receives local image files and a user-entered file key or name. Image data URLs and the generated draft are held in page memory and `localStorage` until the user exports or clears them.
- The existing editor is the next trust boundary. Any future server upload or publishing path must use the authenticated, tenant-scoped API rather than trusting this local draft.

## Authorization model

- Desktop capture requires an explicit browser screen/window permission prompt and is initiated by a visible user action. The route performs no authenticated server mutation.
- Figma import is a local preparation workflow and does not call Figma or Supademo APIs. The local draft is not treated as published or workspace data.
- When a draft enters the editor, existing editor/API authorization controls remain responsible for workspace access and publishing.

## Threats considered

- Accidental screen and audio capture, permission denial, stream termination, and recording resource exhaustion.
- Malicious or oversized local images, SVG/script payloads, data-URL quota exhaustion, and hostile frame titles/descriptions.
- Local-storage tampering, XSS through imported metadata, unsafe outbound requests, SSRF, and cross-workspace publication if a future upload path trusts local draft fields.

## Security controls implemented

- `getDisplayMedia` is called only after a user action, requests video with `audio: false`, and stops tracks on finish, cancellation, stream termination, and unmount.
- Desktop screenshots are limited to 30 steps and 1.8 MB data URLs; video is limited to 40 MB and 120 seconds. All results remain local and use browser-generated object URLs.
- Figma imports are limited to eight files, 1.2 MB per file, 1.8 MB data URLs, 10,000px dimensions, and the exact PNG/JPEG/WebP MIME allowlist. Titles and descriptions are bounded before rendering and storage.
- The UI uses React text/attribute rendering and never injects imported values as HTML or executes imported content. No Figma/API URL is fetched, so this workflow adds no SSRF path.
- The generated Figma draft uses a fixed local demo id and an explicit local-storage key; it is not sent to a backend.

## Security tests added

- tests/desktop-recorder.test.mjs checks permission-aware capture controls, local-only status, recording limits, and the absence of unsafe DOM APIs.
- tests/figma-import-workbench.test.mjs checks frame/file/data-URL limits, MIME allowlisting, bounded annotations, local draft storage, and the absence of unsafe DOM APIs.
- tests/download.test.mjs covers the download-page recorder link behavior.
- Existing domain tests continue to cover Figma frame ordering and conversion into demo steps.

## Checks run and results

- npm run format:check — passed.
- npm run verify — passed (format, lint, boundary, and type checks).
- node --test tests — passed (490 passed, 1 skipped, 0 failed).
- npm run build — passed (Next.js production build and API contract/type generation).
- npm audit --omit=dev --audit-level=high — passed (0 vulnerabilities).
- git diff --check — passed.
- Browser verification of `/figma-plugin` — route loaded; connection, empty-export validation, and disabled-before-connect upload state were exercised. File chooser upload and native desktop permission prompts are not automatable in the in-app browser session.

## Checks not run

- A real native screen-picker approval and a file chooser upload were not completed through the in-app browser because those controls require OS/browser UI not exposed by the available browser surface. The remaining risk is limited to the native permission/file-selection boundary and should be manually checked before release.
- Claude's independent security review is not available in this environment. This handoff is intentionally not an approval.

## Dependencies or infrastructure permissions added

- No packages, backend services, IAM actions, or production permissions were added.

## Known limitations and residual risks

- The desktop route is a local browser capture surface, not a native Mac/Windows recorder. Native-app capture depends on browser `getDisplayMedia` support and user permission.
- Figma frame import currently accepts exported image files rather than calling the Figma API or plugin runtime. Production API/plugin synchronization still requires an authenticated, tenant-scoped server integration.
- Local storage and browser blobs can be cleared by the user or browser; the local draft is not a durable backup.
- Manual native permission and file-upload checks remain required before publishing these workflows.

Please review the full diff and surrounding code for OWASP Top 10, tenant isolation,
authentication/authorization, input validation, XSS, SSRF, injection, upload safety,
secret exposure, privacy, dependency risk, insecure cloud configuration, and missing
negative tests. Classify findings as BLOCKER, HIGH, MEDIUM, LOW, or NOTE.
