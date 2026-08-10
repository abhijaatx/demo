# SECURITY REVIEW REQUEST

Change summary:

- Added a browser-local AI Command workbench that targets one or more demo drafts, parses a small allowlisted set of bulk edit intents, shows a proposal, and requires explicit approval before applying it.
- Added editor entry-point navigation and regression tests.

Files changed:

- apps/web/components/ai-command-workbench.tsx
- apps/web/app/ai-command/page.tsx
- apps/web/app/globals.css
- apps/web/components/editor-shell.tsx
- tests/ai-command-workbench.test.mjs

Trust boundaries and sensitive data affected:

- User-entered prompts and demo labels remain in browser state and may appear in the local command history or metadata-only plan if extended later.
- No prompt, demo content, model credential, workspace record, or external API request leaves the browser in this preview.

Authorization model:

- No server-side operation is performed; approval mutates only local demo drafts.
- A production implementation must authorize every selected demo against the current workspace and require server-side permission checks before persisting a bulk edit.

Threats considered:

- Prompt injection or accidental execution of arbitrary model output.
- Bulk edits crossing demo/workspace boundaries.
- Unbounded prompt length or target count.
- Hidden writes without human approval.
- XSS or dynamic execution through prompt/history rendering.

Security controls implemented:

- Prompt length is capped at 1,200 characters and selected targets at 10.
- Parser has a fixed allowlist for zoom, hotspot color, and navigation labels; unknown commands produce a clarification proposal.
- Every proposal exposes changes and target names, then requires an explicit Approve action.
- No `fetch`, HTML injection, dynamic code execution, or model-provider call is present.

Security tests added:

- `tests/ai-command-workbench.test.mjs` checks bounded prompts, approval state, unsupported-command handling, unsafe API absence, and the review/history surface.

Checks run and results:

- `npm run format:check` — passed.
- `npm run verify` — passed (format, lint, workspace boundaries, and typecheck).
- `node --test tests` — passed (505 passed, 1 skipped).
- `npm run build` — passed (Next.js production build, including `/ai-command`).
- `npm audit --omit=dev --audit-level=high` — passed (0 vulnerabilities).
- `git diff --check` — passed.
- Browser verification completed: selected two demos, generated a three-change proposal, and approved it with visible history.

Checks not run:

- Claude security review is unavailable in this environment; independent review remains required before release.

Dependencies or infrastructure permissions added:

- None.

Known limitations and residual risks:

- This is a deterministic local preview, not an AI provider integration or persisted bulk-edit API.
- Server-side authorization, audit logging, quotas, idempotency, and model/tool controls remain required for production AI Command.

Please review the full diff and surrounding code for OWASP Top 10, tenant isolation,
authentication/authorization, input validation, XSS, SSRF, injection, upload safety,
secret exposure, privacy, dependency risk, insecure cloud configuration, and missing
negative tests. Classify findings as BLOCKER, HIGH, MEDIUM, LOW, or NOTE.
