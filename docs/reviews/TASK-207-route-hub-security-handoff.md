# Security Review Handoff — RouteHub feature page

SECURITY REVIEW REQUEST

Change summary:

- Added a RouteHub marketing feature route at `/features/route-hub` with parity-oriented hero, ROI calculator, feature sections, interactive-tour preview, feature links, FAQ, and shared footer.
- Added a client-only calculator with bounded numeric inputs, confidence modes, tab state, native disclosure controls, and a clipboard copy-link action.
- Added responsive and reduced-motion styling and browser QA screenshots for desktop and mobile layouts.

Files changed:

- `apps/web/components/route-hub-calculator.tsx`
- `apps/web/components/marketing-feature-detail.tsx`
- `apps/web/app/globals.css`
- `tests/marketing-reference.test.mjs`
- `docs/reviews/TASK-207-route-hub-security-handoff.md`
- `browser-qa/local-fidelity-2026-08-02/reference-route-hub-top.jpg`
- `browser-qa/local-fidelity-2026-08-02/reference-route-hub-roi-v3.jpg`
- `browser-qa/local-fidelity-2026-08-02/reference-route-hub-feature-v3.jpg`
- `browser-qa/local-fidelity-2026-08-02/local-route-hub-top-v6.jpg`
- `browser-qa/local-fidelity-2026-08-02/local-route-hub-roi-v6.jpg`
- `browser-qa/local-fidelity-2026-08-02/local-route-hub-feature-v6.jpg`
- `browser-qa/local-fidelity-2026-08-02/reference-route-hub-mobile.jpg`
- `browser-qa/local-fidelity-2026-08-02/local-route-hub-mobile.jpg`

Trust boundaries and sensitive data affected:

- This is a public, unauthenticated marketing route. It renders only fixed copy and remote public Supademo image assets.
- Calculator values are transient browser state; no values are sent to the server or persisted.
- The copy-link action writes the current page URL to the browser clipboard and does not include calculator values or credentials.

Authorization model:

- No protected operation or API endpoint was added. Marketing CTAs navigate to the existing `/signup` flow, which remains responsible for authentication and authorization.
- The calculator is informational and does not grant access to demos, workspaces, or customer data.

Threats considered:

- Malformed, oversized, negative, or non-finite calculator input.
- Accidental persistence or disclosure of viewer-entered business metrics.
- Unsafe URL construction, clipboard failure, and browser API unavailability.
- XSS through feature copy, FAQ content, or query/hash navigation.
- Keyboard and reduced-motion behavior for interactive controls.

Security controls implemented:

- Numeric values are length-limited and clamped to explicit ranges before calculations.
- Non-finite values resolve to the lower bound; calculations are deterministic and client-only.
- Copy-link uses the browser clipboard API behind a guarded `try/catch` and reports failure without exposing data.
- All links use fixed, repository-controlled paths; remote images use fixed HTTPS URLs and `referrerPolicy="no-referrer"`.
- Native `button`, `input`, `details`, and `summary` controls retain keyboard semantics; result updates use `aria-live`.
- Reduced-motion media query disables transitions and animations on the route.

Security tests added:

- `tests/marketing-reference.test.mjs` asserts RouteHub copy, fixed routes/assets, calculator client boundary, bounded-input helper, clipboard guard, and live-region markup.
- Browser smoke coverage exercised calculator tabs, confidence buttons, bounded input editing, advanced assumptions, copy-link feedback, FAQ disclosure, and the product-tour anchor.

Checks run and results:

- `npx prettier --write apps/web/components/route-hub-calculator.tsx apps/web/components/marketing-feature-detail.tsx apps/web/app/globals.css` — passed.
- `node --test tests/marketing-reference.test.mjs tests/features.test.mjs` — 2 passed.
- `npm run lint` — passed.
- `npm run typecheck` — passed.
- `npm run check:boundaries` — passed.
- `git diff --check` — passed.
- `npm audit --omit=dev --audit-level=high` — previously passed with 0 vulnerabilities; this change adds no dependencies.
- Browser QA at desktop and mobile viewport sizes — route rendered and controls responded as expected; latest route logs contained no runtime errors.

Checks not run:

- Full `npm test` was not rerun for this route because the repository's existing suite includes known unrelated dashboard benchmark, API placeholder, and worker-start scaffold failures documented in the preceding handoffs. Run `npm test` in CI before release and triage those pre-existing failures separately.
- No dynamic security scanner or authenticated tenant-isolation test applies to this static public route; the route adds no server endpoint or tenant-owned data access.

Dependencies or infrastructure permissions added:

- None.

Known limitations and residual risks:

- The preview uses public Supademo-hosted static assets and is not a live RouteHub session; availability of those assets depends on the external host.
- Clipboard support depends on browser permissions and secure-context behavior; failure is surfaced as a non-sensitive status.
- The ROI model is illustrative and intentionally does not represent validated customer revenue.
- Existing repository-level security review and Claude review remain required before merge under `AGENTS.md`.

Please review the full diff and surrounding code for OWASP Top 10, tenant isolation,
authentication/authorization, input validation, XSS, SSRF, injection, upload safety,
secret exposure, privacy, dependency risk, insecure cloud configuration, and missing
negative tests. Classify findings as BLOCKER, HIGH, MEDIUM, LOW, or NOTE.
