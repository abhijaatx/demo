SECURITY REVIEW REQUEST

Change summary:

- Integrated Supademo chapter voiceovers into the canonical DemoChapter model, the ChapterEditor, and the DemoViewer. `DemoAudioNarration` and its parser were extracted from demo-document.ts into the shared audio-narration.ts module so both steps and chapters reuse one safe narration model without a circular runtime import. Chapter voiceovers never autoplay on page load; the viewer only allows autoplay after the viewer's first interaction.

Files changed:

- packages/domain/src/audio-narration.ts (shared DemoAudioNarration + parseDemoAudioNarration moved here; unchanged behavior)
- packages/domain/src/demo-document.ts (imports + re-exports the shared narration model)
- packages/domain/src/chapter-model.ts (DemoChapter.voiceover + parser normalization)
- packages/domain/src/index.ts (narration exports now from audio-narration.js)
- packages/domain/src/publication-pipeline.ts (imports parseDemoAudioNarration from audio-narration.js)
- apps/web/components/editor/chapter-editor.tsx (ChapterVoiceoverSettings for all chapter types)
- apps/web/components/editor-shell.tsx (voiceover normalization in handleUpdateChapter, default null on new chapters)
- apps/web/components/demo-viewer.tsx (chapter voiceover rendering with first-interaction autoplay gate)
- apps/web/app/globals.css (chapter voiceover panel/viewer styles)
- tests/chapter-model.test.mjs, tests/chapter-editor.test.mjs, tests/demo-viewer-chapter-voiceover.test.mjs (new regression tests)
- docs/reviews/TASK-chapter-voiceover-security-handoff.md (this file)

Trust boundaries and sensitive data affected:

- Untrusted serialized demo documents (local drafts, published manifests, share links) can now carry a chapter `voiceover` object whose transcript and audio URL were previously ignored.
- The transcript is rendered as plain text in the viewer and editor; the audio URL is rendered into an `<audio src>`.

Authorization model:

- No new endpoints, permissions, or persistence paths. Chapters remain scoped to their demo document; authoring flows through the existing editor state with readOnly gating. The viewer only renders parsed, normalized chapter data.

Evidence limitation (documented honestly):

- The Supademo docs page https://docs.supademo.com/customize/chapters documents chapter voiceovers (select chapter, choose Voiceover, type/paste script, click Save; voiceover does not autoplay on page load and only triggers after the viewer's first action even when autoplay is enabled). The live app behavior could NOT be verified end-to-end because the live app is login-gated; implementation follows the documented behavior and the existing step voiceover flow rather than a live capture.

Threats considered:

- Unsafe audio URLs (javascript:, data:, mixed schemes) reaching the viewer or the editor preview.
- Oversized or un-bounded transcripts and metadata (assetId, voiceId, duration, speed, stability).
- Source/voice enum smuggling producing unhandled rendering branches.
- Autoplay regressions: chapter voiceover autoplaying on page load (violating the docs gate) or breaking step narration autoplay.
- Circular runtime import between chapter-model and demo-document.
- Breaking the existing step voiceover editor or step narration parsing.

Security controls implemented:

- `parseDemoAudioNarration` (shared, unchanged behavior) allowlists `source` to ai/manual/upload/clone, accepts only `blob:` or HTTPS audio URLs via `validateSafeUrl`, bounds transcript to 4,000 chars, assetId to 128, voiceId to 64, duration to [0, 3600], speed to [0.5, 2], stability to [0, 1], and returns frozen objects.
- `parseDemoChapter` runs every chapter `voiceover` through the shared parser and defaults to null when absent or malformed.
- `handleUpdateChapter` (editor-shell) re-normalizes `voiceover` through `parseDemoAudioNarration` for defense-in-depth, matching the existing bounding of other chapter fields.
- The viewer renders the transcript through React text nodes and the audio through the allowlisted `safeMediaUrl` result; no `dangerouslySetInnerHTML`, `eval`, or untrusted URL strings.
- Autoplay gate: the chapter `<audio>` mounts inert (no page-load autoplay). `hasStarted` is only set by `emitStarted()` on the first user interaction, and a ref + effect calls `play()` only when `hasStarted && chapter.voiceover.autoPlay` (flipping the autoPlay attribute on a mounted element is unreliable), pausing when the condition is false.
- The step voiceover editor and `parseDemoAudioNarration` behavior are untouched (the function was moved verbatim and re-exported from demo-document.ts for backward compatibility).
- The editor upload path reuses the existing 25 MB / `audio/*` constraints and blob URLs, normalized on write.

Security tests added:

- Parser: voiceover defaults to null; safe HTTPS and blob URLs accepted; javascript: URLs rejected to null; source enum normalized; transcript/duration/speed/stability bounded (tests/chapter-model.test.mjs).
- Editor: chapter voiceover section exposes script/Save/Generate/Upload/Remove with the 25 MB limit and read-only disabling; no unsafe sinks (tests/chapter-editor.test.mjs).
- Viewer: chapter voiceover section renders with safe media URLs; autoplay is gated behind the first-interaction `hasStarted` state; CTA/form/navigation behavior remains intact; no unsafe sinks (tests/demo-viewer-chapter-voiceover.test.mjs).

Checks run and results:

- node --test tests/*.test.mjs — 558 tests, 557 passed, 1 skipped (pre-existing), 0 failed.
- npm run format:check — passed.
- npm run lint — passed.
- npm run check:boundaries — passed.
- npm run typecheck — passed (tsc --build + next typegen + tsc --noEmit for @supademo/web).

Checks not run:

- Browser-level playback verification (autoplay gating, audio controls, transcript layout) was not automated in a browser session.
- Live Supademo app behavior could not be captured (login-gated); see the evidence limitation above.

Dependencies or infrastructure permissions added:

- None. No new packages, services, IAM actions, or cloud configuration.Known limitations and residual risks:
- The shared parser still defaults `autoPlay` to true when a voiceover is serialized without an explicit value (backward compatibility with step narration). The chapter editor always writes `autoPlay: false` on creation, and the viewer gate makes page-load autoplay impossible regardless of the stored value.
- The viewer's `hasStarted` gate is intentionally client-side; it does not persist across reloads (a reloaded viewer requires a new first interaction, which matches the documented behavior).
- Voice IDs are bounded strings but not validated against the TTS catalog inside the parser (the editor selects voices from the `getAvailableTtsVoices` allowlist); this preserves existing step-voiceover documents.
- Uploaded audio is kept as a local blob URL in the draft; production media storage/upload pipelines were not changed. `publication-pipeline.ts` passes chapter voiceovers through unmodified, so a locally-uploaded `blob:` audio URL can appear in a published manifest and will not resolve for viewers on other machines — identical to the existing step-narration behavior, not a regression.
- The chapter voiceover editor auto-applies upload/generate/voice-selection changes immediately while the script field requires an explicit Save (matching the docs' Save action); this is intentional progressive UX.

Please review the full diff and surrounding code for OWASP Top 10, tenant isolation,
authentication/authorization, input validation, XSS, SSRF, injection, upload safety,
secret exposure, privacy, dependency risk, insecure cloud configuration, and missing
negative tests. Classify findings as BLOCKER, HIGH, MEDIUM, LOW, or NOTE.

Claude review status: unavailable in this environment; human/Claude review remains required before production use.
