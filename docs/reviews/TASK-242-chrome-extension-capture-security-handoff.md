# SECURITY REVIEW REQUEST

## Change summary

- Expanded the Chrome and Edge Manifest V3 extension from a single active-tab metadata capture into an explicit, user-started recording workflow.
- Added Screenshot, HTML hotspot, and Video capture modes, pause/resume/stop controls, instant screenshots, keyboard shortcuts, download-to-JSON, and a local workspace handoff.
- Added proactive capture warnings for viewport aspect ratio, excessive open tabs, unsupported pages, and very large DOMs, with one-click local fixes.
- Added bounded event capture for clicks, inputs, scrolls, and keyboard metadata. Raw input values and printable key values are never sent or stored.

## Files changed

- apps/extension/manifest.json
- apps/extension/background.js
- apps/extension/content.js
- apps/extension/popup.html
- apps/extension/popup.js
- tests/extension-scaffold.test.mjs

## Trust boundaries and sensitive data affected

- The extension receives browser-tab metadata, visible screenshots, and interaction metadata from a user-selected tab.
- Captured state is stored in chrome.storage.local on the creator's device until the user clears it or downloads it.
- The extension does not send capture data to a server. The workspace button only opens the fixed local development route http://localhost:3000/demos?new=1&capture=extension.
- Page content is untrusted. The extension deliberately excludes input values, text content, arbitrary selectors, and raw keystrokes.

## Authorization model

- The extension requests only activeTab, scripting, and storage permissions. It does not request tabs, host permissions, or all_urls.
- Recording starts only from the extension popup or the registered command shortcut while the user has an active tab.
- Background messages are accepted only when sender.id equals the extension runtime id.
- Capture events are accepted only from the tab id recorded in the active recording state.
- Sensitive-field events are skipped before screenshots or event data are persisted.

## Threats considered

- Secret and personal-data capture from password, payment, token, and other sensitive fields.
- Malicious or oversized page metadata causing extension-storage denial of service.
- Cross-tab event injection and forged runtime messages.
- Capturing browser-internal or unsupported pages.
- Screenshot and JSON export size exhaustion.
- XSS in extension UI from warning, step, or stored-state values.
- Accidental URL credential exposure through query strings.
- Extension permission overreach and unbounded content-script injection.

## Security controls implemented

- Explicit activeTab plus scripting permissions; no host-wide permissions, content_scripts declaration, or tabs permission.
- URL normalization accepts only http and https, strips query strings and fragments, and bounds the resulting value.
- Titles, element hints, warning messages, identifiers, coordinates, scroll positions, event types, and settings are allowlisted or length/range bounded.
- Password and payment-like fields are detected from type, autocomplete, name, and id metadata; raw values never enter the event payload.
- Printable keys are reduced to the literal category character; only a small allowlist of navigation keys is retained.
- At most 50 steps are retained. Screenshots are PNG data URLs capped at 1.8 MB each, and stored state is capped at 7 MB with screenshot stripping as a final quota guard.
- Stored state is normalized again when read, so tampered extension storage cannot reintroduce arbitrary fields into the popup.
- Popup rendering uses textContent and DOM node creation rather than HTML interpolation.
- Runtime and tab sender checks prevent untrusted pages or other tabs from appending to a recording.
- Keyboard shortcuts are explicit and local: Command or Ctrl+Shift+8 toggles recording, and Command or Ctrl+Shift+9 captures a screenshot.

## Security tests added

- tests/extension-scaffold.test.mjs verifies least-privilege manifest permissions, shortcut declarations, sender checks, storage bounds, content-script messaging, sensitive-field handling, and the absence of unsafe DOM APIs or raw input access.
- node --check is run against all three extension JavaScript files.

## Checks run and results

- npm run format:check — passed.
- npm run lint — passed.
- npm run check:boundaries — passed.
- npm run typecheck — passed.
- node --test tests/extension-scaffold.test.mjs — passed.
- Browser verification of the fixed local workspace handoff route — passed; the route opens the create-demo dialog.

## Checks not run

- A full unpacked Chrome/Edge extension session was not available through the in-app browser, so installing the extension, granting activeTab, and exercising captureVisibleTab in a real browser profile remains a manual release check.
- Claude's independent security review was not available in this environment. This handoff is intentionally not an approval.

## Dependencies or infrastructure permissions added

- No packages, backend services, IAM actions, or production permissions were added.

## Known limitations and residual risks

- Captures remain local to chrome.storage.local and are not yet uploaded into the authenticated workspace API; the JSON download is the current handoff boundary.
- Screenshot capture depends on browser support for activeTab and captureVisibleTab and will fail on browser-internal pages.
- The local workspace handoff URL is intentionally development-only and must be replaced with a configured, authenticated origin before production distribution.
- Manual Chrome/Edge install and end-to-end capture testing is still required before publishing the extension.

Please review the full diff and surrounding code for OWASP Top 10, tenant isolation,
authentication/authorization, input validation, XSS, SSRF, injection, upload safety,
secret exposure, privacy, dependency risk, insecure cloud configuration, and missing
negative tests. Classify findings as BLOCKER, HIGH, MEDIUM, LOW, or NOTE.
