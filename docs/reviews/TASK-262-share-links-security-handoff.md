SECURITY REVIEW REQUEST

Change summary:

- Added a local Share Link workbench for public/private/password/email-gated links, tracking labels, step and showcase deep links, expiration presets, full-screen/card presentation, and local revoke/copy states.

Files changed:

- apps/web/components/share-links-workbench.tsx
- apps/web/app/share-link/page.tsx
- apps/web/app/globals.css
- apps/web/components/editor-shell.tsx
- tests/share-links-workbench.test.mjs

Trust boundaries and sensitive data affected:

- Viewer password input is held only in local component state and is never included in the generated URL.
- Generated URLs contain bounded demo IDs, tracking labels, step numbers, access mode, and optionally an expiring token.

Authorization model:

- This is a browser-local link preview; it does not authorize a viewer or persist a link. Production access gates must enforce workspace/demo ownership, password hashing, email verification, expiry, revocation, and public/private policies server-side.

Threats considered:

- Guessable expiring tokens, password/PII leakage in URLs, open redirects, malformed deep-link parameters, and false claims that a local revoke is server-side.

Security controls implemented:

- Existing `buildShareLinkUrl`, `sanitizeShareLabel`, and `calculateShareLinkExpiry` domain primitives.
- Crypto-only expiring token generation; the screen fails closed if `crypto.randomUUID` is unavailable.
- Tracking label and ID bounds; step and expiry allowlists; password length bound; no unsafe HTML or external calls.
- Clear copy/disclaimer states and no password/email values in URL output.

Security tests added:

- tests/share-links-workbench.test.mjs checks gates, tracking, expiry, showcase/step options, bounds, unsafe sinks, and editor entry link.

Checks run and results:

- npm run verify — passed.
- node --test tests — 511 passed, 1 skipped.
- npm run build — passed; `/share-link` generated as a static route.
- npm audit --omit=dev --audit-level=high — 0 vulnerabilities.
- git diff --check — passed.
- Browser verification — created a password-protected, 24-hour, step-3 showcase link and confirmed the password stayed out of the URL.

Checks not run:

- No production viewer access endpoint or real password gate was contacted; this is intentionally local.

Dependencies or infrastructure permissions added:

- None.

Known limitations and residual risks:

- Production tokens must be generated and stored server-side, access checks must be tenant-scoped and replay-resistant, and identified viewer data must follow retention/privacy controls.

Please review the full diff and surrounding code for OWASP Top 10, tenant isolation,
authentication/authorization, input validation, XSS, SSRF, injection, upload safety,
secret exposure, privacy, dependency risk, insecure cloud configuration, and missing
negative tests. Classify findings as BLOCKER, HIGH, MEDIUM, LOW, or NOTE.

Claude review status: unavailable in this environment; human/Claude review remains required before production use.
