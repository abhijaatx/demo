# SECURITY REVIEW REQUEST

Change summary:

- Added a browser-local Edit HTML workbench with element selection, bounded text changes, image replacement, hide/redact effects, current/all scope, variable preview, scroll lock, sanitized output, and metadata-only plan download.
- Added editor navigation for HTML/sandbox capture modes and regression tests.

Files changed:

- apps/web/components/html-edit-workbench.tsx
- apps/web/app/edit-html/page.tsx
- apps/web/app/globals.css
- apps/web/components/editor-shell.tsx
- tests/html-edit-workbench.test.mjs

Trust boundaries and sensitive data affected:

- User-provided text, token values, and selected image files are untrusted browser inputs.
- Image files are held in per-element object URLs for the session; no upload or external fetch is performed.
- Sanitized HTML is displayed in a text-only `<pre>` output; captured HTML is never injected into the application DOM.

Authorization model:

- The preview changes only in-memory sample nodes and performs no publish or persistence operation.
- Production HTML editing must enforce authenticated workspace/demo authorization and isolated-origin sandbox rules before storing or rendering captured HTML.

Threats considered:

- Stored/reflected XSS from edited HTML and token values.
- Malicious image uploads, oversized files, and object URL leaks.
- Cross-step edits without explicit scope.
- Scroll-lock and redaction state being silently applied.

Security controls implemented:

- Text and variable fields are bounded; images are allowlisted to PNG/JPEG/WebP/GIF and capped at 12 MB.
- `sanitizeHtmlContent` is used before export/reporting; React text rendering is used for previews instead of HTML sinks.
- Object URLs are revoked on replacement and unmount.
- Scope is visible (current vs all matching) and Save changes is explicit.

Security tests added:

- `tests/html-edit-workbench.test.mjs` checks sanitizer/token usage, bounds, image lifecycle, hide/redact/scroll controls, unsafe API absence, and output styling.

Checks run and results:

- `npm run format:check` — passed.
- `npm run verify` — passed (format, lint, workspace boundaries, and typecheck).
- `node --test tests` — passed (505 passed, 1 skipped).
- `npm run build` — passed (Next.js production build, including `/edit-html`).
- `npm audit --omit=dev --audit-level=high` — passed (0 vulnerabilities).
- `git diff --check` — passed.
- Browser verification completed: edited and redacted a heading, enabled all-matching scope and scroll lock, and saved the sanitized output.

Checks not run:

- Claude security review is unavailable in this environment; independent review remains required before release.
- Native image chooser and decoder behavior are not available in the in-app browser.

Dependencies or infrastructure permissions added:

- None.

Known limitations and residual risks:

- The route is a safe local authoring preview, not a production captured-HTML renderer. Production must use the existing isolated-origin sandbox/CSP policy and media scanning pipeline.
- The repository sanitizer is intentionally lightweight; it must not be treated as a replacement for a maintained HTML parser for untrusted published content.

Please review the full diff and surrounding code for OWASP Top 10, tenant isolation,
authentication/authorization, input validation, XSS, SSRF, injection, upload safety,
secret exposure, privacy, dependency risk, insecure cloud configuration, and missing
negative tests. Classify findings as BLOCKER, HIGH, MEDIUM, LOW, or NOTE.
