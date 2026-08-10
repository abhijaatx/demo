# Security Review & Handoff — Background Music Slice

## SECURITY REVIEW REQUEST

### Change summary

Implements demo-level background music on top of the TASK-068 narration/background-audio groundwork:

- **Domain (`packages/domain/src/audio-narration.ts`)**: extended `DemoBackgroundAudio` with safe playback `audioUrl`, display `title`, allowlisted `presetId`, and `muted`; added `parseDemoBackgroundAudio` — a safe, bounded, never-throwing parser that requires at least one audio source, only accepts `https:` or origin-bearing (non-`null`) `blob:` URLs, clamps `volume`/`duckingRatio` to `[0, 1]`, bounds all strings, and allowlists preset ids; added immutable `BACKGROUND_MUSIC_PRESETS` served from the approved mock CDN.
- **Document model (`packages/domain/src/demo-document.ts`)**: `DemoSettings.backgroundAudio: DemoBackgroundAudio | null`, defaulting to `null` so legacy documents parse unchanged (backwards compatible).
- **Publication (`packages/domain/src/publication-pipeline.ts`)**: re-validates `backgroundAudio` through the parser at publish time.
- **Viewer (`apps/web/components/demo-viewer.tsx`)**: background music audio element that mounts inert — playback auto-starts after the viewer's first interaction (`hasStarted`) unless a password gate is locked, the creator marked the track as starting muted (initial state only), or the viewer paused/muted it; creator start-muted is an initial state only — once the viewer explicitly engages the controls (`bgUserEngaged`), Play can always unmute and start the track; while a gate chapter is locked the playback guard includes `gateLocked` and the music controls are disabled (`Unavailable`), so no active Play path leaks behind the lock; narration play/pause events drive `calculateEffectiveAudioVolume` ducking; compact Play/Pause + Mute control bar with `onEnded` state sync for non-looping tracks; URLs pass through the existing `safeMediaUrl`.
- **Editor (`apps/web/components/editor-shell.tsx` + `apps/web/app/globals.css`)**: `BackgroundMusicSettings` panel in Demo settings exposing presets, audio upload (≤25 MB, `audio/*`), volume, ducking ratio, loop, start-muted, remove, and a native preview `<audio>`; all writes round-trip through `parseDemoBackgroundAudio`.
- **Tests**: extended `tests/audio-narration.test.mjs`, `tests/demo-document.test.mjs`, `tests/publication-pipeline.test.mjs`; new `tests/background-music.test.mjs`.

### Files changed

- `packages/domain/src/audio-narration.ts`
- `packages/domain/src/demo-document.ts`
- `packages/domain/src/publication-pipeline.ts`
- `packages/domain/src/index.ts`
- `apps/web/components/demo-viewer.tsx`
- `apps/web/components/editor-shell.tsx`
- `apps/web/app/globals.css`
- `tests/audio-narration.test.mjs`, `tests/demo-document.test.mjs`, `tests/publication-pipeline.test.mjs`, `tests/background-music.test.mjs`
- `docs/reviews/TASK-background-music-security-handoff.md` (this file)

### Trust boundaries and sensitive data affected

- Untrusted document JSON is parsed by `parseDemoBackgroundAudio` at document parse and again at publish. The browser upload path creates a local `blob:` URL that is scoped to the creator's browser.
- No new external inputs; the viewer only ever plays a parser-validated URL through the pre-existing `safeMediaUrl` (https or blob). No secrets, personal data, or credentials are involved.
- No database, auth, or storage changes. No new network calls except the browser fetching the configured audio URL (which is the same trust boundary as existing step/chapter voiceover audio).

### Authorization model

- Background music is a demo-level content setting, not a privileged operation. Editor writes are gated by the existing `readOnly` prop (view-only collaborators cannot change music settings), identical to theme/personalization settings. There is no new server endpoint; authorization is unchanged.

### Threats considered

- Stored/reflected XSS or arbitrary-URL playback from `javascript:`/`data:`/`http:` audio URLs.
- Unbounded/oversized strings or numeric abuse causing clipping, memory growth, or malformed documents.
- Autoplay policy abuse: music starting without a user gesture, or playing behind a locked password gate.
- Regression: voiceover ducking, step/chapter voiceover rendering, navigation, and forms staying intact.
- `presetId` spoofing with arbitrary strings reaching the UI.

### Security controls implemented

- **URL allowlisting**: `audioUrl` only survives as validated `https:` or origin-bearing `blob:` (sandboxed `blob:null/...` and malformed blobs are rejected at parse time); everything else becomes `null`. Re-applied at publish. Viewer re-checks with `safeMediaUrl`.
- **Bounds**: `audioAssetId` ≤ 128, `storagePath` ≤ 512, `audioUrl` ≤ 2 048, `title` ≤ 80, `presetId` ≤ 64 and allowlisted against `BACKGROUND_MUSIC_PRESETS`; `volume`/`duckingRatio` clamped to `[0, 1]` to prevent clipping; `loop`/`muted` coerced to booleans.
- **Fail-safe parser**: returns `null` on non-object input or when no audio source exists; never throws; always returns a frozen object.
- **Gesture-gated playback**: audio element mounts inert with `preload="none"`; `play()` is only attempted after the first viewer interaction, respects the creator "start muted" flag as an initial state (never a permanent block — explicit viewer Play overrides it via `bgUserEngaged`), fails closed behind a locked password gate (`!gateLocked` in the guard, controls `disabled` while locked), and honors viewer pause/mute state; `onEnded` and `onError` sync the play toggle for non-looping or unavailable tracks; mirrors the existing chapter-voiceover gating.
- **Ducking**: `calculateEffectiveAudioVolume` bounds the effective volume in `[0, 1]`; narration play/pause events (not just configuration) drive ducking; signal resets on navigation.
- **No unsafe DOM/execution sinks**: no `dangerouslySetInnerHTML`, `innerHTML`, `eval`, or `new Function` anywhere in the change.

### Security tests added

- `tests/audio-narration.test.mjs`: safe bounded parse; unsafe URL/unknown preset rejection with safe defaults; https-only/blob-only acceptance; null when no source; legacy minimal shape; preset allowlist sanity (unique bounded ids, https URLs).
- `tests/demo-document.test.mjs`: legacy documents and defaults have `backgroundAudio: null`; settings parse and sanitize background audio safely.
- `tests/publication-pipeline.test.mjs`: publish re-validates and strips unsafe audio URLs; absent background audio stays null.
- `tests/background-music.test.mjs`: viewer renders safe-URL music without untrusted HTML, never autoplays pre-gesture, ducks via the domain envelope, keeps voiceover/navigation/forms intact; editor exposes presets/upload/volume/loop/mute controls; demo-level backwards compatibility.
- Regression tests: (1) viewer suppresses background music while a password gate is locked — playback guard includes `gateLocked` and the music controls are disabled (`Unavailable`), so no active Play path exists behind the lock; (2) viewer Play overrides the creator start-muted initial state — `bgUserEngaged` removes the permanent `backgroundAudio.muted` block once the viewer engages the controls.

### Checks run and results

- `npx tsc --build --pretty false` — passed.
- `npm run verify` (format:check, eslint, check-boundaries, typecheck incl. `@supademo/web`) — passed.
- Focused: `node --test` on audio-narration, demo-document, publication-pipeline, background-music, demo-viewer-voiceover, demo-viewer-chapter-voiceover, chapter-model, demo-viewer-password-gate — 61 passed, 0 failed, 0 skipped.
- Full suite: `node --test 'tests/**/*.test.mjs'` — 621 tests, 620 passed, 1 skipped, 0 failed.
- Manual browser verification on a fresh local draft: the Background music editor region rendered; a preset could be selected; volume, loop, and start-muted controls persisted; viewer preview initially showed `Play music`, changed to `Pause music` after an explicit Play click, and changed to `Unmute music` after mute. The verification tab was closed afterward.

### Checks not run

- `npm test` (the package.json script `node --test tests` directory form) fails in this environment with `Cannot find module .../tests` on Node v26.3.0; the repository engines pin Node `>=20.20 <21`. The full suite was instead executed with the equivalent glob form (`node --test 'tests/**/*.test.mjs'`), which passed. Remaining risk: none beyond the pre-existing environment/toolchain mismatch; the script form should be re-run on the pinned Node version in CI.
- `npm audit --omit=dev --audit-level=high` — passed (`0 vulnerabilities`); dependency surface is unchanged (no packages added).

### Dependencies or infrastructure permissions added

- None. No packages, services, IAM actions, or infrastructure changes.

### Known limitations and residual risks

- Built-in preset audio URLs point at the mock media CDN (`https://cdn.supademo.com/audio/presets/*.mp3`) following the existing `ai-voiceover.ts` convention; until real audio assets are uploaded to a CDN, presets will not be audible. Uploaded tracks play from a browser-local `blob:` URL and are not persisted server-side (consistent with the browser-only demo workspace).
- Viewer volume is not user-adjustable in this slice; the creator sets volume and ducking ratio, and the viewer offers Play/Pause and Mute only.
- Ducking follows actual narration playback events, but a narration that keeps playing in the background after navigation is intentionally left audible; the ducking signal resets on step/chapter change.

Please review the full diff and surrounding code for OWASP Top 10, tenant isolation, authentication/authorization, input validation, XSS, SSRF, injection, upload safety, secret exposure, privacy, dependency risk, insecure cloud configuration, and missing negative tests. Classify findings as BLOCKER, HIGH, MEDIUM, LOW, or NOTE.
