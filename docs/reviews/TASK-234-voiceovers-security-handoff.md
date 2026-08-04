# TASK-234 Voiceovers 2.0 Security Handoff

SECURITY REVIEW REQUEST

Change summary:

- Added per-step Voiceovers 2.0 authoring controls for AI scripts, voices, expressive mode, speed, stability, and autoplay.
- Added hotspot-to-script synchronization and bounded local audio upload support.
- Added safe publication of narration metadata and viewer audio/transcript playback.
- Kept dynamic variables out of synthesized voiceover audio, matching Supademo’s documented limitation.

Files changed:

- packages/domain/src/demo-document.ts
- packages/domain/src/index.ts
- packages/domain/src/publication-pipeline.ts
- apps/web/components/editor-shell.tsx
- apps/web/components/demo-viewer.tsx
- apps/web/app/globals.css
- tests/demo-document.test.mjs
- tests/publication-pipeline.test.mjs
- tests/demo-viewer-voiceover.test.mjs
- tests/editor-voiceover.test.mjs

Trust boundaries and sensitive data affected:

- Creator-authored narration scripts and uploaded audio are stored in local draft/published documents.
- Audio URLs cross the browser media boundary and may reference local blob URLs or approved HTTPS CDN assets.
- Voice metadata and transcript text are displayed as text/media controls; they do not authorize actions.

Authorization model:

- Voiceover editing follows the existing creator editor access and read-only guard.
- Viewer playback is public for a published demo and cannot mutate the document.
- AI generation in this local MVP uses the existing bounded catalog helper; no provider credential or privileged server call is added.

Threats considered:

- XSS or script execution through transcript text and audio URLs.
- Malicious media schemes, oversized uploads, resource exhaustion, and unsafe publication.
- Voice-cloning consent/identity confusion and accidental variable substitution in audio.
- Untrusted narration driving navigation or authorization.

Security controls implemented:

- Audio URLs are restricted to HTTPS or local blob URLs; unsafe `javascript:`, `data:`, and other schemes fail closed.
- File uploads require an `audio/*` MIME type and are capped at 25 MB before creating a blob URL.
- Scripts are capped at 4,000 characters; IDs/voice IDs/URLs/durations/speed/stability are bounded and clamped.
- Publication re-parses narration metadata before hashing and writing the public manifest.
- Transcript output uses React text nodes and media controls only; no unsafe HTML sink or dynamic code execution.

Security tests added:

- Unsafe audio URL publication/parser negative test.
- Editor source contract for AI generation, sync, expressive mode, and upload limits.
- Viewer source contract for safe audio controls and no unsafe HTML sink.
- Existing AI voice catalog and generation tests remain green.

Checks run and results:

- npm run build — passed.
- Targeted voiceover/document/publication/viewer tests — passed (10/10).
- Browser verification — passed: generated an AI voiceover, published an update, and confirmed the viewer rendered the Voiceover region and transcript with an audio element whose URL was HTTPS-only.
- npm test after the final feature batch — passed (462 total; 461 passed, 1 skipped optional API integration).

Checks not run:

- Claude security review — unavailable in this environment; an independent review is still required before merge.
- Production TTS provider, storage scanning, and voice-cloning consent service — not connected in the local MVP.

Dependencies or infrastructure permissions added:

- None.

Known limitations and residual risks:

- The local AI helper returns a placeholder HTTPS CDN URL; production must connect an authenticated provider and verify generated assets before publication.
- Uploaded blob URLs are browser-local and are not durable across devices or server publication.
- Production voice cloning requires explicit consent, tenant-scoped storage, retention, and abuse monitoring.

Please review the full diff and surrounding code for OWASP Top 10, tenant isolation,
authentication/authorization, input validation, XSS, SSRF, injection, upload safety,
secret exposure, privacy, dependency risk, insecure cloud configuration, and missing
negative tests. Classify findings as BLOCKER, HIGH, MEDIUM, LOW, or NOTE.
