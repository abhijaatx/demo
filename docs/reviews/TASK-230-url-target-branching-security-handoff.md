# SECURITY REVIEW REQUEST

Change summary:

- Extended hotspot actions with safe `open_url` destinations alongside step-targeted navigation.
- Added an editor destination option and bounded URL field for hotspot and branch-choice flows.
- Added viewer navigation for validated relative, HTTP, and HTTPS URLs.
- Sanitized URL actions during document parsing and export, and restored local drafts when reopening an editor route.

Files changed:

- `packages/domain/src/demo-document.ts`
- `packages/domain/src/hotspot-schema.ts`
- `packages/domain/src/hotspot-navigation.ts`
- `apps/web/components/editor-shell.tsx`
- `apps/web/components/demo-viewer.tsx`
- `apps/web/app/globals.css`
- `tests/hotspot-schema.test.mjs`
- `tests/hotspot-navigation.test.mjs`
- `tests/editor-shell.test.mjs`
- `tests/editor-sharing.test.mjs`
- `docs/reviews/TASK-230-url-target-branching-security-handoff.md`

Trust boundaries and sensitive data affected:

- Creator-entered hotspot URLs are persisted in the browser-only local draft/publication fallback and rendered as viewer navigation.
- A viewer click can cross from the local viewer to a creator-selected relative, HTTP, or HTTPS destination.
- No server endpoint, workspace record, OAuth token, or authenticated tenant boundary was added.

Authorization model:

- URL target editing follows the existing editor `readOnly` guard; read-only sample routes cannot mutate hotspots.
- Local publication remains a client-side MVP fallback and is not a production public-link or workspace authorization boundary.
- Server-backed publication must revalidate URL destinations and workspace ownership before release.

Threats considered:

- `javascript:`, `data:`, `vbscript:`, malformed, or control-character URLs causing script execution or unsafe redirects.
- Unsafe URL values leaking through JSON/SOP exports, local storage, or viewer navigation.
- Broken step targets or malformed stored documents causing viewer crashes.
- Cross-tenant or open-redirect behavior through client-created demo IDs and local drafts.

Security controls implemented:

- `validateSafeUrl` is applied when parsing, editing, resolving, rendering, and exporting URL actions.
- Only relative, HTTP, and HTTPS URLs are accepted; unsafe schemes fail closed to linear navigation or a broken URL diagnostic.
- URL input is bounded to 2,048 characters and marks invalid drafts with `aria-invalid` without executing them.
- Viewer navigation calls `location.assign` only with a validated URL; no `innerHTML`, dynamic code execution, or server-side fetching is introduced.
- Local draft hydration parses documents through the canonical parser and ignores malformed or mismatched demo IDs.

Security tests added:

- `tests/hotspot-schema.test.mjs` verifies valid URL actions and unsafe-scheme fallback.
- `tests/hotspot-navigation.test.mjs` verifies validated URL navigation results and unsafe-link diagnostics.
- `tests/editor-shell.test.mjs` and `tests/editor-sharing.test.mjs` verify the URL controls and unsafe-DOM contract.
- Browser verification covered selecting `Open URL`, entering a relative destination, publishing, following the viewer hotspot, reopening the draft, and rejecting a `javascript:` value with `aria-invalid=true`.

Checks run and results:

- `npm run format` — passed.
- `npm run verify` — passed (format check, ESLint, workspace boundaries, TypeScript, Next route type generation, and web typecheck).
- Targeted URL/editor tests — passed (10 tests).
- `npm test` — passed (444 tests passed, 1 skipped because the optional API integration environment is unavailable).
- `npm audit --omit=dev --audit-level=high` — passed (0 vulnerabilities).
- `git diff --check` — passed.

Checks not run:

- Authenticated cross-workspace API integration tests require configured credentials and are not exercised by this client-only slice; run them with the repository `.env` before production release.
- Claude's independent security review is unavailable in this environment and remains required before merge under the repository policy.

Dependencies or infrastructure permissions added:

- None.

Known limitations and residual risks:

- URL targets are currently client-side/local-MVP behavior; production publication must enforce an explicit URL policy and audit navigation server-side.
- The observed Supademo capability supports step or URL destinations; persona/form conditions, URL target analytics, and server-backed lead routing remain future slices.
- Same-tab navigation is implemented; an explicit new-tab target was not added because it was not exposed by the observed workflow.

Please review the full diff and surrounding code for OWASP Top 10, tenant isolation,
authentication/authorization, input validation, XSS, SSRF, injection, upload safety,
secret exposure, privacy, dependency risk, insecure cloud configuration, and missing
negative tests. Classify findings as BLOCKER, HIGH, MEDIUM, LOW, or NOTE.
