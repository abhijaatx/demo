# TASK-235 AI Text Generation Security Handoff

SECURITY REVIEW REQUEST

Change summary:

- Added an editor-side Supademo AI copy assistant based on the current step and hotspot context.
- Added bounded tone selection, review-before-apply proposal state, and dismiss controls.
- Updated AI proposal sanitization to bounded plain text so React renders it safely without visible HTML entities.

Files changed:

- packages/domain/src/ai-text-assistant.ts
- apps/web/components/editor-shell.tsx
- apps/web/app/globals.css
- tests/ai-text-assistant.test.mjs
- tests/editor-ai-text.test.mjs

Trust boundaries and sensitive data affected:

- Creator-authored step titles, descriptions, and hotspot labels are sent to the existing mock AI gateway in this local MVP.
- AI output is untrusted text displayed in the creator editor and can be applied only after an explicit creator click.

Authorization model:

- The assistant is available only in the existing creator editor and respects its read-only guard.
- Applying a proposal changes only the selected step title through the normal document commit path.
- AI output cannot create URLs, actions, permissions, or publication state.

Threats considered:

- Prompt injection through captured copy or hotspot text.
- XSS or unsafe markup in model output.
- Oversized prompts, unexpected control characters, and accidental destructive changes.
- Leakage of private editor context to external providers.

Security controls implemented:

- Context and model output are capped at 4,000 characters.
- Control characters and HTML tags are stripped from the proposal; React text nodes handle final output escaping.
- Proposals are previewed and require explicit Apply to title confirmation.
- Existing mock gateway and no new external provider/dependency are used.

Security tests added:

- Plain-text proposal regression assertion.
- Editor source contract for generate, review, apply, dismiss, and absence of unsafe HTML sinks.

Checks run and results:

- Targeted AI/editor tests — passed.
- Browser verification — passed: generated a concise-tone proposal, reviewed it, and applied it to a step title.
- Production provider data-flow review — not applicable to the local mock gateway.
- `npm run format` — passed.
- `npm run verify` — passed.
- `npm run build` — passed.
- `npm audit --omit=dev --audit-level=high` — passed with 0 vulnerabilities.
- Full `npm test` rerun — 467 passed, 1 skipped optional API integration.

Checks not run:

- Claude security review — unavailable in this environment; independent review remains required.
- Production provider data-flow review — no production provider is connected in this local MVP.

Dependencies or infrastructure permissions added:

- None.

Known limitations and residual risks:

- The mock gateway does not model provider retention, abuse controls, or prompt-injection defenses of a real model provider.
- Sending sensitive captured copy to a real provider requires explicit privacy review and redaction policy.

Please review the full diff and surrounding code for OWASP Top 10, tenant isolation,
authentication/authorization, input validation, XSS, SSRF, injection, upload safety,
secret exposure, privacy, dependency risk, insecure cloud configuration, and missing
negative tests. Classify findings as BLOCKER, HIGH, MEDIUM, LOW, or NOTE.
