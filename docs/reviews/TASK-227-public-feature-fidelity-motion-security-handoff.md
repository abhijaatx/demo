# SECURITY REVIEW REQUEST

## Change summary

- Refined the public `/features/demo-editor` and `/features/personalization` routes to match the live Supademo reference composition, typography, artwork, section rhythm, and responsive behavior.
- Added fixed reference feature rows, capability cards, FAQ content, trust/footer rails, and bounded use-case tabs for both routes.
- Applied the downloaded motion guidance as restrained visual treatment with a `prefers-reduced-motion` path; no new motion is required for interaction correctness.
- Completed the in-app Browser audit of the discovered public route inventory separately; its 91 full-page captures and one-by-one control outcomes are stored under `browser-qa/supademo-crawl-2026-08-04/`.

## Files changed

- `apps/web/components/marketing-feature-detail.tsx`
- `apps/web/app/globals.css`
- `tests/marketing-reference.test.mjs`
- `docs/reviews/TASK-227-public-feature-fidelity-motion-security-handoff.md`

## Trust boundaries and sensitive data affected

- These are public, unauthenticated marketing routes. They do not read or mutate tenant records, accept uploads, or call protected APIs.
- The browser loads static artwork from explicit `https://supademo.com` URLs and renders fixed copy, links, native disclosure elements, and bounded tab state.
- No credentials, tokens, workspace identifiers, or personal data are introduced into page state, URLs, logs, or analytics.

## Authorization model

- No privileged operation is added. The routes are intentionally anonymous.
- Use-case tabs and FAQ disclosures only change local UI state; they do not authorize server actions.
- Fixed CTA links target the existing `/signup` and `/product-demo` routes; any protected behavior at those destinations remains subject to its existing server-side authentication and authorization checks.

## Threats considered

- XSS, unsafe DOM sinks, URL injection, and open redirects in fixed marketing content.
- Cross-tenant data exposure through public route rendering.
- Remote-asset failures, content drift, and accidental referrer leakage.
- Unbounded client-side state, keyboard/focus regressions, and motion accessibility.
- Injection or SSRF through query strings or user-controlled page content (not accepted by these route components).

## Security controls implemented

- React renders fixed text and attributes without `dangerouslySetInnerHTML`, `innerHTML`, `eval`, or `new Function`.
- Tab state and mapped rows are derived from fixed arrays; there is no user-controlled index, URL, or fetch target.
- CTA hrefs and image URLs are fixed constants; remote images use explicit HTTPS origins and `referrerPolicy="no-referrer"`.
- Native `<details>`/`<summary>` disclosures and ARIA tab semantics preserve keyboard and assistive-technology behavior.
- `prefers-reduced-motion: reduce` disables authored animation and transitions for the specialized route family.

## Security tests added

- `tests/marketing-reference.test.mjs` verifies route wiring, fixed reference content/assets, no-referrer image policy, bounded interactive components, and the existing sandbox/referrer assertions for feature previews.
- Browser validation exercised the editor and personalization routes, use-case tab switching, FAQ disclosure state, and reference section/body-height anchors.
- The browser audit recorded all discovered route screenshots and one-by-one control outcomes in `browser-qa/supademo-crawl-2026-08-04/actions/`.

## Checks run and results

- `npx prettier --write apps/web/components/marketing-feature-detail.tsx apps/web/app/globals.css tests/marketing-reference.test.mjs` — passed.
- `npm run format:check` — passed.
- `npm run lint` — passed.
- `npm run typecheck` — passed.
- `node --test tests/marketing-reference.test.mjs` — passed (2 tests).
- `npm test` — passed (`npm run build` succeeded; 439 tests passed, 1 skipped because the API integration test requires a local `.env`).
- `npm audit --omit=dev --audit-level=high` — passed (0 production vulnerabilities reported).
- `git diff --check` — passed.
- Impeccable detector — completed; it reported pre-existing stylesheet warnings (side-tab borders, generic fonts, gradient text, and a decorative grid background outside the focused route rules).
- In-app Browser validation — editor and personalization reference anchors matched the measured live sections; tab and FAQ interactions responded as expected.

## Checks not run

- Secret scan, SAST, container scan, IaC scan, and DAST were not available in this environment; run the repository's configured scanners before merge. The remaining risk is scanner findings outside this focused public UI change.
- Claude's independent security review is not available in this environment and is required by the repository policy.

## Dependencies or infrastructure permissions added

- None.

## Known limitations and residual risks

- Visual fidelity depends on third-party-hosted Supademo artwork; availability or content changes can alter the rendered result.
- This change does not add tenant-data behavior, upload processing, authentication, or server-side authorization; those areas require separate review.
- Browser audit records intentionally skipped disabled, authentication-gated, download, duplicate sitewide, or potentially side-effectful controls; every skip and observed outcome is recorded in the action report rather than silently omitted.

Please review the full diff and surrounding code for OWASP Top 10, tenant isolation,
authentication/authorization, input validation, XSS, SSRF, injection, upload safety,
secret exposure, privacy, dependency risk, insecure cloud configuration, and missing
negative tests. Classify findings as BLOCKER, HIGH, MEDIUM, LOW, or NOTE.
