# Security review request — TASK-240 export workflows

## Change summary

- Added Copy Steps HTML and plain-text exports alongside the existing Markdown/JSON downloads.
- Added a printable PDF workflow and a bounded PNG contact-sheet export in the Share → Export panel.
- Added MP4/GIF export controls for resolution, frame rate, slide duration, and transition delay.
- Added a browser `MediaRecorder` renderer with an explicit WebM fallback when the requested encoder is unavailable.

## Files changed

- `packages/domain/src/sharing-exports.ts`
- `packages/domain/src/index.ts`
- `apps/web/src/lib/export-client.ts`
- `apps/web/components/editor-shell.tsx`
- `apps/web/app/globals.css`
- `tests/sharing-exports.test.mjs`
- `tests/editor-sharing.test.mjs`

## Trust boundaries and sensitive data affected

- Creator-authored demo text, chapter labels, hotspot descriptions, and media URLs are copied or rendered into export artifacts.
- Browser canvas and MediaRecorder APIs process local demo media and can request safe HTTPS image assets.
- Printable HTML is opened as a Blob URL; no server-side export endpoint or new credential flow is introduced.
- Export filenames are derived from the demo ID and normalized before download.

## Authorization model

- Export actions remain inside the existing editor Share panel and inherit its read-only guard for publishing and mutations.
- Exported content is generated from the current editor document after the existing `safeExportDocument` sanitization pass.
- No new API, tenant lookup, or public access path is added. Production server exports still need the same workspace authorization and publication policy as the source demo.

## Threats considered

- Stored or reflected XSS through copied HTML, Markdown, print markup, or canvas text.
- Unsafe image URLs, credential-bearing URLs, `javascript:` schemes, and storage-path leakage.
- Filename path traversal or shell-like characters in downloaded artifact names.
- Unbounded media loads, canvas dimensions, step counts, frame rates, and recording duration.
- Cross-origin image loads tainting the canvas or leaking credentials.
- Browser encoder differences producing mislabeled MP4/GIF files.

## Security controls implemented

- Copy Steps HTML escapes all user text and permits only HTTPS or blob media URLs; text output omits media storage paths.
- Rich clipboard writes include both sanitized `text/html` and plain-text representations, with a plain-text fallback.
- PNG and video renders are bounded to 70 steps; resolutions are limited to 720p, 1080p, or 4K, and frame rate/durations are clamped.
- Image loads are restricted to HTTPS or blob URLs, omit credentials, use anonymous CORS for HTTPS, and time out after five seconds.
- MP4/GIF output uses the browser-reported MIME type and extension; unsupported encoders produce an explicitly labeled WebM fallback instead of a mislabeled file.
- Download names are reduced to `[a-zA-Z0-9._-]` and capped at 80 characters.
- Printable exports use a Blob URL and static CSS; no `document.write`, `innerHTML`, `eval`, or dynamic script is used.

## Security tests added

- `tests/sharing-exports.test.mjs` verifies HTML escaping, unsafe media omission, safe copy text, popup SDK allowlisting, and bounded IDs.
- `tests/editor-sharing.test.mjs` verifies the Share panel exposes Copy Steps, PDF/PNG, and MP4/GIF controls without unsafe DOM APIs.
- Existing export, publication, safe-URL, upload, and tenant-boundary tests remain in the suite.

## Checks run and results

- `npm run format` — passed.
- `npx tsc --build` — passed.
- `node --test tests/sharing-exports.test.mjs tests/editor-sharing.test.mjs` — passed (5 tests).
- `npm run verify` — passed (format check, ESLint, workspace boundaries, and TypeScript).
- `npm run build` — passed (Next.js production build and static route generation).
- `node --test tests` — passed (476 passed, 1 skipped, 0 failed).
- `npm audit --omit=dev --audit-level=high` — passed (0 vulnerabilities).
- `git diff --check` — passed.
- Browser verification — Copy Steps HTML/Text, PNG, MP4, and GIF fallback controls exercised; rich HTML clipboard status appeared, MP4 downloaded, and GIF produced the documented WebM fallback.

## Checks not run

- The browser harness blocked the PDF button's Blob-window navigation by its own security policy; the safe fallback/download path remains covered by code review and type/tests, but a normal browser should verify the print window manually.
- Claude security review is not available in this environment; independent review remains required before production release.

## Dependencies or infrastructure permissions added

- None.

## Known limitations and residual risks

- PDF is implemented as a print-ready HTML document; the user must choose Print → Save as PDF in the browser. A production server renderer would be needed for unattended PDF files.
- GIF encoding is not available through standard browser MediaRecorder in this environment, so GIF requests may download WebM with an explicit status. A production worker should transcode to true GIF/MP4 with strict CPU, duration, and output-size limits.
- Canvas exports omit media that cannot be loaded with safe anonymous CORS and use a placeholder instead of weakening the URL policy.
- Browser-only exports do not replace server-side authorization, tenant scoping, retention, or audit logging for production artifacts.

Please review the full diff and surrounding code for OWASP Top 10, tenant isolation,
authentication/authorization, input validation, XSS, SSRF, injection, upload safety,
secret exposure, privacy, dependency risk, insecure cloud configuration, and missing
negative tests. Classify findings as BLOCKER, HIGH, MEDIUM, LOW, or NOTE.
