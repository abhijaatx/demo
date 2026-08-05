# SECURITY REVIEW REQUEST

Change summary:

- Added a local folder-sharing workbench for selecting nested folders, enabling public access, generating bounded share links, adding tracking labels, and configuring expiry.
- Added a route and editor entry point for the workflow.

Files changed:

- apps/web/components/folder-sharing-workbench.tsx
- apps/web/app/folder-sharing/page.tsx
- apps/web/components/editor-shell.tsx
- tests/folder-sharing-workbench.test.mjs

Trust boundaries and sensitive data affected:

- Browser-entered tracking labels and share settings are treated as untrusted input.
- Public link tokens and folder membership would cross the creator workspace/public viewer boundary in production; this workbench uses fixed local folders and does not persist data.

Authorization model:

- The current surface is a local preview only. A production implementation must require an authenticated workspace member, scope folder lookup and mutations by workspace ID, and enforce public-link viewer policy server-side.

Threats considered:

- Guessable or user-controlled share tokens, reflected URL content, open redirects, cross-tenant folder access, unauthorized revocation, expiry bypass, and clipboard leakage.

Security controls implemented:

- Share tokens use the browser's cryptographic randomUUID when available and fail closed otherwise.
- Tracking labels are sanitized and bounded by the existing domain helper; expiry is selected from a fixed allowlist.
- Destination URL is fixed to the local Supademo folder route; no arbitrary outbound URL is accepted.
- Rendered values use React text/value bindings and no unsafe HTML sinks.

Security tests added:

- tests/folder-sharing-workbench.test.mjs checks public/nested controls, bounded labels, expiry/token helpers, clipboard handling, unsafe sinks, and the noindex route.

Checks run and results:

- npm run verify — passed.
- Targeted workbench tests — to be run with the full serial suite before commit.
- Browser interaction verification — pending for the generated-link flow.

Checks not run:

- Native browser file chooser was not applicable; no upload is present in this workflow.
- Claude security review is unavailable in this environment; an independent reviewer must inspect the final diff before merge.

Dependencies or infrastructure permissions added:

- None.

Known limitations and residual risks:

- Production must create unguessable server-side tokens, authorize every folder read/write/revoke by workspace, enforce expiry and rate limits server-side, and keep identified viewer data separate from anonymous analytics.
- The preview uses static sample folders and cannot verify production storage, audit logging, or public-link abuse controls.

Please review the full diff and surrounding code for OWASP Top 10, tenant isolation,
authentication/authorization, input validation, XSS, SSRF, injection, upload safety,
secret exposure, privacy, dependency risk, insecure cloud configuration, and missing
negative tests. Classify findings as BLOCKER, HIGH, MEDIUM, LOW, or NOTE.
