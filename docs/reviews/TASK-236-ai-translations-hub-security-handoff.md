# TASK-236 AI Translations Hub Security Handoff

SECURITY REVIEW REQUEST

Change summary:

- Added bounded translation dictionaries to the canonical demo document model.
- Added an editor translation hub that translates supported viewer-facing text, previews original and translated values, allows review edits, and requires Save Translation.
- Added published viewer language switching with `Translate` menu support and `?lang=Spanish`/locale query handling.
- Localized step titles, hotspot labels, chapter text, form labels/options, and voiceover transcripts through the existing text-node rendering path.

Files changed:

- packages/domain/src/localization-infrastructure.ts
- packages/domain/src/demo-document.ts
- packages/domain/src/index.ts
- apps/web/components/editor-shell.tsx
- apps/web/components/demo-viewer.tsx
- apps/web/app/globals.css
- tests/localization-infrastructure.test.mjs
- tests/ai-translations-editor.test.mjs

Trust boundaries and sensitive data affected:

- Creator-authored demo copy and voiceover transcripts are submitted to the existing local mock AI gateway.
- Saved translations are part of the tenant-owned demo document and are published to the viewer manifest when the creator publishes.
- The public viewer accepts only an allowlisted saved locale from the `lang` query parameter.

Authorization model:

- Only the existing creator editor can generate, edit, save, or remove translations, and the component respects the editor read-only guard.
- Viewer locale selection only reads the published document already resolved for that demo; it does not grant access to another document or workspace.
- Translation updates go through the existing document commit and publication flow.

Threats considered:

- XSS or unsafe markup in AI translations and viewer query parameters.
- Oversized translation maps, keys, values, and locale strings.
- Prompt injection and privacy leakage from captured copy sent to a real AI provider.
- Locale parameter tampering, missing translation fallback, and unsafe dynamic variable rendering.

Security controls implemented:

- Translation dictionaries cap locales, entry count, key length, and value length; control characters are removed.
- Viewer locale is matched against saved dictionaries or falls back to the original language; arbitrary query values cannot select unsaved content.
- Translation preview requires an explicit Save Translation action; output is rendered as React text nodes and no unsafe HTML sink is introduced.
- Existing dynamic-variable allowlists and fallback rendering continue to apply after localization.
- No new dependency, network permission, credential, or storage origin was added.

Security tests added:

- Dictionary parsing bounds and stable content-key regression test.
- Editor/viewer source contract for preview, save, locale matching, and absence of unsafe HTML sinks.
- Browser verification: generated and reviewed Spanish translation, saved it, opened the viewer with `?lang=Spanish`, switched to Original (English), and verified the URL and rendered text changed safely.

Checks run and results:

- `npm run build` — passed.
- Targeted translation tests — passed.
- Browser verification — passed as described above.
- `npm run format` — passed.
- `npm run verify` — passed.
- `npm audit --omit=dev --audit-level=high` — passed with 0 vulnerabilities.
- Full `npm test` rerun — 467 passed, 1 skipped optional API integration.

Checks not run:

- Claude security review — unavailable in this environment; independent review remains required.
- Production provider privacy/data-retention review — no production provider is connected in this local MVP.

Dependencies or infrastructure permissions added:

- None.

Known limitations and residual risks:

- The mock translation gateway returns deterministic placeholder text and does not model provider retention, abuse controls, or actual language quality.
- Translation dictionaries are currently stored in the browser-backed demo document; production multi-tenant persistence must enforce workspace authorization and encrypted storage.
- Static viewer labels such as Next and Submit remain in the source language until a product-wide UI locale system is added.

Please review the full diff and surrounding code for OWASP Top 10, tenant isolation,
authentication/authorization, input validation, XSS, SSRF, injection, upload safety,
secret exposure, privacy, dependency risk, insecure cloud configuration, and missing
negative tests. Classify findings as BLOCKER, HIGH, MEDIUM, LOW, or NOTE.
