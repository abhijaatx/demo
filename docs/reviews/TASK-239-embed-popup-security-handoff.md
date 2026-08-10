# Security review request — TASK-239 embedded viewer, events, and popup embeds

## Change summary

- Added a first-party `/e/[demoId]` route for responsive iframe embedding without editor chrome.
- Added Supademo-compatible iframe `postMessage` events for load, start, slide changes, progress, completion, and close.
- Added popup-preview behavior in the share panel and generated popup trigger snippets for hosted SDK use.
- Added strict URL and identifier handling for generated popup snippets.

## Files changed

- `apps/web/app/e/[demoId]/page.tsx`
- `apps/web/components/demo-viewer.tsx`
- `apps/web/components/editor-shell.tsx`
- `apps/web/app/globals.css`
- `packages/domain/src/iframe-embeds.ts`
- `packages/domain/src/index.ts`
- `tests/embed-viewer.test.mjs`
- `tests/sharing-exports.test.mjs`

## Trust boundaries and sensitive data affected

- The embedded viewer communicates with an embedding parent window through `window.postMessage`.
- `document.referrer` is used only to derive the parent origin for event delivery; no message is sent with a wildcard target.
- Popup preview renders the first-party viewer in an iframe inside an editor dialog.
- Creator-controlled demo IDs and optional SDK URL inputs are encoded or allowlisted before being placed in copied HTML/JavaScript snippets.
- Published demo documents may contain viewer-entered form data and media metadata already handled by the existing viewer path.

## Authorization model

- The new route does not add a privileged API or bypass editor authorization; it resolves the same locally published viewer document used by the existing preview.
- The share-panel controls remain inside the existing editor write flow.
- Popup preview is a local creator preview and does not grant editor permissions to the iframe.
- Production public embedding still requires a server-backed, tenant-scoped publication and explicit public-link policy; browser local storage is not an authorization boundary.

## Threats considered

- Cross-origin event leakage, forged parent messages, and wildcard `postMessage` targets.
- XSS or JavaScript injection through demo IDs, SDK URLs, and copied embed markup.
- Popup iframe escape, accidental editor-cookie exposure, and event payload over-sharing.
- Cross-tenant access if an attacker changes the embedded demo identifier.
- Unsafe external script origins and malformed/referrer-less embedding contexts.

## Security controls implemented

- Event targets are restricted to the parsed `document.referrer` origin and are omitted when no trustworthy parent origin exists.
- Event envelopes use the documented `source: "Supademo"` and bounded, typed payload fields.
- Demo IDs are trimmed, length-bounded, URL-encoded, and apostrophe-escaped before insertion into the popup snippet.
- Popup SDK URLs are restricted to `https://script.supademo.com/supademo.js`; invalid or untrusted origins fall back to that fixed URL.
- The embedded route omits editor navigation chrome and does not render copied snippet strings as HTML.
- Existing safe URL validation and local publication checks remain in the viewer for hotspot/chapter navigation.

## Security tests added

- `tests/embed-viewer.test.mjs` checks the embedded route, event names, parent-targeted messaging, and share-panel controls.
- `tests/sharing-exports.test.mjs` checks demo-ID encoding and rejection of an untrusted SDK origin.
- Existing viewer, sharing, and safe-URL tests continue to cover navigation and public-viewer behavior.

## Checks run and results

- `npm run format` — passed.
- `npm run verify` — passed (format, lint, workspace boundaries, and typecheck).
- `npm run build` — passed (API contract/types and Next.js production build).
- `npx tsc --build` — passed.
- `node --test tests/sharing-exports.test.mjs tests/embed-viewer.test.mjs tests/embed-events-api.test.mjs tests/popup-sdk.test.mjs` — passed (7 tests).
- `npm test` — 475 passed, 1 optional API integration skipped, 0 failed (476 total).
- `npm audit --omit=dev --audit-level=high` — 0 vulnerabilities.
- `git diff --check` — passed.
- Browser verification — passed for `/e/share-check`, Share → Embed copy actions, Present → Open popup preview, popup close, and popup iframe source.

## Checks not run

- Claude security review is not available in this environment; independent review remains required before production release.
- A cross-origin automated browser harness was not available, so event delivery was verified by source/tests rather than a live external parent page.

## Dependencies or infrastructure permissions added

- None.

## Known limitations and residual risks

- The local route reads the browser-local published document fallback. Production must resolve public demo IDs server-side with tenant scope, publication state, access policy, rate limits, and audit logging.
- The popup snippet relies on the hosted Supademo SDK when copied to an external site; the local development origin is not a production embed host.
- Events are intentionally suppressed when `document.referrer` is absent or unparsable. A production integration should document this behavior and validate the receiving origin independently.
- The iframe is first-party application content. Any future rendering of untrusted captured HTML must use the separate-origin, restrictive sandbox/CSP design required by `AGENTS.md`.

Please review the full diff and surrounding code for OWASP Top 10, tenant isolation,
authentication/authorization, input validation, XSS, SSRF, injection, upload safety,
secret exposure, privacy, dependency risk, insecure cloud configuration, and missing
negative tests. Classify findings as BLOCKER, HIGH, MEDIUM, LOW, or NOTE.
