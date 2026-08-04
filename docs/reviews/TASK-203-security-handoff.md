# SECURITY REVIEW REQUEST

## Change summary

- Added explicit legal document routes for `/privacy-policy`, `/privacy-policy/ai`, and `/dpa` so these pages no longer depend on the catch-all route during server rendering.
- Preserved the canonical `/terms` page and `/terms-of-service` redirect and aligned legal, compare, and product-demo metadata with the public Supademo reference.
- Completed the AI Demo Agent parity pass: trust/award content, how-it-works preview, problem/setup/ROI/compare/FAQ sections, responsive layout, and reduced-motion animation rules.
- Made the AI Demo Agent carousel controls stateful and keyboard-operable, with bounded previous/next navigation and active-card semantics.
- Verified the local signup flow end to end against the local authentication provider.

## Files changed

- `apps/web/app/privacy-policy/page.tsx`
- `apps/web/app/privacy-policy/ai/page.tsx`
- `apps/web/app/dpa/page.tsx`
- `apps/web/app/terms/page.tsx`
- `apps/web/app/terms-of-service/page.tsx`
- `apps/web/app/compare/page.tsx`
- `apps/web/app/product-demo/page.tsx`
- `apps/web/components/marketing-reference-page.tsx`
- `apps/web/components/marketing-ai-agents.tsx`
- `apps/web/app/globals.css`
- `tests/legal-route-parity.test.mjs`

The repository contains other pre-existing worktree changes from the broader Supademo implementation. This handoff covers the files and behavior listed above; the full diff and surrounding code still require independent review.

## Trust boundaries and sensitive data affected

- Public marketing pages and legal documents are rendered in the browser and contain fixed copy and fixed Supademo-hosted reference imagery.
- The AI Demo Agent route adds no user-provided HTML, script, URL, prompt, or file content. The remote image URLs are compile-time constants and are not derived from request parameters.
- The signup verification exercised the existing cookie-authenticated local API flow with a temporary test identity. Passwords and session tokens were not logged or committed.
- Legal metadata is public page metadata only; no personal, tenant, or workspace data is introduced.

## Authorization model

- Public marketing and legal routes are intentionally unauthenticated and contain no privileged operations.
- The AI modal and carousel only change local React state. CTA links continue to the existing `/product-demo` and `/signup` flows.
- Account creation and login continue to use the existing `AuthScreen`/`AuthClient`, CSRF token, credentialed request, server-side local-auth provider, and `/home` redirect. No browser-side authorization decision was added.

## Threats considered

- Catch-all route collisions or server-rendering failures for legal slugs.
- XSS through rendered marketing copy, FAQ content, table cells, or carousel state.
- Open redirects or SSRF through new links or remote imagery.
- Authentication bypass, CSRF regression, credential leakage, or accidental password logging during signup verification.
- Keyboard/focus regressions in the modal and carousel controls.
- Reduced-motion and responsive-layout regressions.
- Tenant isolation and privileged API behavior in the surrounding existing application.

## Security controls implemented

- Explicit route modules use fixed `slug` arrays and fixed metadata; they do not interpolate request-controlled paths into HTML or outbound requests.
- Existing React text rendering remains escaped; no `dangerouslySetInnerHTML`, `innerHTML`, `eval`, or `new Function` was added.
- Carousel indices are bounded with `Math.max`/`Math.min`; controls expose disabled state, `aria-label`, and `aria-current`.
- Modal state remains local and closes on Escape; CTA destinations are fixed same-origin paths.
- Existing auth protections remain in place: `credentials: "include"`, CSRF header handling, bounded public errors, server-side identity/session handling, and local-only fixture authentication.
- CSS includes `prefers-reduced-motion` overrides for the new visual motion.

## Security tests added or updated

- `tests/legal-route-parity.test.mjs` now covers all explicit legal route modules, canonical metadata, the terms alias, and unsafe-DOM regressions.
- Existing AI, auth, API CSRF, tenant-isolation, XSS, SSRF, upload, and authorization tests were rerun through the full test suite.
- Browser checks exercised all 91 captured public routes for runtime-error overlays, missing primary headings, and render completion; AI modal/carousel interaction and local signup/account creation were exercised directly.

## Checks run and results

- `npm run typecheck` — passed.
- `npm test` — passed: 435 passed, 1 skipped, 0 failed (436 tests; production web build included).
- `npm run verify` — passed (format check, ESLint, workspace boundary check, typecheck).
- `npm run security:placeholders` — passed; deferred SAST/container/IaC scanners are documented by the repository.
- `npm audit --omit=dev --audit-level=high` — found 0 vulnerabilities.
- `git diff --check` — passed.
- Impeccable detector on changed UI files — no findings in changed AI/legal files; it reported pre-existing global CSS warnings/advisories elsewhere in `globals.css` (side-tab borders, generic font, and a decorative grid background).
- Browser route sweep — 91/91 routes rendered without runtime/compile/application errors; legal route heights and titles were rechecked against the public reference.

## Checks not run

- `gitleaks` — unavailable in the environment; run `gitleaks detect --no-banner --redact` before merge. Remaining risk: repository-wide secret scanning was not independently performed in this turn.
- `semgrep` — unavailable in the environment; run `semgrep --config auto --error` before merge. Remaining risk: repository-wide SAST coverage is not available locally.
- Container and IaC scanners (for example Trivy/Checkov) — not configured for this UI-only change; run them in CI for release artifacts and infrastructure.
- Integration tests requiring the configured `.env` database/Redis services — skipped by the existing test guard; local fixture auth was tested instead.

## Dependencies or infrastructure permissions added

- None. No package, IAM permission, storage policy, network rule, or external service credential was added.

## Known limitations and residual risks

- The local public route set is fully reachable and has reference-oriented layouts, but some pages remain intentionally local approximations of proprietary Supademo content and use fixed Supademo-hosted imagery. Visual equivalence should continue to be reviewed against the captured reference screenshots.
- The local authentication provider is a development/test fixture and must not be enabled for production; production configuration still requires the approved identity provider and secret store.
- Public legal copy is an application-rendered representation, not legal advice or a substitute for the authoritative legal documents.
- The public `/security` reference redirects to Supademo's external Trust Center while the local app retains its deterministic local trust-center surface for offline/browser QA.
- No new high-severity security issue was identified by the checks above, but Claude must independently review the full diff and surrounding code before merge.

Please review the full diff and surrounding code for OWASP Top 10, tenant isolation,
authentication/authorization, input validation, XSS, SSRF, injection, upload safety,
secret exposure, privacy, dependency risk, insecure cloud configuration, and missing
negative tests. Classify findings as BLOCKER, HIGH, MEDIUM, LOW, or NOTE.
