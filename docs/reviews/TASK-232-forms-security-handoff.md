# TASK-232 Forms Security Handoff

SECURITY REVIEW REQUEST

Change summary:

- Added Forms as a chapter type with native lead-capture fields in the editor and viewer.
- Added bounded form schema parsing, field limits, appearance controls, skip policy, and work-email policy.
- Added client-side submission validation, success state, and best-effort local response persistence for the local MVP.

Files changed:

- packages/domain/src/form-schemas.ts
- packages/domain/src/form-submission.ts
- packages/domain/src/chapter-model.ts
- packages/domain/src/demo-document.ts
- packages/domain/src/index.ts
- packages/domain/src/publication-pipeline.ts
- packages/domain/src/sharing-exports.ts
- apps/web/components/editor/chapter-editor.tsx
- apps/web/components/editor-shell.tsx
- apps/web/components/demo-viewer.tsx
- apps/web/app/globals.css
- tests/form-schemas.test.mjs
- tests/form-submission.test.mjs
- tests/chapter-model.test.mjs
- tests/chapter-editor.test.mjs
- tests/editor-shell.test.mjs
- tests/publication-pipeline.test.mjs
- tests/demo-viewer-form.test.mjs

Trust boundaries and sensitive data affected:

- Form definitions can be edited in the browser and serialized into a published demo document.
- Viewer answers are untrusted public input. The current local MVP stores bounded responses only in browser localStorage; no server-side lead endpoint is introduced by this change.
- Form background URLs cross the browser rendering boundary and are restricted to HTTPS or local blob URLs.

Authorization model:

- Creator-side form editing remains behind the existing editor access model and read-only guard.
- Viewer submission is intentionally anonymous for local published demos; it cannot authorize privileged actions.
- Publication sanitizes form definitions before writing the public manifest.

Threats considered:

- Stored/reflected XSS through field labels, options, answers, and background URLs.
- Oversized field counts, labels, options, answers, and appearance values.
- Form identity confusion and unknown answer injection.
- Free-email policy bypass and invalid select/radio values.
- Local-storage failure or quota exhaustion.

Security controls implemented:

- Strict field count (7), option count (20), and per-value length bounds.
- Safe URL validation for form background media; unsafe schemes fail closed.
- Form ID matching, required-field validation, email syntax/business-domain validation, allowed-choice validation, and unknown-field rejection.
- Answers are bounded before local persistence; persistence failures do not block playback.
- No unsafe HTML sinks, dynamic code execution, or privileged actions are driven by answers.

Security tests added:

- Form schema bounds/defaults/unsafe URL tests.
- Submission identity, choice, business-email, and unknown-field negative tests.
- Chapter parsing and publication sanitization tests.
- Editor/viewer source contract tests for form controls and unsafe sinks.

Checks run and results:

- npm run format:check — passed.
- npm run verify — passed (format, lint, boundaries, typecheck).
- Targeted Forms/chapter/publication tests — passed (16/16).
- Browser verification — passed: created a Forms chapter, published it, confirmed business-email rejection, then confirmed successful submission state.
- Full npm test after the final feature batch — passed (462 total; 461 passed, 1 skipped optional API integration).

Checks not run:

- Claude security review — unavailable in this environment; an independent review is still required before merge.
- Production authenticated API/CRM lead persistence — not part of this local-storage MVP slice.

Dependencies or infrastructure permissions added:

- None.

Known limitations and residual risks:

- Responses are local-only and are not yet tenant-scoped server records or CRM events.
- Anonymous public submissions require rate limiting, retention, consent, and server-side authorization when production persistence is added.
- The work-email denylist is intentionally conservative and must not be treated as authoritative identity verification.

Please review the full diff and surrounding code for OWASP Top 10, tenant isolation,
authentication/authorization, input validation, XSS, SSRF, injection, upload safety,
secret exposure, privacy, dependency risk, insecure cloud configuration, and missing
negative tests. Classify findings as BLOCKER, HIGH, MEDIUM, LOW, or NOTE.
