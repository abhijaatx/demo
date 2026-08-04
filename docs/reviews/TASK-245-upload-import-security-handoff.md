# SECURITY REVIEW REQUEST

## Change summary

- Added a local upload workbench for screenshots, videos, PDFs, and PowerPoint files.
- Added bounded file selection, drag-and-drop, previews, reorder/remove controls, step titles and descriptions, and a local draft handoff to the existing editor.
- Added download-page and editor links plus static security regression coverage.

## Files changed

- apps/web/app/upload/page.tsx
- apps/web/components/upload-import-workbench.tsx
- apps/web/components/editor-shell.tsx
- apps/web/components/marketing-download.tsx
- apps/web/app/globals.css
- tests/upload-import-workbench.test.mjs
- tests/download.test.mjs

## Trust boundaries and sensitive data affected

- The browser receives user-selected image, video, PDF, and presentation files. Images are converted to bounded data URLs; other accepted files use browser-generated blob URLs for local previews.
- The workbench does not call an API or upload files. The local draft is stored in `localStorage` only when the user explicitly exports it and is then opened in the existing editor.
- Production upload, malware scanning, media processing, quotas, object storage, and tenant publication remain the responsibility of the authenticated upload-session APIs.

## Authorization model

- File selection, reorder, annotation, and local export are creator-initiated browser operations with no server authorization decision.
- The editor and any future save/publish action must continue to enforce authenticated identity, workspace scope, upload authorization, and object access server-side. A local draft id or blob URL is not an authorization token.

## Threats considered

- Malicious files, parser/preview abuse, oversized image/video memory use, too many files, path/filename injection, and persistent XSS through titles or descriptions.
- Blob URL lifetime and local-storage quota failures, unsafe network upload, SSRF, and cross-workspace publication from client-provided asset ids.

## Security controls implemented

- Exact MIME allowlists for PNG/JPEG/WebP, MP4/WebM/QuickTime, PDF, and PowerPoint formats.
- At most eight files per draft, 12 MB per file, 1.2 MB per image, 1.8 MB inline image data, 10,000px image dimensions, and bounded titles/descriptions.
- Filenames are normalized for display, imported values render through React text/attributes, and no unsafe HTML or dynamic code execution is used.
- Blob URLs are created only for accepted local files and revoked on removal. The editor handoff uses a fixed draft id and an explicit local-storage write; no upload request is made.
- Export errors fail closed when local storage is unavailable or over quota.

## Security tests added

- tests/upload-import-workbench.test.mjs checks the file/type/size limits, local object URL and storage boundaries, reorder/annotation controls, no-network behavior, and absence of unsafe DOM APIs.
- tests/download.test.mjs checks the local upload route link.
- Existing editor capture and upload-session tests continue to cover media URL sanitization and authenticated server uploads.

## Checks run and results

- npm run format:check — passed.
- npm run verify — passed (format, lint, workspace boundaries, and typecheck).
- node --test tests — passed (493 passed, 1 skipped).
- npm run build — passed (Next.js production build, including /upload).
- npm audit --omit=dev --audit-level=high — passed (0 vulnerabilities).
- Browser route verification — passed /upload route snapshot and empty export validation; native file chooser selection remains unavailable in the in-app browser.

## Checks not run

- File chooser upload of real media was not completed through the in-app browser because its available control surface does not expose `input[type=file]` selection. Manual checks with representative images, videos, PDFs, and presentations remain required.
- Claude's independent security review is not available in this environment. This handoff is intentionally not an approval.

## Dependencies or infrastructure permissions added

- No packages, backend services, IAM actions, or production permissions were added.

## Known limitations and residual risks

- Non-image uploads use blob URLs and are intentionally transient; refreshing or leaving the browser document can invalidate them.
- This workbench is a local preparation path. A production upload path must stream files through the existing authenticated, tenant-scoped upload sessions and media validation workers.
- PDF and presentation files are not parsed in the browser; they are handed off as local document media for later processing.

Please review the full diff and surrounding code for OWASP Top 10, tenant isolation,
authentication/authorization, input validation, XSS, SSRF, injection, upload safety,
secret exposure, privacy, dependency risk, insecure cloud configuration, and missing
negative tests. Classify findings as BLOCKER, HIGH, MEDIUM, LOW, or NOTE.
