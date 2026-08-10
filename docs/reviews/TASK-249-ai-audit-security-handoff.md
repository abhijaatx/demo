# SECURITY REVIEW REQUEST

## Change summary

- Added a local AI Audit workbench modeled on Supademo's documented context/use-case/outcome, score-card, recommendation, preview, and apply flow.
- Added bounded inputs, deterministic audit scoring through the existing domain helper, review-before-apply actions, and an editor link.
- Added static security regression coverage.

## Files changed

- apps/web/app/ai-audit/page.tsx
- apps/web/components/ai-audit-workbench.tsx
- apps/web/components/editor-shell.tsx
- apps/web/app/globals.css
- tests/ai-audit-workbench.test.mjs

## Trust boundaries and sensitive data affected

- Demo context, use case, desired outcome, and size estimates are entered in the browser and used only by a deterministic local helper.
- No prompt, document, personal data, model key, or external request leaves the browser in this route. Production AI work must use the authenticated server-side gateway.

## Authorization model

- Running an audit and staging local recommendations are creator actions with no protected server mutation.
- Applying changes to a real demo must require the existing authenticated editor, workspace authorization, revision checks, quotas, and explicit confirmation; this route only communicates a local staged result.

## Threats considered

- Prompt injection and accidental secret submission, oversized context, arbitrary model output, silent destructive edits, XSS through recommendation copy, unauthorized publishing, and cost/abuse escalation.

## Security controls implemented

- Context/use-case/outcome and numeric fields are bounded and clamped before scoring.
- The score is deterministic and reviewable; Preview Changes is separate from Apply to Current Demo/Duplicate Demo actions; no generated HTML or executable model output is rendered.
- The UI explicitly states the local boundary and leaves production AI authorization/quota enforcement to the existing gateway.

## Security tests added

- tests/ai-audit-workbench.test.mjs checks bounded inputs, deterministic helper use, review/apply controls, local-only behavior, and absence of unsafe DOM/network APIs.
- Existing `tests/ai-demo-audit.test.mjs` covers score and recommendation behavior.

## Checks run and results

- npm run format:check — passed.
- npm run verify — passed (format, lint, workspace boundaries, and typecheck).
- node --test tests — passed (496 passed, 1 skipped).
- npm run build — passed (Next.js production build, including /ai-audit).
- npm audit --omit=dev --audit-level=high — passed (0 vulnerabilities).
- Browser route verification — passed /ai-audit run and preview flow with bounded context/outcome fields.

## Checks not run

- A live model provider was intentionally not called; production provider integration requires the reviewed gateway, quotas, prompt/output schemas, and audit logging.
- Claude's independent security review is not available in this environment. This handoff is intentionally not an approval.

## Dependencies or infrastructure permissions added

- No packages, backend services, IAM actions, or production permissions were added.

## Known limitations and residual risks

- This route is a deterministic local audit preview, not a claim of model quality or a production AI decision.
- Apply actions update only local UI state. A real apply workflow must create an authorized revision, show a diff, preserve undo/restore, and prevent model output from bypassing validation.

Please review the full diff and surrounding code for OWASP Top 10, tenant isolation,
authentication/authorization, input validation, XSS, SSRF, injection, upload safety,
secret exposure, privacy, dependency risk, insecure cloud configuration, and missing
negative tests. Classify findings as BLOCKER, HIGH, MEDIUM, LOW, or NOTE.
