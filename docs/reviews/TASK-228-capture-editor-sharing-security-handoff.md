# SECURITY REVIEW REQUEST

Change summary:

- Expanded the local workspace Create flow with guided, guided HTML, sandbox, screenshot, video, and media-upload entry modes.
- Added unique draft routes and an explicit `sample=1` read-only marker so reference cards cannot accidentally become editable drafts.
- Added bounded local image/video import handling (100 MB limit, media MIME allowlist, sanitized display names, object URL cleanup).
- Added editor step duplication, deletion, reordering, undo/redo, hotspot destinations, bounded position/size/style controls, and keyboard nudging.
- Added Link, Embed, Export, and Present sharing tabs with local publication manifests, trackable `ref` labels, iframe snippets, Markdown/JSON downloads, and a local viewer route.

Files changed:

- `apps/web/app/demos/[demoId]/edit/page.tsx`
- `apps/web/app/demos/[demoId]/view/page.tsx`
- `apps/web/app/app/page.tsx`
- `apps/web/app/globals.css`
- `apps/web/components/demo-viewer.tsx`
- `apps/web/components/editor-shell.tsx`
- `apps/web/components/home-workspace.tsx`
- `apps/web/components/workspace-reference-surface.tsx`
- `tests/editor-capture-entry.test.mjs`
- `tests/editor-sharing.test.mjs`
- `tests/editor-shell.test.mjs`
- `tests/workspace-reference-actions.test.mjs`
- `docs/reviews/TASK-228-capture-editor-sharing-security-handoff.md`

Trust boundaries and sensitive data affected:

- Browser file inputs and locally generated object URLs are treated as untrusted input.
- Demo documents and publication manifests are persisted in browser local storage as a development-only fallback because the authenticated revision API is not wired into this editor route.
- Viewer analytics events are local telemetry keyed by demo ID and optional bounded `ref` labels.
- Share output crosses the browser UI boundary into clipboard, download, and iframe consumers only after explicit user interaction.

Authorization model:

- Reference/sample routes are read-only only when the server receives the explicit `sample=1` query marker.
- New draft routes are local editor surfaces and do not claim authenticated multi-tenant persistence.
- The existing authenticated API authorization model is unchanged; this slice does not add or bypass server endpoints.
- Publication in this local route is a client-side manifest operation and must not be treated as production authorization or public-link access control.

Threats considered:

- Malicious or oversized upload MIME/size claims.
- Filename injection into titles and Markdown exports.
- Unsafe media URLs in viewer rendering and SOP output.
- Reflected or stored XSS through tooltip text, tracking labels, demo IDs, and document content.
- Cross-tenant access through editable reference IDs or copied local manifests.
- Invalid hotspot coordinates, sizes, destinations, and branching targets.
- Accidental publication of empty documents.
- Clipboard, download, and iframe output misuse.

Security controls implemented:

- Image/video MIME allowlist and 100 MB client-side size limit before object URL creation.
- Filename normalization and bounded tooltip/title/tracking-label lengths.
- Object URL revocation on editor unmount.
- Hotspot coordinate/size/opacity bounds and domain manipulation helpers.
- Safe HTTPS/blob media checks before Markdown export and viewer rendering.
- URL encoding for draft IDs, demo IDs, and tracking labels.
- No `innerHTML`, `dangerouslySetInnerHTML`, `eval`, or dynamic code execution.
- Publish guard requiring at least one step and domain publication diagnostics.
- Focus-trapped shared Modal component for share controls.
- Viewer local-storage parsing through `parseDemoDocument`; malformed local documents fail closed to an empty viewer.

Security tests added:

- `tests/editor-capture-entry.test.mjs` checks upload bounds, MIME handling, object URL cleanup, and the explicit sample marker.
- `tests/editor-sharing.test.mjs` checks link/embed/export/present surfaces, URL/media guards, local viewer storage, and unsafe DOM API absence.
- `tests/editor-shell.test.mjs` checks editor mutation controls, bounded hotspot controls, keyboard movement, and undo/redo.
- Existing domain tests continue to cover publication diagnostics, hotspot manipulation, sharing exports, authorization, and document parsing.

Checks run and results:

- `npm run format` — passed.
- `npm run verify` — passed (format check, ESLint, boundary check, TypeScript build, Next route type generation, web typecheck).
- Targeted editor tests — passed.
- `npm test` — passed (441 tests passed, 1 skipped because the optional API integration environment is unavailable).
- `npm audit --omit=dev --audit-level=high` — passed (0 vulnerabilities).
- `git diff --check` — passed.
- Browser verification — passed for Create mode selection, draft route, read-only sample route, step/hotspot controls, share tabs, publish, and viewer route.

Checks not run:

- Authenticated cross-workspace API integration tests were not exercised because no Supademo credentials were available and this slice does not add server endpoints; run the API integration suite with a configured `.env` before production release.
- Claude security review was not available in this environment and remains required before merge under the repository policy.

Dependencies or infrastructure permissions added:

- None.

Known limitations and residual risks:

- Local publication and draft persistence use browser local storage; production publication must move to authenticated, workspace-scoped revision and public-link APIs before release.
- Imported blob URLs do not survive a full browser restart and are intentionally not uploaded by this slice.
- MP4/GIF rendering, password/expiry gates, domain restrictions, and server-side viewer analytics are not implemented in this batch.
- A Claude security review has not yet been performed in this environment; this handoff is prepared for independent review.

Please review the full diff and surrounding code for OWASP Top 10, tenant isolation,
authentication/authorization, input validation, XSS, SSRF, injection, upload safety,
secret exposure, privacy, dependency risk, insecure cloud configuration, and missing
negative tests. Classify findings as BLOCKER, HIGH, MEDIUM, LOW, or NOTE.
