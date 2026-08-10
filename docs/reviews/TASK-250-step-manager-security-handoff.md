# TASK-250 security handoff: step manager

SECURITY REVIEW REQUEST

Change summary:

- Added a local step-management workbench for the documented add, replace, duplicate, delete, reorder, and multi-select step flows.
- Added an editor capture entry link to the step manager.
- Source media stays in browser blob URLs; the downloadable plan contains only bounded step IDs, ordering, titles, and media types.

Files changed:

- apps/web/app/step-manager/page.tsx
- apps/web/components/step-manager-workbench.tsx
- apps/web/components/editor-shell.tsx
- apps/web/app/globals.css
- tests/step-manager-workbench.test.mjs
- tests/editor-capture-entry.test.mjs

Trust boundaries and sensitive data affected:

- Browser-selected screenshot and video files are untrusted local input.
- The workbench manipulates local storyboard metadata and creates temporary blob URLs.
- No upload endpoint, remote fetch, server-side media processing, or credential is touched by this route.

Authorization model:

- The workbench is a local planning surface and does not persist or publish server data.
- Production editor authorization remains enforced by the existing demo API and editor route; this route must not be treated as a replacement for server-side authorization.

Threats considered:

- Oversized or unsupported media files.
- Blob URL leakage through exported metadata.
- XSS through file names or editable step titles.
- Selection/order corruption during bulk duplicate, delete, and move operations.

Security controls implemented:

- Exact MIME allowlist and 100 MB file-size cap.
- Step count and title length bounds.
- Filename normalization for display titles.
- Object URL revocation on replacement and unmount.
- Export excludes storage paths and source file names.
- Uses existing domain step-operation helpers for duplicate, delete, and reorder behavior.
- No dynamic HTML, script evaluation, network request, or server mutation from the workbench.

Security tests added:

- tests/step-manager-workbench.test.mjs verifies limits, operation controls, object URL cleanup, and absence of unsafe DOM/network APIs.
- tests/editor-capture-entry.test.mjs verifies discoverability from the editor capture surface.

Checks run and results:

- npm run format:check — passed.
- npm run verify — passed (format, lint, workspace boundaries, and typecheck).
- node --test tests — passed (499 passed, 1 skipped).
- npm run build — passed (Next.js production build, including /step-manager).
- npm audit --omit=dev --audit-level=high — passed (0 vulnerabilities).
- Browser route verification — passed /step-manager empty state, single-step duplicate, multi-select move, and bounded action states.

Checks not run:

- Native file chooser, decoder signature validation, and real media playback were not available in the in-app browser. A real browser should exercise valid and malformed media fixtures before release.

Dependencies or infrastructure permissions added:

- None.

Known limitations and residual risks:

- This local workbench does not upload or save media to the authenticated workspace. Server-side media validation, quota enforcement, and tenant authorization remain required when the flow is connected to persistence.
- Browser MIME declarations are not a sufficient server-side file-type check; production upload finalization must validate signatures and decoder results.

Please review the full diff and surrounding code for OWASP Top 10, tenant isolation,
authentication/authorization, input validation, XSS, SSRF, injection, upload safety,
secret exposure, privacy, dependency risk, insecure cloud configuration, and missing
negative tests. Classify findings as BLOCKER, HIGH, MEDIUM, LOW, or NOTE.
