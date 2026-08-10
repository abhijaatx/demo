SECURITY REVIEW REQUEST

Change summary:

- Added an explicitly enabled, read-only local demo workspace for `/demos` when the local preview flag is set.
- Added explicit Open demo links and corrected the asynchronous route-parameter handling required by the current Next.js release.
- Completed the unpacked browser extension with an explicit active-tab capture action.
- The local fixture contains only synthetic workspace, folder, tag, and demo metadata; it does not call the API.
- Restricted the browser-side fallback to non-production builds on an allowlisted local preview host.
- Allowed the exact desktop-app LAN origin to request Next.js development resources, eliminating the blocked hydration path in local preview.

Files changed:

- apps/web/app/demos/page.tsx
- apps/web/components/demo-dashboard-screen.tsx
- apps/web/next.config.mjs
- tests/demo-dashboard-screen.test.mjs
- apps/web/app/demos/[demoId]/edit/page.tsx
- apps/extension/manifest.json
- apps/extension/background.js
- apps/extension/popup.html
- apps/extension/popup.js
- tests/extension-scaffold.test.mjs

Trust boundaries and sensitive data affected:

- The Demos UI can render a synthetic local fixture instead of authenticated API data only in an explicitly enabled local preview.
- No production credentials, customer data, API responses, uploads, or server mutations are exposed by the fixture.
- Next development resources are permitted only for `10.2.13.175` during development.
- The extension reads only the user-selected active tab's title and cleaned HTTP(S) URL, then stores that metadata in extension-local storage.

Authorization model:

- Normal Demos behavior and all API authorization are unchanged.
- Demo-only data uses a viewer role with only `demo:read`; creation, editing, sharing, folder, and tag mutations remain unavailable in the UI.
- Server activation requires `APP_ENV=local` and `DEMO_ONLY=true`; the client fallback additionally requires a non-production build, `NEXT_PUBLIC_DEMO_ONLY=true`, and an allowlisted local preview hostname.
- Local sample routes are read-only. The browser extension has no host permissions or persistent page scripts; it acts only after the user presses Capture current tab.

Threats considered:

- Accidental fixture exposure in production or a non-local deployment.
- An API outage causing browser error paths or attempts to mutate synthetic records.
- Exposure of customer data, secrets, tenant identifiers, or authentication state through fixture data.
- Cross-origin development-resource loading from an unapproved origin.
- Extension capture of privileged browser pages, query-string secrets, excessive page content, or spoofed extension messages.

Security controls implemented:

- Fixture data is static, synthetic, bounded, and contains no user-controlled fields.
- The fixture bypasses API client calls entirely and is visibly identified as demo-only.
- The fixture presents read-only capabilities, preventing mutation controls from being authorized.
- The client fallback is limited by build mode, explicit flag, and hostname allowlist.
- `allowedDevOrigins` contains one exact LAN origin used by the local desktop preview.
- The extension accepts only HTTP(S) URLs, strips query strings and fragments, bounds values to 500 characters, verifies the extension sender, and requests only `activeTab` and `storage` permissions.

Security tests added:

- `tests/demo-dashboard-screen.test.mjs` asserts the explicit demo-only flag, local-host guard, static fixture, demo-only notice, and exact development-origin allowlist are present.
- `tests/extension-scaffold.test.mjs` verifies the popup and worker assets, rejects broad host/tab permissions and auto-injected content scripts, and checks URL cleaning and message-sender validation.
- Existing Demos client tests continue to assert credentials, CSRF headers, encoded workspace identifiers, idempotency keys, response validation, and no browser secret exposure.

Checks run and results:

- `npm run format` — passed.
- `npm run verify` — passed.
- `npm test` — 395 passed, 1 skipped, 0 failed.
- Browser QA at `http://10.2.13.175:3000/demos` — passed: loading skeleton resolves to the synthetic workspace, the demo-only notice is visible, and the read-only UI is shown.
- Browser QA for `/demos/demo-support-handoff/edit` — passed: Open demo resolves to the sample route and the editor is visibly read-only.

Checks not run:

- Dependency, secret, SAST, container, and infrastructure scans were not rerun. No dependencies, secrets, containers, or infrastructure definitions changed. Chrome runtime installation was not run in this environment, so the extension requires manual load-unpacked verification.

Dependencies or infrastructure permissions added:

- None. The extension uses built-in Manifest V3 APIs only. The Next.js development-origin setting permits only the existing local desktop preview origin and has no production runtime authorization effect.

Known limitations and residual risks:

- The fixed LAN host must be updated if the desktop preview host changes; otherwise development HMR/hydration may be blocked again.
- Local environment files are intentionally ignored and must not be deployed with production configuration.
- This change has not yet received the independent Claude security review required by `AGENTS.md`.
- The extension stores a cleaned local capture record but does not yet upload or turn it into a demo; upload, authentication, and tenant-scoped persistence require the API-backed capture workflow.

Please review the full diff and surrounding code for OWASP Top 10, tenant isolation,
authentication/authorization, input validation, XSS, SSRF, injection, upload safety,
secret exposure, privacy, dependency risk, insecure cloud configuration, and missing
negative tests. Classify findings as BLOCKER, HIGH, MEDIUM, LOW, or NOTE.
