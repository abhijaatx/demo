# TASK-216 Security Handoff

SECURITY REVIEW REQUEST

Change summary:

- Aligned the public `/customers` directory with the captured Supademo reference geometry.
- Limited the initial story grid to the same 12 visible stories and retained the fixed “Show 7 more” expansion behavior.
- Matched the reference directory widths, card rhythm, statistics section, and industry table positioning.

Files changed:

- `apps/web/components/marketing-customers.tsx`
- `apps/web/app/globals.css`
- `docs/reviews/TASK-216-customers-security-handoff.md`

Trust boundaries and sensitive data affected:

- Public customer-story and industry-directory presentation only.
- Fixed remote logo and hero-image requests to `supademo.com`.
- No authenticated data, tenant records, uploads, analytics events, or secrets are introduced.

Authorization model:

- The route is public. Story and industry links are fixed same-origin destinations or the fixed `/product-demo` CTA.
- Filters, tabs, and “Show 7 more” only update bounded local state; they do not authorize access to customer records.

Threats considered:

- Open redirects or URL injection through customer links.
- XSS/unsafe DOM sinks in static story content.
- Unbounded result rendering or client-side denial of service from pagination.
- Remote asset failure and referrer leakage.

Security controls implemented:

- Story and industry destinations are repository-owned literal paths.
- Initial result count is bounded at 12; expansion adds a fixed seven-item page and cannot exceed the static story list.
- Category tabs expose `role="tab"`, `aria-selected`, and `aria-live` result updates.
- Remote images use `referrerPolicy="no-referrer"`; no unsafe HTML or dynamic code execution is used.

Security tests added:

- Existing `tests/customers.test.mjs` covers the route, bounded pagination contract, live result semantics, fixed links, tab accessibility, reduced-motion CSS, and unsafe-sink exclusion.
- Browser validation confirmed 12 initial cards, 19 after “Show 7 more,” filter disclosure state, and all six industry tab row counts (Featured 15, Enterprise 4, Software 3, Healthcare 3, Finance & Banking 3, Government & Non-Profit 2).

Checks run and results:

- `node --test tests/customers.test.mjs` — passed.
- `npm run lint` — passed after the change.
- `npm run typecheck` — passed after the change.
- `npm run check:boundaries` — passed after the change.
- `git diff --check` — passed after the change.
- `npm audit --omit=dev --audit-level=high` — passed; 0 vulnerabilities reported.

Checks not run:

- Claude's independent security review — no Claude review tool is available in this environment; this handoff must be reviewed before merge.
- Dynamic, secret, container, and infrastructure scanners — no configured commands were available for this static public-route change; run CI equivalents before release.

Dependencies or infrastructure permissions added:

- None.

Known limitations and residual risks:

- Customer names, outcomes, metrics, and logos are static reference content and require product/legal approval before being treated as verified commercial claims.
- Remote assets can change or fail at the provider; the existing image fallback behavior should be retained if the asset pipeline is changed.
- If story content becomes tenant-backed, add server-side identity, workspace scoping, authorization, pagination limits, and privacy review before replacing the static arrays.

Please review the full diff and surrounding code for OWASP Top 10, tenant isolation,
authentication/authorization, input validation, XSS, SSRF, injection, upload safety,
secret exposure, privacy, dependency risk, insecure cloud configuration, and missing
negative tests. Classify findings as BLOCKER, HIGH, MEDIUM, LOW, or NOTE.
