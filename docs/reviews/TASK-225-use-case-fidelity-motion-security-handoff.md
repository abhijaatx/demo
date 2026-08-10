# SECURITY REVIEW REQUEST

## Change summary

- Refined the seven public `/use-cases/*` detail routes to match the live Supademo reference geometry, typography, imagery, section rhythm, and responsive behavior.
- Added bounded client-side controls for the trust-company selector, feature rail, popular-use-case tabs, and FAQ disclosure behavior.
- Applied the downloaded motion guidance as one restrained hero drift sequence plus state feedback for carousel/tab transitions, with a reduced-motion path.
- Added a sandboxed public story embed frame and explicit no-referrer policy for the reference demo stories.

## Files changed

- `apps/web/components/marketing-use-case-detail.tsx`
- `apps/web/components/use-case-detail-interactions.tsx`
- `apps/web/app/globals.css`
- `tests/use-case-detail.test.mjs`
- `docs/reviews/TASK-225-use-case-fidelity-motion-security-handoff.md`

## Trust boundaries and sensitive data affected

- These are public, unauthenticated marketing routes. They do not read or mutate tenant records, accept uploads, or call protected APIs.
- The browser loads static artwork from explicit `https://supademo.com` URLs and renders selected public story embeds from `https://app.supademo.com/embed/...`.
- No credentials, tokens, workspace identifiers, or personal data are introduced into page state, URLs, logs, or analytics.

## Authorization model

- No privileged operation is added. The routes and their fixed CTA destinations are intentionally anonymous.
- Trust selector, carousel, tabs, and FAQ controls only change local UI state; they do not authorize server actions.
- Any protected destination reached by a link remains subject to its existing server-side authentication and authorization checks.

## Threats considered

- XSS, unsafe DOM sinks, URL injection, and open redirects in fixed marketing content.
- Cross-tenant data exposure through the public route or external story frame.
- Untrusted third-party HTML execution and frame escape attempts.
- Unbounded client-side state changes, focus/keyboard regressions, and motion accessibility.
- Remote asset failure or content drift.

## Security controls implemented

- React renders fixed text and attributes without `dangerouslySetInnerHTML`, `innerHTML`, `eval`, or `new Function`.
- Tab and carousel indices are derived from fixed arrays and bounded before rendering or translation.
- CTA hrefs and embed URLs are fixed constants; no user-controlled redirect or fetch target is accepted.
- Remote images use explicit HTTPS origins, lazy loading, and `referrerPolicy="no-referrer"`.
- Story iframes are restricted to `sandbox="allow-scripts allow-same-origin allow-forms"`, use `referrerPolicy="no-referrer"`, and point to the separate public Supademo origin rather than the creator application origin.
- `prefers-reduced-motion: reduce` disables the authored drift and collapses transitions to near-zero duration.
- Interactive controls expose button/tab/listbox semantics and state attributes for keyboard and assistive-technology use.

## Security tests added

- `tests/use-case-detail.test.mjs` verifies route wiring, accessible interaction state, iframe sandbox/referrer controls, and absence of unsafe DOM APIs.
- Browser validation exercised all seven detail routes, feature next-state movement, trust selector open/close behavior, popular-use-case tab switching, and FAQ disclosure.

## Checks run and results

- `npx prettier --write apps/web/components/use-case-detail-interactions.tsx apps/web/components/marketing-use-case-detail.tsx apps/web/app/globals.css tests/use-case-detail.test.mjs` — passed.
- `npm run format:check` — passed.
- `npm run lint` — passed.
- `npm run check:boundaries` — passed.
- `npm run typecheck` — passed.
- `git diff --check` — passed.
- `node --test tests/use-case-detail.test.mjs` — passed.
- `npm test` — passed (`npm run build` succeeded; 438 tests passed, 1 skipped because the API integration test requires a local `.env`).
- `npm audit --omit=dev --audit-level=high` — passed (0 production vulnerabilities reported).
- Browser route/geometry validation — all seven routes matched the expected section heights and body heights at the reference viewport; interactions responded as expected.
- Impeccable detector — completed; it reported pre-existing stylesheet warnings (side-tab borders, generic fonts, gradient text, and a decorative grid background outside this change's new rules).

## Checks not run

- Secret scan, SAST, container scan, IaC scan, and DAST were not available in this environment; run the repository's configured scanners before merge. The remaining risk is scanner findings outside the focused test.
- Claude's independent security review is not available in this environment and is required by the repository policy.

## Dependencies or infrastructure permissions added

- None.

## Known limitations and residual risks

- Visual fidelity depends on third-party-hosted Supademo artwork and public story embeds; availability or content changes can alter the result.
- The sandbox permits scripts, same-origin handling within the external public embed, and forms because the reference stories require them. The frame is external to the creator application, but this permission set should be re-evaluated if embed origins or content sources change.
- This change does not add tenant-data behavior, upload processing, authentication, or server-side authorization; those areas require separate review.

Please review the full diff and surrounding code for OWASP Top 10, tenant isolation,
authentication/authorization, input validation, XSS, SSRF, injection, upload safety,
secret exposure, privacy, dependency risk, insecure cloud configuration, and missing
negative tests. Classify findings as BLOCKER, HIGH, MEDIUM, LOW, or NOTE.
