# TASK-215 Security Handoff

SECURITY REVIEW REQUEST

Change summary:

- Added a bounded `/industries/[slug]` route for the software, healthcare, finance-banking, and government landing pages.
- Added a shared, responsive industry template with trust-company filtering, public Supademo showcase embeds, feature carousel controls, customer-story links, and FAQ disclosures.
- Matched the reference layout with reduced-motion handling, remote asset fallbacks, and constrained carousel indices.

Files changed:

- `apps/web/app/industries/[slug]/page.tsx`
- `apps/web/components/marketing-industry.tsx`
- `apps/web/app/globals.css`
- `tests/industry.test.mjs`
- `docs/reviews/TASK-215-industries-security-handoff.md`

Trust boundaries and sensitive data affected:

- Public browser rendering of marketing content and third-party Supademo demo embeds.
- Remote image requests to `supademo.com` and interactive iframe requests to `app.supademo.com`.
- No tenant records, authentication state, uploads, analytics identifiers, or secrets are read or written by these pages.

Authorization model:

- The route is public and exposes only the four statically allowlisted industry slugs.
- Workflow, customer-story, and showcase links point to fixed application paths or fixed public Supademo embed identifiers; no user-provided URL or identifier is accepted.
- The trust picker, showcase tabs, carousel buttons, and FAQ disclosures only change local presentation state.

Threats considered:

- Route abuse through arbitrary slugs or open redirects.
- XSS through industry copy, remote asset failures, or iframe content.
- Unbounded client state transitions and keyboard/accessibility regressions.
- Referrer and credential leakage through remote embeds.
- Third-party content availability and failure rendering.

Security controls implemented:

- Allowlisted route metadata and `notFound()` for unsupported slugs.
- Fixed remote origins and fixed embed IDs; no string interpolation from request input into URLs.
- Remote images use `referrerPolicy="no-referrer"` and hide themselves on load failure.
- Showcase tabs and feature carousel indices are bounded with `Math.max`/`Math.min`.
- Interactive controls expose `aria-selected`, `aria-expanded`, listbox/tab semantics, and reduced-motion overrides.
- Public embed requests use `referrerPolicy="no-referrer"`.

Security tests added:

- `tests/industry.test.mjs` checks the allowlisted route, bounded controls, fixed embed origin, referrer policy, fallback asset, reduced-motion CSS, and absence of unsafe DOM execution APIs.
- Browser checks exercised the trust picker, five showcase tabs, feature Next/Previous bounds, and FAQ disclosure behavior.

Checks run and results:

- `node --test tests/industry.test.mjs tests/use-cases.test.mjs tests/marketing-reference.test.mjs tests/pricing.test.mjs` — passed (4 tests).
- `npm run lint` — passed.
- `npm run typecheck` — passed.
- `npm run check:boundaries` — passed.
- `git diff --check` — passed.
- `npm audit --omit=dev --audit-level=high` — passed; 0 vulnerabilities reported.

Checks not run:

- Claude's independent security review — no Claude review tool is available in this environment; this handoff must be reviewed before merge.
- Dynamic scanner, secret scanner, container scan, and infrastructure scan — no configured commands were available for this public frontend-only change. Run the repository/CI equivalents before release.

Dependencies or infrastructure permissions added:

- None.

Known limitations and residual risks:

- The showcase uses intentionally unsandboxed iframes because the Supademo public embed currently renders blank when sandboxed, and visual/function parity requires the remote player runtime. The iframe source is fixed to `https://app.supademo.com/embed/...` and is not user-configurable; this remains a third-party content trust boundary and should be revisited if the player supports sandboxing or a static trusted preview.
- Remote marketing assets can be unavailable or changed by the provider; image failures are hidden rather than exposing stack traces.
- These pages do not provide tenant isolation because they contain no protected tenant data; all linked protected operations must enforce authorization in their destination routes.

Please review the full diff and surrounding code for OWASP Top 10, tenant isolation,
authentication/authorization, input validation, XSS, SSRF, injection, upload safety,
secret exposure, privacy, dependency risk, insecure cloud configuration, and missing
negative tests. Classify findings as BLOCKER, HIGH, MEDIUM, LOW, or NOTE.
