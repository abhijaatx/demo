SECURITY REVIEW REQUEST

Change summary:

- Added a local `/extension-import` route that validates bounded JSON exported by the Chrome extension.
- Added a manual/hover-target capture action to the extension and routed the popup workspace action to the importer.
- Stored imported screenshots in browser-only IndexedDB before opening the editor.

Files changed:

- apps/extension/background.js
- apps/extension/content.js
- apps/extension/popup.html
- apps/extension/popup.js
- apps/web/app/extension-import/page.tsx
- apps/web/components/extension-import-workbench.tsx
- apps/web/src/lib/local-capture-storage.ts
- apps/web/components/editor-shell.tsx
- apps/web/app/globals.css
- tests/extension-import-workbench.test.mjs

Trust boundaries and sensitive data affected:

- Untrusted extension-exported JSON and base64 image data cross from a browser extension into the local web UI.
- Captured page URLs and interaction labels are rendered in the local importer; screenshot blobs remain browser-local.

Authorization model:

- The extension requires a user action and `activeTab`; its message handlers accept only messages from the extension runtime ID.
- The importer is a local, unauthenticated workflow and does not publish or call a protected API. Editor publishing remains behind the existing server authorization flow.

Threats considered:

- Malformed/oversized JSON, data URL abuse, unsafe schemes, XSS through page metadata, extension message spoofing, and accidental secret capture.

Security controls implemented:

- 8 MB JSON, 30-step, 1.8 MB screenshot, bounded text, and HTTP(S)-only URL limits.
- Base64 data is decoded only through an allowlist parser; React text rendering avoids HTML injection.
- Extension messages validate runtime sender identity; sensitive form events continue to be skipped.
- IndexedDB bundles have schema, MIME, count, dimension, and aggregate size validation.

Security tests added:

- tests/extension-import-workbench.test.mjs checks validation bounds, manual capture wiring, sender-safe extension controls, and unsafe DOM API absence.

Checks run and results:

- npm run format (passed)
- npm run verify (passed after fixes)
- Focused extension/import tests (to run with the batch suite)

Checks not run:

- Live Chrome extension capture and local-browser interaction were unavailable because the in-app browser refused the local URL; run manually with a loaded unpacked extension.

Dependencies or infrastructure permissions added:

- None.

Known limitations and residual risks:

- A user can still intentionally capture sensitive content from the active tab; the extension skips common sensitive input events but cannot classify all page secrets.
- The importer is local-only and does not replace server-side authorization or upload scanning.

Please review the full diff and surrounding code for OWASP Top 10, tenant isolation,
authentication/authorization, input validation, XSS, SSRF, injection, upload safety,
secret exposure, privacy, dependency risk, insecure cloud configuration, and missing
negative tests. Classify findings as BLOCKER, HIGH, MEDIUM, LOW, or NOTE.

Claude security review status: unavailable in this environment; an independent Claude review is required before merge.
