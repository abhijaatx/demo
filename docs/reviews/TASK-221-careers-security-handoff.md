# SECURITY REVIEW REQUEST

## Change summary

- Matched the Careers route to the reference section flow and desktop geometry.
- Overlaid the public navigation on the hero, tightened the impact/collage bands, and removed the extra roles-to-story gap.
- Browser-validated the team gallery controls and captured the complete route in section screenshots.

## Files changed

- `apps/web/app/globals.css`
- `tests/careers.test.mjs` (existing coverage reviewed)
- `docs/reviews/TASK-221-careers-security-handoff.md`

## Trust boundaries and sensitive data affected

- Public, unauthenticated marketing page. It does not read workspace records, credentials, private APIs, or user-submitted content.
- The page loads fixed public Supademo team photos and uses fixed same-page navigation to `#open-roles`.
- Gallery state is a bounded local index over a compile-time image list.

## Authorization model

- No privileged operation was added. All content and controls are public.
- The “Explore open roles” CTA is a same-page fragment link; gallery arrows only update presentation state.

## Threats considered

- XSS or unsafe markup through team labels and image metadata.
- Tracking/referrer leakage from remote photos.
- Open redirects or attacker-controlled navigation from the gallery and roles CTA.
- Unbounded state transitions and broken keyboard activation.

## Security controls implemented

- Gallery indexes are wrapped modulo the fixed `heroPhotos` array length.
- Image URLs, alt text, and labels are compile-time constants; remote images use `referrerPolicy="no-referrer"`.
- No unsafe DOM APIs, dynamic code, forms, uploads, URL construction from input, or private API calls were added.
- Arrow buttons have explicit type, accessible names, focus states, and reduced-motion behavior.

## Security tests added

- Existing `tests/careers.test.mjs` asserts the bounded gallery controls, safe roles anchor, remote founder asset, showcase footer, and no unsafe sinks.
- Browser validation clicked Previous and Next team-moment buttons, confirmed the image returned to its initial state, exercised the roles anchor, and captured top, impact, collage, roles, and story screenshots.

## Checks run and results

- Browser geometry matched the reference exactly at the review viewport: body 5,548px; hero 1,040px at 41px; impact 385px at 1,081px; collage 878px at 1,466px; roles 890px at 2,344px; story 1,039px at 3,234px; footer 1,275px at 4,273px.
- `node --test tests/accessibility-page.test.mjs tests/enterprise.test.mjs tests/compare.test.mjs tests/integrations.test.mjs tests/customers.test.mjs tests/industry.test.mjs tests/use-cases.test.mjs tests/marketing-reference.test.mjs tests/pricing.test.mjs` — passed before the CSS-only Careers parity change; rerun with the Careers test included.
- `npm run lint`, `npm run typecheck`, `npm run check:boundaries`, `git diff --check`, and `npm audit --omit=dev --audit-level=high` — passed in the same verification run.

## Checks not run

- Claude security review was not callable in this environment; an independent review must inspect the full diff before merge.
- Dynamic DAST, secret scanning, container scanning, infrastructure policy scanning, and production browser security checks were unavailable locally.

## Dependencies or infrastructure permissions added

- None.

## Known limitations and residual risks

- Remote team photos remain an availability and third-party asset dependency, though they are decorative and not executed content.
- Careers content is static and does not provide an applicant workflow; “Open roles” accurately reflects the current empty state.
- The external image origin is not controlled by the page at runtime; use a trusted asset proxy if policy later disallows third-party marketing images.

Please review the full diff and surrounding code for OWASP Top 10, tenant isolation,
authentication/authorization, input validation, XSS, SSRF, injection, upload safety,
secret exposure, privacy, dependency risk, insecure cloud configuration, and missing
negative tests. Classify findings as BLOCKER, HIGH, MEDIUM, LOW, or NOTE.
