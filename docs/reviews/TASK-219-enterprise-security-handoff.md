# SECURITY REVIEW REQUEST

## Change summary

- Matched the public Enterprise route to the Supademo reference flow and geometry.
- Replaced placeholder award and customer text with fixed, public reference artwork and logos.
- Added a bounded customer-category picker with accessible listbox semantics.
- Preserved bounded capability, pillar, and FAQ interactions and added reduced-motion coverage through the existing stylesheet.

## Files changed

- `apps/web/components/marketing-enterprise.tsx`
- `apps/web/app/globals.css`
- `tests/enterprise.test.mjs`
- `docs/reviews/TASK-219-enterprise-security-handoff.md`

## Trust boundaries and sensitive data affected

- This is a public, unauthenticated marketing route. It does not read workspace records, viewer data, credentials, or private APIs.
- The route loads fixed public images from `supademo.com` and links to fixed public destinations (`/product-demo` and `https://security.supademo.com`).
- The category picker, capability carousel, pillar tabs, and FAQ disclosures are local UI state only.

## Authorization model

- No privileged operation was added. All interactions are public presentation controls.
- Product-demo navigation remains a fixed same-origin path; the Trust Center link is a fixed HTTPS origin.

## Threats considered

- Open redirects or attacker-controlled navigation through the trust picker and CTA controls.
- XSS or DOM injection from customer labels, category values, image metadata, or FAQ content.
- Tracking/referrer leakage when loading external public artwork.
- Unbounded state transitions or accidental access to private application APIs.

## Security controls implemented

- Customer categories and all displayed content are compile-time constants.
- Capability and pillar indexes are bounded by fixed arrays; controls only update local state.
- External images use fixed paths and `referrerPolicy="no-referrer"`.
- No `innerHTML`, `dangerouslySetInnerHTML`, `eval`, dynamic code generation, URL construction from user input, forms, uploads, or server-side fetching were added.
- Interactive picker uses `aria-haspopup="listbox"`, `aria-expanded`, `role="listbox"`, `role="option"`, and `aria-selected`.
- Existing reduced-motion media query disables capability hover transforms and transitions.

## Security tests added

- `tests/enterprise.test.mjs` asserts fixed trust assets, listbox semantics, referrer policy, bounded controls, fixed destinations, and absence of unsafe DOM/code sinks.
- Browser validation exercised all capability buttons, carousel controls, trust-category options, all four pillar tabs, and FAQ disclosure behavior.

## Checks run and results

- `node --test tests/enterprise.test.mjs tests/compare.test.mjs tests/integrations.test.mjs tests/customers.test.mjs tests/industry.test.mjs tests/use-cases.test.mjs tests/marketing-reference.test.mjs tests/pricing.test.mjs` — passed.
- `npm run lint` — passed.
- `npm run typecheck` — passed.
- `npm run check:boundaries` — passed.
- `git diff --check` — passed.
- `npm audit --omit=dev --audit-level=high` — passed; 0 vulnerabilities reported.

## Checks not run

- Claude security review was not callable in this environment; an independent Claude review must still inspect the full diff before merge.
- Dynamic DAST, secret scanning, container scanning, infrastructure policy scanning, and production browser security checks were not available locally; run them in CI/staging.

## Dependencies or infrastructure permissions added

- None.

## Known limitations and residual risks

- The public award and customer artwork is hosted by a third-party origin and therefore remains an availability and supply-chain dependency; the UI treats it as decorative and does not grant trust based on its content.
- Remote enterprise demo artwork is intentionally loaded in a normal image element for visual parity; it is not executed as HTML or JavaScript.
- The page remains a marketing surface and does not provide enterprise authorization or security guarantees by itself.

Please review the full diff and surrounding code for OWASP Top 10, tenant isolation,
authentication/authorization, input validation, XSS, SSRF, injection, upload safety,
secret exposure, privacy, dependency risk, insecure cloud configuration, and missing
negative tests. Classify findings as BLOCKER, HIGH, MEDIUM, LOW, or NOTE.
