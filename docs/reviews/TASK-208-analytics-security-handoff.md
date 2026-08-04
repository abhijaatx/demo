# Security Review Handoff — Analytics feature page

SECURITY REVIEW REQUEST

Change summary:

- Added a parity-oriented `/features/analytics` marketing page with analytics hero, five capability cards, use-case tabs, feature links, FAQs, and the shared footer.
- Added a client-side analytics use-case tab component with accessible tab/panel semantics.
- Added responsive layout, fixed public image assets, and reduced-motion styling.

Files changed:

- `apps/web/components/analytics-use-case-tabs.tsx`
- `apps/web/components/marketing-feature-detail.tsx`
- `apps/web/app/globals.css`
- `tests/marketing-reference.test.mjs`
- `docs/reviews/TASK-208-analytics-security-handoff.md`
- `browser-qa/local-fidelity-2026-08-02/reference-analytics-top.jpg`
- `browser-qa/local-fidelity-2026-08-02/reference-analytics-feature1.jpg`
- `browser-qa/local-fidelity-2026-08-02/reference-analytics-feature2.jpg`
- `browser-qa/local-fidelity-2026-08-02/reference-analytics-usecases.jpg`
- `browser-qa/local-fidelity-2026-08-02/reference-analytics-faq.jpg`
- `browser-qa/local-fidelity-2026-08-02/local-analytics-top-v2.jpg`
- `browser-qa/local-fidelity-2026-08-02/local-analytics-feature1-v2.jpg`
- `browser-qa/local-fidelity-2026-08-02/local-analytics-feature2.jpg`
- `browser-qa/local-fidelity-2026-08-02/local-analytics-usecases.jpg`
- `browser-qa/local-fidelity-2026-08-02/local-analytics-faq.jpg`

Trust boundaries and sensitive data affected:

- This is a public, unauthenticated marketing route. It renders fixed copy and fixed HTTPS image assets only.
- No analytics event, viewer identity, workspace data, CRM record, or credential is read, written, or transmitted by the page.
- Use-case tab state is transient in the browser and is not persisted.

Authorization model:

- No protected endpoint or server action was added. CTAs navigate to existing public signup/use-case routes, which retain their existing server-side authentication and authorization behavior.
- Analytics copy is informational and cannot access or export customer analytics.

Threats considered:

- XSS or injection through feature copy, FAQs, tab labels, and image URLs.
- Unexpected tab index or keyboard activation behavior.
- Unsafe external navigation or resource loading.
- Mobile and reduced-motion accessibility regressions.

Security controls implemented:

- All displayed copy, routes, and image URLs are compile-time constants; no user-controlled HTML is rendered.
- The client component uses bounded local index state and native buttons with `role="tab"`, `aria-selected`, `aria-controls`, and an `aria-live` panel.
- Images use fixed HTTPS origins and `referrerPolicy="no-referrer"`.
- CTAs use fixed local paths; there is no dynamic redirect or URL interpolation.
- Native disclosure controls power the FAQ and honor keyboard input; reduced-motion CSS removes transitions and animations.

Security tests added:

- `tests/marketing-reference.test.mjs` asserts Analytics page copy/assets, feature rows and FAQs, the client tab boundary, tablist semantics, and state update handler.
- Browser smoke coverage clicked multiple use-case tabs and an FAQ disclosure, verifying the active tab and panel copy changed.

Checks run and results:

- `npx prettier --write apps/web/components/analytics-use-case-tabs.tsx apps/web/components/marketing-feature-detail.tsx apps/web/app/globals.css tests/marketing-reference.test.mjs` — passed.
- `node --test tests/marketing-reference.test.mjs tests/features.test.mjs` — 2 passed.
- `npm run lint` — passed.
- `npm run typecheck` — passed.
- `npm run check:boundaries` — passed; no new package boundary was added.
- `git diff --check` — passed.
- `npm audit --omit=dev --audit-level=high` — previously passed with 0 vulnerabilities; this change adds no dependencies.
- Browser QA at desktop viewport — page rendered with the reference geometry and active tab/FAQ interactions worked.

Checks not run:

- Full `npm test` was not rerun because the repository has known unrelated dashboard benchmark, API placeholder, and worker-start scaffold failures documented in preceding handoffs. Run `npm test` in CI and triage those failures separately.
- No authenticated tenant-isolation or API security test applies: this route adds no API and no tenant-owned data access.

Dependencies or infrastructure permissions added:

- None.

Known limitations and residual risks:

- The hero and capability previews rely on public Supademo-hosted image assets; asset availability depends on the external host.
- The page is a marketing representation of analytics and does not display live workspace metrics.
- Repository-level Claude review remains required by `AGENTS.md` before merge.

Please review the full diff and surrounding code for OWASP Top 10, tenant isolation,
authentication/authorization, input validation, XSS, SSRF, injection, upload safety,
secret exposure, privacy, dependency risk, insecure cloud configuration, and missing
negative tests. Classify findings as BLOCKER, HIGH, MEDIUM, LOW, or NOTE.
