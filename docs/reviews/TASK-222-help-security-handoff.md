# SECURITY REVIEW REQUEST

## Change summary

- Audited the Help page against the live Supademo surface and confirmed its 761px single-screen flow and support option layout.
- Added `referrerPolicy="no-referrer"` to the remote interactive-tour artwork.
- Browser-validated all five fixed support/tour destinations and captured the page screenshot.

## Files changed

- `apps/web/components/marketing-help.tsx`
- `tests/help.test.mjs`
- `docs/reviews/TASK-222-help-security-handoff.md`

## Trust boundaries and sensitive data affected

- Public, unauthenticated support surface. No workspace data, account credentials, analytics, uploads, or private APIs are involved.
- Four support links and the tour link are fixed destinations; one is a same-origin changelog path and the others are known public service origins.
- The page embeds a public image only; it does not execute or inject captured HTML.

## Authorization model

- No privileged operation was added. Every destination is intentionally public.

## Threats considered

- Open redirects or user-controlled support destinations.
- Referrer leakage and third-party asset tracking.
- XSS through tour artwork or support labels.
- Broken external links or accidental navigation to internal services.

## Security controls implemented

- Support labels and URLs are compile-time constants.
- Tour artwork uses `referrerPolicy="no-referrer"` and is rendered as a normal image element.
- No unsafe DOM/code sinks, dynamic URL construction, forms, uploads, or server-side fetching were added.
- Existing links retain explicit fixed HTTPS or same-origin paths.

## Security tests added

- `tests/help.test.mjs` asserts fixed docs/status links, tour CTA, referrer policy, absence of a fabricated footer, and no unsafe sinks.
- Browser validation enumerated all support/tour links and captured `local-help-top-final.jpg`.

## Checks run and results

- Local and live body height matched at 761px; screenshot geometry was visually compared at the review viewport.
- `node --test tests/help.test.mjs` — passed (include with the focused page suite below).
- `npm run lint`, `npm run typecheck`, `npm run check:boundaries`, `git diff --check`, and `npm audit --omit=dev --audit-level=high` — passed in the preceding Careers verification run.

## Checks not run

- Claude security review was not callable in this environment; an independent review must inspect the full diff before merge.
- Dynamic DAST, secret scanning, container scanning, infrastructure policy scanning, and production browser security checks were unavailable locally.

## Dependencies or infrastructure permissions added

- None.

## Known limitations and residual risks

- External docs, feedback, status, and interactive-tour origins remain availability and third-party policy dependencies.
- The interactive tour is linked out to the app origin rather than reproduced locally; this preserves the reference behavior but relies on that public route remaining available.

Please review the full diff and surrounding code for OWASP Top 10, tenant isolation,
authentication/authorization, input validation, XSS, SSRF, injection, upload safety,
secret exposure, privacy, dependency risk, insecure cloud configuration, and missing
negative tests. Classify findings as BLOCKER, HIGH, MEDIUM, LOW, or NOTE.
