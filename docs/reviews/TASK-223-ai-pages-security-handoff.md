# SECURITY REVIEW REQUEST

## Change summary

- Audited `/ai` and `/ai/demo-agents` against the live Supademo routes and reference screenshots.
- Added a bounded company-category picker to the AI trust rail with accessible listbox semantics.
- Added `referrerPolicy="no-referrer"` to the AI page’s remote award and company images.
- Browser-validated the AI Demo Agent modal, Escape/close behavior, carousel step controls, trust picker, and full-page section screenshots.

## Files changed

- `apps/web/components/marketing-ai.tsx`
- `apps/web/components/marketing-ai-agents.tsx` (coverage review; existing controls/assets retained)
- `apps/web/app/globals.css`
- `tests/ai.test.mjs`
- `tests/ai-demo-agents.test.mjs`
- `docs/reviews/TASK-223-ai-pages-security-handoff.md`

## Trust boundaries and sensitive data affected

- Both pages are public marketing surfaces. No workspace, viewer, account, prompt, conversation, or credential data is read or stored.
- AI content is static marketing copy; the “instant AI demo” is a local preview dialog linking to a fixed signup path.
- Remote decorative artwork and logos are loaded from fixed `supademo.com` paths.

## Authorization model

- No privileged operation was added. All page controls are public presentation state.
- Product-demo and signup links are fixed same-origin paths; feature links use fixed route paths.

## Threats considered

- Prompt-injection confusion: no user prompts or model output are executed on these public pages.
- XSS or unsafe HTML from AI copy, categories, image metadata, or dialog content.
- Open redirects and unbounded carousel/picker state.
- Referrer leakage and third-party asset tracking.
- Modal focus/escape race conditions and accidental background interaction.

## Security controls implemented

- AI company categories and all displayed copy are compile-time constants.
- Picker options use `aria-haspopup="listbox"`, `aria-expanded`, `role="listbox"`, `role="option"`, and `aria-selected`.
- Carousel indexes are bounded by the fixed step array; previous/next controls disable at the ends.
- Dialog closes through its explicit button or Escape listener and has `role="dialog"` plus `aria-modal="true"`.
- All reviewed remote images use `referrerPolicy="no-referrer"`.
- No unsafe DOM/code sinks, dynamic URL construction, forms, uploads, server-side fetches, or model/tool calls were added.
- Existing reduced-motion CSS disables the page’s animated transitions.

## Security tests added

- `tests/ai.test.mjs` asserts the AI route’s bounded picker semantics, referrer policy, fixed entry actions, major sections, and no unsafe sinks.
- `tests/ai-demo-agents.test.mjs` asserts the modal, Escape handling, bounded carousel controls, remote asset policy, and no unsafe sinks.
- Browser validation exercised picker options, modal open/close, carousel card 3, and captured top/trust/discovery/problem/setup/teams/compare/FAQ screenshots.

## Checks run and results

- `/ai` body height matched the live reference at 6,651px; `/ai/demo-agents` matched at 13,472px.
- `node --test tests/ai.test.mjs tests/ai-demo-agents.test.mjs` — passed (include in the focused suite below).
- `npm run lint`, `npm run typecheck`, `npm run check:boundaries`, `git diff --check`, and `npm audit --omit=dev --audit-level=high` — passed in the preceding page verification run.

## Checks not run

- Claude security review was not callable in this environment; an independent review must inspect the full diff before merge.
- Dynamic DAST, secret scanning, container scanning, infrastructure policy scanning, and production browser security checks were unavailable locally.

## Dependencies or infrastructure permissions added

- None.

## Known limitations and residual risks

- AI Demo Agent content is a public marketing preview; it does not implement production agent authorization, tool permissions, prompt isolation, or conversation retention.
- Remote artwork remains a third-party availability dependency, though it is rendered as image content only.
- The modal does not implement a full focus trap; its small preview surface should be upgraded to the shared focus-trap primitive if it gains interactive form fields.

Please review the full diff and surrounding code for OWASP Top 10, tenant isolation,
authentication/authorization, input validation, XSS, SSRF, injection, upload safety,
secret exposure, privacy, dependency risk, insecure cloud configuration, and missing
negative tests. Classify findings as BLOCKER, HIGH, MEDIUM, LOW, or NOTE.
