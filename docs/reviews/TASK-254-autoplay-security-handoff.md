# SECURITY REVIEW REQUEST

Change summary:

- Added a browser-local Autoplay & Loop workbench with autoplay/loop toggles, uniform or per-step timing, transition gaps, progress color, playback preview, and metadata-only plan download.
- Added an editor capture link and regression coverage.

Files changed:

- apps/web/components/autoplay-workbench.tsx
- apps/web/app/autoplay/page.tsx
- apps/web/app/globals.css
- apps/web/components/editor-shell.tsx
- tests/autoplay-workbench.test.mjs

Trust boundaries and sensitive data affected:

- Only local playback timing and a user-selected color are affected.
- The downloaded JSON contains local step labels and bounded timing values; it does not include tokens, assets, or external URLs.
- No API, database, object storage, analytics, or tenant data is accessed.

Authorization model:

- No protected operation is performed. The route is a local preview and does not save or publish a demo.
- Production persistence must continue through the authenticated editor API with workspace scoping.

Threats considered:

- Excessive duration/delay values causing resource exhaustion or unusable playback.
- Timer leaks and stale preview state when switching or looping.
- Unsafe rendering or export of untrusted text.
- Accidental external transmission.

Security controls implemented:

- Duration is clamped to 1–30 seconds and delay to 0–10 seconds in both uniform and custom modes.
- Timers are cleared in `useEffect` cleanup; autoplay is explicit and loop behavior is explicit.
- JSON export is generated from local state without HTML injection, dynamic code, or network calls.

Security tests added:

- `tests/autoplay-workbench.test.mjs` checks bounds, timing modes, autoplay/loop controls, timer cleanup, unsafe API absence, and CSS surface.

Checks run and results:

- `npm run format:check` — passed.
- `npm run verify` — passed (format, lint, workspace boundaries, and typecheck).
- `node --test tests` — passed (502 passed, 1 skipped).
- `npm run build` — passed (Next.js production build, including `/autoplay`).
- `npm audit --omit=dev --audit-level=high` — passed (0 vulnerabilities).
- `git diff --check` — passed.
- Browser verification — passed `/autoplay` uniform/custom timing, autoplay/loop toggles, preview playback, and progress state.

Checks not run:

- Claude security review is unavailable in this environment; independent review remains required before release.

Dependencies or infrastructure permissions added:

- None.

Known limitations and residual risks:

- Playback preview is illustrative and does not yet drive the persisted demo player. The existing editor/player remains the production source of truth.
- Voiceover duration is not automatically measured; the UI provides a reminder to leave enough time for narration.

Please review the full diff and surrounding code for OWASP Top 10, tenant isolation,
authentication/authorization, input validation, XSS, SSRF, injection, upload safety,
secret exposure, privacy, dependency risk, insecure cloud configuration, and missing
negative tests. Classify findings as BLOCKER, HIGH, MEDIUM, LOW, or NOTE.
