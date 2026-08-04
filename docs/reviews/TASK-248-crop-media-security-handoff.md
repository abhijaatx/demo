# SECURITY REVIEW REQUEST

## Change summary

- Added a local Crop Media workbench for screenshot/video steps.
- Added bounded crop coordinates, aspect-ratio presets, Cover/Contain fit modes, per-step selection, bulk apply, and metadata-only plan export.
- Added an editor link and static security regression coverage.

## Files changed

- apps/web/app/crop-media/page.tsx
- apps/web/components/crop-media-workbench.tsx
- apps/web/components/editor-shell.tsx
- apps/web/app/globals.css
- tests/crop-media-workbench.test.mjs

## Trust boundaries and sensitive data affected

- Browser-selected images/videos are rendered through local blob URLs and never uploaded by this route.
- Crop plans contain filenames, media types, fit choices, and normalized coordinates only; production asset updates remain authenticated and tenant-scoped.

## Authorization model

- Local crop, alignment, bulk selection, and plan export are explicit browser actions without server authorization.
- Any future apply/save action must re-authorize the workspace and each asset server-side and create a new immutable revision rather than mutating a published asset.

## Threats considered

- Malicious or oversized local files, unsupported MIME claims, crop values outside the media bounds, path/filename injection, unsafe rendering, cross-tenant asset IDs, and accidental source overwrite.

## Security controls implemented

- Exact image/video MIME allowlist, eight-asset cap, 12 MB per-file cap, 1.2 MB image cap, and bounded display names.
- `validateCropMetadata` plus additional width/height and position clamping guarantees normalized 0–100% crop values with positive dimensions.
- Blob URLs are revoked on removal/unmount; source files remain untouched; plans contain no raw media bytes or network destinations.
- React text rendering and fixed native controls avoid unsafe HTML or dynamic code execution.

## Security tests added

- tests/crop-media-workbench.test.mjs checks file/asset bounds, crop validation, fit/bulk controls, local URL cleanup, metadata-only export, and absence of unsafe DOM/network APIs.
- Existing media-redaction tests cover normalized crop and publication burn-in math.

## Checks run and results

- npm run format:check — passed.
- npm run verify — passed (format, lint, workspace boundaries, and typecheck).
- node --test tests — passed (496 passed, 1 skipped).
- npm run build — passed (Next.js production build, including /crop-media).
- npm audit --omit=dev --audit-level=high — passed (0 vulnerabilities).
- Browser route verification — passed /crop-media empty-state snapshot; native file chooser/media preview remains unavailable in the in-app browser.

## Checks not run

- Real media selection was not completed through the in-app browser because file chooser controls are unavailable there. Manual image/video crop visual checks remain required.
- Claude's independent security review is not available in this environment. This handoff is intentionally not an approval.

## Dependencies or infrastructure permissions added

- No packages, backend services, IAM actions, or production permissions were added.

## Known limitations and residual risks

- The browser workbench records metadata but does not create a processed derivative. Production image/video workers must validate signatures, decode safely, strip metadata, and enforce tenant-scoped publication.
- Preview transforms are illustrative; the server-side renderer must apply the same crop and fit metadata deterministically.

Please review the full diff and surrounding code for OWASP Top 10, tenant isolation,
authentication/authorization, input validation, XSS, SSRF, injection, upload safety,
secret exposure, privacy, dependency risk, insecure cloud configuration, and missing
negative tests. Classify findings as BLOCKER, HIGH, MEDIUM, LOW, or NOTE.
