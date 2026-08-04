# TASK-251 security handoff: blur and annotate

SECURITY REVIEW REQUEST

Change summary:

- Added a screenshot-only Blur & Annotate workbench with bounded blur/redaction regions, intensity controls, permanent-redaction marking, and annotation layers.
- Added a download manifest that separates preview overlays from permanent redactions and uses pixel coordinates for later worker burn-in.
- Added an editor capture entry link to the workflow.

Files changed:

- apps/web/app/blur-annotate/page.tsx
- apps/web/components/blur-annotate-workbench.tsx
- apps/web/components/editor-shell.tsx
- apps/web/app/globals.css
- tests/blur-annotate-workbench.test.mjs
- tests/editor-capture-entry.test.mjs

Trust boundaries and sensitive data affected:

- User-selected screenshots may contain names, emails, phone numbers, or other private information.
- Preview overlays and generated JSON are browser-local until an authenticated upload/burn-in pipeline is connected.

Authorization model:

- The route is a local planning surface and does not publish or persist a demo.
- A production redaction worker must enforce workspace authorization before reading source assets or applying a manifest.

Threats considered:

- False privacy from a visual blur overlay that leaves source pixels intact.
- XSS through annotation copy or file names.
- Out-of-bounds or negative redaction coordinates.
- Unsupported video input being mistaken for a protected screenshot.
- Leakage of local blob URLs in exported manifests.

Security controls implemented:

- Exact PNG/JPEG/WebP allowlist and 12 MB cap.
- Screenshot-only warning; video input is rejected.
- Region coordinates, dimensions, intensity, layer counts, and text are bounded.
- Annotation text passes the shared sanitizer before rendering/export.
- Permanent redactions are explicitly marked and passed through generateRedactionBurnInManifest; non-permanent overlays are excluded from burn-in coordinates.
- Downloaded output excludes blob storage paths and remains metadata-only.
- Object URLs are revoked on replacement and unmount.
- No unsafe HTML, network request, dynamic code, or server mutation is used.

Security tests added:

- tests/blur-annotate-workbench.test.mjs verifies caps, permanent-redaction UX, sanitizer/manifest use, screenshot-only behavior, cleanup, and unsafe API absence.
- Existing tests/annotation-primitives.test.mjs, tests/media-redaction.test.mjs, and tests/interactive-editing-qualification.test.mjs cover sanitizer and burn-in math.

Checks run and results:

- npm run format:check — passed.
- npm run verify — passed (format, lint, workspace boundaries, and typecheck).
- node --test tests — passed (499 passed, 1 skipped).
- npm run build — passed (Next.js production build, including /blur-annotate).
- npm audit --omit=dev --audit-level=high — passed (0 vulnerabilities).
- Browser route verification — passed empty-state validation and safe error state when blur is attempted without a screenshot.

Checks not run:

- Native image chooser and real image rendering were not available in the in-app browser. A real browser should exercise malformed image fixtures and visually confirm redaction placement.

Dependencies or infrastructure permissions added:

- None.

Known limitations and residual risks:

- The local preview is not a privacy boundary. Production publication must burn permanent redactions into a validated derivative and keep the raw asset private.
- The current UI uses user-entered coordinates rather than drag hit-testing; server-side manifest validation must repeat all bounds and asset authorization checks.

Please review the full diff and surrounding code for OWASP Top 10, tenant isolation,
authentication/authorization, input validation, XSS, SSRF, injection, upload safety,
secret exposure, privacy, dependency risk, insecure cloud configuration, and missing
negative tests. Classify findings as BLOCKER, HIGH, MEDIUM, LOW, or NOTE.
