# SECURITY REVIEW REQUEST

Change summary:

- Added a browser-local Voiceovers 2.0 workbench with per-step scripts, bounded AI voice settings, sync-all voice settings, expressive mode, speed/stability, upload validation, clone/manual recording workflow states, pronunciation library, and metadata-only plan download.
- Added an editor capture link and regression coverage.

Files changed:

- apps/web/components/voiceovers-workbench.tsx
- apps/web/app/voiceovers/page.tsx
- apps/web/app/globals.css
- apps/web/components/editor-shell.tsx
- tests/voiceovers-workbench.test.mjs

Trust boundaries and sensitive data affected:

- Narration text and pronunciation entries are untrusted browser state and can be included in a local plan download.
- Uploaded audio is validated by exact MIME allowlist and 25 MB limit, held in an object URL for the current tab, and never sent to a server by this workbench.
- Clone and manual record controls intentionally do not request microphone permission or retain microphone data.

Authorization model:

- No account, workspace, publishing, or voice-provider action is performed by this preview route.
- Production AI generation and persistence continue through the existing authenticated editor flow, which must enforce workspace authorization server-side.

Threats considered:

- Oversized or unexpected audio uploads.
- Persistent storage or secret leakage from uploaded audio/object URLs.
- Unbounded scripts, pronunciation fields, or library growth.
- Misleading microphone/voice-clone behavior.
- XSS or dynamic execution through narration text and plan downloads.

Security controls implemented:

- Script length is capped at 4,000 characters; pronunciation entries are capped at 64 and 160 characters per field.
- Audio MIME types are allowlisted and files are capped at 25 MB; object URLs are revoked on unmount.
- Downloaded plans contain state only and explicitly mark clone capture as false; UI states disclose the browser-local limitation.
- No `fetch`, HTML injection, dynamic code execution, or secret-bearing provider requests are introduced.

Security tests added:

- `tests/voiceovers-workbench.test.mjs` checks bounds, upload cleanup hooks, clone/manual-record disclosure, pronunciation controls, unsafe API absence, and CSS surface.

Checks run and results:

- `npm run format:check` — passed.
- `npm run verify` — passed (format, lint, workspace boundaries, and typecheck).
- `node --test tests` — passed (502 passed, 1 skipped).
- `npm run build` — passed (Next.js production build, including `/voiceovers`).
- `npm audit --omit=dev --audit-level=high` — passed (0 vulnerabilities).
- `git diff --check` — passed.
- Browser verification — passed `/voiceovers` step selection, pronunciation add/toggle, clone recording state, and bounded voice controls.

Checks not run:

- Claude security review is unavailable in this environment; independent review remains required before release.
- Native file chooser, microphone permission, and real audio capture are not exercised in the in-app browser.

Dependencies or infrastructure permissions added:

- None.

Known limitations and residual risks:

- This route does not synthesize or persist audio. Existing editor generation/upload paths remain the production integration and need their own provider, quota, and authorization review.
- Object URL state is session-local and does not provide malware scanning or media transcoding; production upload finalization must retain those controls.

Please review the full diff and surrounding code for OWASP Top 10, tenant isolation,
authentication/authorization, input validation, XSS, SSRF, injection, upload safety,
secret exposure, privacy, dependency risk, insecure cloud configuration, and missing
negative tests. Classify findings as BLOCKER, HIGH, MEDIUM, LOW, or NOTE.
