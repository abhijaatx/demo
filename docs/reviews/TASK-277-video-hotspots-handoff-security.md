SECURITY REVIEW REQUEST

Change summary:

- Added a browser-local Supademo-style video hotspot workbench with exact timeline click/add behavior, pause cues, duration cues, edge dragging, keyboard adjustment, and touch pointer capture.
- Added canonical bounded timing parsing and playback helpers for pause/duration visibility, earliest-timestamp grouping, explicit-seek rearming, and inert legacy hotspots.
- Wired the same timing contract through the local editor and viewer so Apply/Save/Preview behavior remains consistent without uploading local media.
- Fixed same-position seek handling so a no-op seek cannot leave playback stuck in a seeking state.

Files changed:

- apps/web/components/video-hotspots-workbench.tsx
- apps/web/components/editor-shell.tsx
- apps/web/components/demo-viewer.tsx
- apps/web/app/demos/[demoId]/view/page.tsx
- apps/web/src/lib/local-capture-storage.ts
- apps/web/src/lib/local-capture-document.ts
- packages/domain/src/video-hotspot-timing.ts
- packages/domain/src/demo-document.ts
- packages/domain/src/hotspot-schema.ts
- packages/domain/src/hotspot-navigation.ts
- packages/domain/src/index.ts
- tests/video-hotspots-workbench.test.mjs
- tests/video-hotspot-timing.test.mjs
- tests/local-capture-storage.test.mjs
- tests/demo-document.test.mjs
- tests/hotspot-schema.test.mjs
- package.json
- package-lock.json

Trust boundaries and sensitive data affected:

- A creator-selected local video and hotspot copy are retained in browser memory/IndexedDB and later converted into local object URLs in the editor and viewer.
- Timing controls presentation only; they are not authorization evidence.
- No new server endpoint, analytics beacon, cross-origin request, or cloud permission is introduced by this workflow.

Authorization model:

- Selecting, editing, and handing off a local file is browser-scoped and unauthenticated by design.
- Any future save, publish, sharing, or viewer delivery must use the existing authenticated workspace authorization; a local capture ID is not an authorization credential.
- The local timing model cannot grant navigation, publishing, or access rights; no-action video hotspots remain inert.

Threats considered:

- Oversized or unsupported media, malformed or stale timing, excessive hotspot count, XSS in hotspot copy, object URL lifetime, local storage exhaustion, repeated pause loops, seek-state races, and accidental cross-workspace publication.

Security controls implemented:

- MIME, 40 MB, 2-hour, 20-hotspot, 120-character title, 400-character body, and 7,200-second timing bounds are enforced before IndexedDB writes.
- Canonical timing parsing rejects malformed values; duration windows are half-open and edge drags are clamped to the current video length.
- Pause cues are grouped at the earliest crossed timestamp, are not re-triggered on resume without a real seek, and are rearmed only at/after explicit seek positions.
- Hotspot copy is rendered as React text and is not interpreted as markup or a URL.
- IndexedDB keys are normalized, media stays in browser storage, and object URLs are created/revoked by lifecycle cleanup.
- The dependency lock now overrides the vulnerable transitive nanoid release with 3.3.17.

Security tests added:

- Timing parser, invalid bounds, half-open visibility, grouping, rearming, non-retrigger, edge conversion, stale-duration, and malformed drag tests in tests/video-hotspot-timing.test.mjs.
- Workbench contract tests cover click-to-add, pointer edge dragging, keyboard/touch semantics, local handoff, and no-op seek protection in tests/video-hotspots-workbench.test.mjs.
- Existing local-storage, document, schema, editor, and viewer tests cover bounded persistence, safe restoration, and inert actions.

Checks run and results:

- PATH=/Users/abhijaat/.nvm/versions/node/v20.20.2/bin:$PATH npm test — passed: 548 passed, 1 skipped, 0 failed.
- npm run format — passed.
- npm run verify — passed (format, lint, boundaries, typecheck).
- npm audit --omit=dev --audit-level=high — 0 vulnerabilities.
- npm run security:placeholders — passed.
- git diff --check — passed.
- Browser smoke checks — /video-hotspots, /crop-media, and /edit-html loaded; hotspot no-video validation, HTML Save changes, and screenshots verified.

Checks not run:

- The in-app browser file chooser was exercised with a generated 4-second MP4, and the editor-to-viewer preview loaded and played it. WebM/QuickTime variants, prolonged playback, and physical pointer edge-drag behavior remain not fully covered.
- Claude independent security review is unavailable in this environment and must be performed before merge.

Dependencies or infrastructure permissions added:

- No new package or infrastructure permission. package.json/package-lock.json add only a nanoid 3.3.17 override to remediate the transitive advisory.

Known limitations and residual risks:

- This is a local preparation and editor-preview workflow, not a production media processing path. Published media still requires server-side signature validation, isolated processing, quotas, private object storage, and workspace authorization.
- The local workbench uses browser object URLs and native video controls; production export and playback must preserve the same bounded timing contract and accessibility behavior.

Please review the full diff and surrounding code for OWASP Top 10, tenant isolation,
authentication/authorization, input validation, XSS, SSRF, injection, upload safety,
secret exposure, privacy, dependency risk, insecure cloud configuration, and missing
negative tests. Classify findings as BLOCKER, HIGH, MEDIUM, LOW, or NOTE.

Claude security review status: unavailable in this environment; an independent Claude review is required before merge.
