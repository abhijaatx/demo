SECURITY REVIEW REQUEST

Change summary:

- Rebuilt the public `/features/sandbox-demos` route with Supademo-aligned hero, trust rail, feature cards, engineering capability grid, sales use cases, capability carousel, feature directory, demo stage, FAQ accordions, testimonial, and shared footer CTA.
- Added a small client-only carousel for the scale section with bounded static data, disabled-state controls, keyboard-operable buttons, and live status text.
- Added responsive desktop/mobile layout rules and restrained hover/transition motion with reduced-motion fallbacks following the animation playbook.
- Captured reference and local desktop/mobile/section screenshots under `browser-qa/local-fidelity-2026-08-02/` for visual review.

Files changed:

- `apps/web/components/marketing-feature-detail.tsx`
- `apps/web/components/sandbox-scale-carousel.tsx`
- `apps/web/app/globals.css`
- `tests/marketing-reference.test.mjs`
- `docs/reviews/TASK-206-sandbox-demos-security-handoff.md`

Trust boundaries and sensitive data affected:

- This is a public marketing route. It uses fixed copy, static hash-free navigation paths, fixed remote media URLs, and no account, workspace, viewer, upload, analytics, or integration data.
- The carousel's client state is only a bounded integer index. It does not accept or persist user data.
- Remote images are display-only and use `referrerPolicy="no-referrer"`.

Authorization model:

- No protected operation or API endpoint was added. The route is intentionally unauthenticated.
- Product actions navigate to fixed relative `/signup` and `/product-demo` paths; existing server-side authentication and authorization remain responsible for those workflows.
- Feature-directory links are generated from a compile-time allowlisted array and fixed `/features/*` paths.

Threats considered:

- XSS or script injection through page copy, FAQ answers, feature labels, carousel data, or remote asset URLs.
- Open redirect or URL injection through feature-directory links and CTAs.
- Privacy leakage through third-party image referrers.
- Accessibility and interaction regressions in native details controls, carousel buttons, responsive navigation, and reduced-motion mode.
- Cross-tenant access, SSRF, upload, webhook, API authorization, and cloud configuration risks (not introduced because the route has no data/API boundary).

Security controls implemented:

- All copy, paths, and asset URLs are compile-time constants; no `dangerouslySetInnerHTML`, `innerHTML`, `eval`, or dynamic template execution is used.
- Feature links derive only from a static array and replace spaces with hyphens; they do not include query strings, user input, or external hosts.
- CTAs use fixed same-origin relative paths. Remote images set `referrerPolicy="no-referrer"`.
- FAQ controls use native `<details>/<summary>` semantics. Carousel controls are real buttons with disabled bounds, keyboard support, and an `aria-live` status.
- Responsive rules preserve focusable controls and include `prefers-reduced-motion: reduce` overrides for new transitions.

Security tests added:

- `tests/marketing-reference.test.mjs` asserts the sandbox page headings, trust rail, FAQ and feature-directory structures, carousel client component, bounded control labels, and unsafe-DOM exclusion.
- Browser smoke checks exercised the public route at desktop and mobile widths, the carousel next control (status advanced from `1–3` to `2–4`), native FAQ expansion, CTA paths, and page console output. No new browser errors were observed after the dev server rebuilt the new client module.

Checks run and results:

- `node --test tests/marketing-reference.test.mjs tests/features.test.mjs` — 2 passed, 0 failed.
- `npm run lint` — passed.
- `npm run check:boundaries` — passed.
- `npm run typecheck` — passed (`tsc --build --pretty false` and web type generation).
- `npm audit --omit=dev --audit-level=high` — passed earlier in this task; no dependencies changed.
- `npm run security:placeholders` — passed earlier in this task.
- `git diff --check` — passed earlier in this task.
- Browser reference/local screenshots were captured with the control-in-app-browser skill and saved beneath `browser-qa/local-fidelity-2026-08-02/`.

Checks not run:

- A fresh full `npm test` rerun was not repeated for this route. The previous full run built production successfully but reported three existing environment/performance failures (`dashboard-benchmark`, API placeholder fetch, and worker-start scaffold) and hung afterward; those failures are documented in `TASK-205-guided-html-demo-security-handoff.md`.
- `npm run verify` did not complete in this environment because its formatting phase stalled; lint, boundaries, typecheck, targeted tests, and diff checks were run separately.
- Gitleaks, Semgrep/CodeQL, container-image, and infrastructure-policy scans were unavailable as configured commands.
- An independent Claude review has not yet been performed; this handoff is not an approval or a claim that the implementation is vulnerability-free.

Dependencies or infrastructure permissions added:

- None.

Known limitations and residual risks:

- The route depends on Supademo-hosted media. If those public assets change or disappear, a visual panel can show a missing image without creating an application security issue.
- The live Supademo hero uses a dynamic canvas; the local implementation uses a fixed, reviewable preview image so it remains deterministic and does not execute remote code.
- Pixel parity can vary with browser font availability, image loading, and viewport dimensions.

Please review the full diff and surrounding code for OWASP Top 10, tenant isolation,
authentication/authorization, input validation, XSS, SSRF, injection, upload safety,
secret exposure, privacy, dependency risk, insecure cloud configuration, and missing
negative tests. Classify findings as BLOCKER, HIGH, MEDIUM, LOW, or NOTE.
