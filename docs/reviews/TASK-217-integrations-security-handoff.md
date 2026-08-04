# TASK-217 Security Handoff

SECURITY REVIEW REQUEST

Change summary:

- Replaced placeholder integration initials with the fixed Supademo integration marks and reference descriptions.
- Matched the live integration library card padding, logo sizing, hidden count chrome, and full-card link treatment.
- Added an allowlisted integration detail route with a safe not-found state so every card opens a working page.
- Preserved the bounded category filter, fixed local integration-detail links, and CTA behavior.

Files changed:

- `apps/web/components/marketing-integrations.tsx`
- `apps/web/app/integrations/[slug]/page.tsx`
- `apps/web/app/globals.css`
- `tests/integrations.test.mjs`
- `docs/reviews/TASK-217-integrations-security-handoff.md`

Trust boundaries and sensitive data affected:

- Public integration directory and third-party logo asset requests to `supademo.com`.
- Fixed links to local `/integrations/[slug]` detail routes and local `/signup`/`/product-demo` CTAs.
- The detail route resolves slugs against the repository-owned integration catalog before rendering.
- No authenticated data, tenant records, uploads, analytics, or secrets are introduced.

Authorization model:

- The directory is public and category selection is presentation-only local state.
- Integration slugs, asset paths, and link destinations are repository-owned literals; no request or form value is interpolated into an outbound URL.

Threats considered:

- Open redirects and URL injection through integration cards.
- XSS or unsafe DOM sinks in static vendor names/descriptions.
- Remote asset failure and referrer leakage.
- Excessive DOM rendering from category selection.

Security controls implemented:

- Static integration arrays and fixed local detail links.
- The dynamic route uses `getIntegrationBySlug` against the static catalog and renders a generic not-found page for unknown slugs.
- Remote logos use `referrerPolicy="no-referrer"` and hide on load failure.
- Category selection filters an in-memory allowlist and exposes `aria-expanded`, radio semantics, and `aria-live` updates.
- Full-card anchors retain keyboard/screen-reader text while visually matching the reference cards.
- No `dangerouslySetInnerHTML`, `innerHTML`, `eval`, or dynamic code execution.

Security tests added:

- `tests/integrations.test.mjs` now checks fixed logo/copy maps, category controls, local links, detail-route wiring, allowlisted slug lookup, remote referrer policy, reduced-motion CSS, and unsafe-sink exclusion.
- Browser validation exercised the category disclosure, all category radios, clear-filter behavior, and integration-card navigation semantics.

Checks run and results:

- `node --test tests/integrations.test.mjs tests/customers.test.mjs tests/industry.test.mjs tests/use-cases.test.mjs tests/marketing-reference.test.mjs tests/pricing.test.mjs` — passed.
- `npm run lint` — passed.
- `npm run typecheck` — passed.
- `npm run check:boundaries` — passed.
- `git diff --check` — passed.
- `npm audit --omit=dev --audit-level=high` — passed; 0 vulnerabilities reported.

Checks not run:

- Claude's independent security review — no Claude review tool is available in this environment; this handoff must be reviewed before merge.
- Dynamic, secret, container, and infrastructure scanners — no configured commands were available for this static public-route change; run CI equivalents before release.

Dependencies or infrastructure permissions added:

- None.

Known limitations and residual risks:

- Vendor logos and integration copy are public reference content; provider asset availability and commercial copy may change.
- Integration detail routes are local synthetic pages; wiring real provider APIs requires a separate OAuth, webhook, scope, tenant-isolation, and secret-storage review.
- The full-card visual link is intentionally transparent; its accessible text remains in the DOM so keyboard and assistive-technology users retain a destination.

Please review the full diff and surrounding code for OWASP Top 10, tenant isolation,
authentication/authorization, input validation, XSS, SSRF, injection, upload safety,
secret exposure, privacy, dependency risk, insecure cloud configuration, and missing
negative tests. Classify findings as BLOCKER, HIGH, MEDIUM, LOW, or NOTE.
