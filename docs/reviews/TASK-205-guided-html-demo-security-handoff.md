SECURITY REVIEW REQUEST

Change summary:

- Rebuilt the public `/features/guided-html-demo` route with Supademo-aligned hero, feature cards, capability rows, use-case tabs, FAQ accordions, and footer chrome.
- Added an accessible CSS product-preview illustration and responsive desktop/mobile layouts, including reduced-motion fallbacks.
- Kept all navigation actions on fixed same-origin paths (`/signup` and `/product-demo`) and preserved the shared marketing header/footer.

Files changed:

- `apps/web/components/marketing-feature-detail.tsx`
- `apps/web/app/globals.css`
- `tests/marketing-reference.test.mjs`

Trust boundaries and sensitive data affected:

- The route is public marketing content. It consumes only fixed, reviewed copy, hash fragments, and fixed remote image URLs; no account, workspace, viewer, upload, or analytics data is accepted or stored.
- Browser navigation remains same-origin for product actions. Remote images are display-only and use `referrerPolicy="no-referrer"`.

Authorization model:

- No new protected operation or API endpoint was added. The public page is intentionally unauthenticated.
- `/signup` and `/product-demo` remain the existing application entry points; authorization and account creation continue to be enforced by their existing server workflows.

Threats considered:

- XSS or script injection through page copy, use-case hash fragments, remote image URLs, and FAQ content.
- Open redirects or URL injection through CTA and tab navigation.
- Privacy leakage through third-party image referrers.
- Broken or inaccessible interactions on responsive layouts, including keyboard navigation and reduced-motion preferences.
- Cross-tenant access, SSRF, upload, webhook, and API authorization risks (not introduced because this route has no data/API boundary).

Security controls implemented:

- All rendered strings and asset URLs are compile-time constants; no `dangerouslySetInnerHTML`, `innerHTML`, `eval`, or dynamic template execution is used.
- CTAs use fixed relative paths; use-case tabs use bounded fixed hash IDs generated from a static array.
- Remote images set `referrerPolicy="no-referrer"`; decorative illustrations have empty alt text and the CSS preview has an explicit `role="img"` label.
- FAQ controls use native `<details>/<summary>` semantics, and use-case navigation is represented by real links with visible focus styles inherited from the shared chrome.
- CSS includes `prefers-reduced-motion: reduce` overrides for the new animation surfaces.

Security tests added:

- `tests/marketing-reference.test.mjs` now asserts guided-demo headings, capability content, fixed hash-tab wiring, native FAQ controls, and the existing unsafe-DOM exclusion.
- Browser smoke checks exercised the route at desktop and 532px mobile widths, the use-case hash tabs, and the visible page console (no warnings/errors returned).

Checks run and results:

- `node --test tests/marketing-reference.test.mjs tests/features.test.mjs` — 2 passed, 0 failed.
- `npm run lint` — passed.
- `npm run check:boundaries` — passed.
- `npm run typecheck` — passed (`tsc --build --pretty false` and web type generation).
- `npm audit --omit=dev --audit-level=high` — passed earlier in this task; no dependencies changed for this route.
- `npm run security:placeholders` — passed earlier in this task.
- `git diff --check` — passed earlier in this task.
- `npm test` — the production build completed, but the test run reached 345 tests and then reported three pre-existing environment/performance failures: the `dashboard-benchmark` threshold, the API placeholder fetch, and the worker-start scaffold check. The run was interrupted after hanging.
- Impeccable/animation review — motion is restrained to preview/hover surfaces and disabled under reduced motion; no route-specific detector finding was emitted.

Checks not run:

- `npm run verify` did not complete in this environment because its formatting phase stalled without producing output; lint, boundaries, and typecheck were run separately. Re-run `npm run verify` in CI or a clean checkout before release.
- Gitleaks, Semgrep/CodeQL, container-image, and infrastructure-policy scans were not available as configured commands; CI or Claude should run them before release.
- An independent Claude review has not yet been performed; this handoff is not an approval or a claim that the implementation is vulnerability-free.

Dependencies or infrastructure permissions added:

- None.

Known limitations and residual risks:

- The page references Supademo-hosted media. Availability, cache behavior, and third-party hosting remain external dependencies; the route has no local fallback for every decorative image.
- Non-primary use-case panels use the public feature-media paths configured in the component; if Supademo changes or removes those assets, the panel can show a missing image without affecting application security.
- Visual parity is an implementation target, not a guarantee of pixel identity across browsers, fonts, or viewport sizes.

Please review the full diff and surrounding code for OWASP Top 10, tenant isolation,
authentication/authorization, input validation, XSS, SSRF, injection, upload safety,
secret exposure, privacy, dependency risk, insecure cloud configuration, and missing
negative tests. Classify findings as BLOCKER, HIGH, MEDIUM, LOW, or NOTE.
