# SECURITY REVIEW REQUEST

Change summary:

- Added a browser-local animation workbench for Supademo-style zoom/pan, transition, hotspot hover, and chapter button animation settings.
- Reused the bounded domain motion parser and reduced-motion resolver.
- Added a metadata-only JSON download for the animation plan and an editor capture link.

Files changed:

- apps/web/components/animation-workbench.tsx
- apps/web/app/animation/page.tsx
- apps/web/app/globals.css
- apps/web/components/editor-shell.tsx
- tests/animation-workbench.test.mjs

Trust boundaries and sensitive data affected:

- Only local UI state and user-selected numeric animation settings are affected.
- Downloaded plans can contain step titles and motion metadata but never capture pixels or credentials.
- No network, storage, authentication, or tenant-owned records are touched by this route.

Authorization model:

- The route is a local preview tool and performs no protected server operation.
- Any eventual persistence must use the authenticated editor service and server-side workspace authorization; this workbench intentionally does not persist settings.

Threats considered:

- Unbounded zoom, focus, or transition duration values.
- Reduced-motion accessibility regressions.
- Unsafe client-side rendering or script injection through downloaded plan content.
- Accidental transmission of local editor data.

Security controls implemented:

- Motion values are normalized by `parseAndNormalizeMotionConfig` and reduced-motion behavior by `resolveEffectiveMotionConfig`.
- All controls are bounded ranges/selects; downloaded output is JSON generated from local typed state.
- No `fetch`, HTML injection, dynamic code execution, or external URL handling.

Security tests added:

- `tests/animation-workbench.test.mjs` checks bounds, reduced-motion controls, download plan behavior, unsafe API absence, and CSS surface.

Checks run and results:

- `npm run format:check` — passed.
- `npm run verify` — passed (format, lint, workspace boundaries, and typecheck).
- `node --test tests` — passed (502 passed, 1 skipped).
- `npm run build` — passed (Next.js production build, including `/animation`).
- `npm audit --omit=dev --audit-level=high` — passed (0 vulnerabilities).
- `git diff --check` — passed.
- Browser verification — passed `/animation` step selection, reduced-motion behavior, transition selection, and hotspot interaction.

Checks not run:

- Claude security review is unavailable in this environment; independent review remains required before release.
- Native browser file/microphone permissions are not exercised by this route because no media capture is requested.

Dependencies or infrastructure permissions added:

- None.

Known limitations and residual risks:

- This route is a local planning/preview surface; server persistence and authorization wiring remain in the existing authenticated editor flow.
- CSS motion preview is illustrative and is not a rendered export.

Please review the full diff and surrounding code for OWASP Top 10, tenant isolation,
authentication/authorization, input validation, XSS, SSRF, injection, upload safety,
secret exposure, privacy, dependency risk, insecure cloud configuration, and missing
negative tests. Classify findings as BLOCKER, HIGH, MEDIUM, LOW, or NOTE.
