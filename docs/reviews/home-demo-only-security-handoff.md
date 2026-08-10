SECURITY REVIEW REQUEST

Change summary:

- Made the Home page's demo-only actions truthful and navigable.
- Replaced dead fragment links with internal, encoded sample-demo routes.
- Changed the primary Home action to “Explore sample demos” when the explicit local demo-only flag is enabled.

Files changed:

- apps/web/app/page.tsx
- tests/home-sections.test.mjs

Trust boundaries and sensitive data affected:

- The Home page renders only static sample identifiers in demo-only mode.
- No API calls, credentials, customer data, uploads, or tenant-owned records were added or changed.

Authorization model:

- Normal production Home behavior retains its Create demo route.
- In demo-only mode the Home page directs users only to the local, read-only sample-demo routes; server-side mutation authorization is unchanged.

Threats considered:

- Open redirects or path injection through demo identifiers.
- Misleading actions that imply a local sample can be created, edited, or shared.
- Accidental production activation of demo-only wording.

Security controls implemented:

- Route paths are constructed from fixed fixture IDs and passed through `encodeURIComponent`.
- The demo-only primary action is controlled by the explicit public local-preview flag.
- No untrusted values are rendered or passed to an external URL.

Security tests added:

- `tests/home-sections.test.mjs` checks the explicit demo-only action, concrete sample/template routes, encoded demo identifiers, and absence of the prior dead `#demo` link.

Checks run and results:

- `npm run format` — passed.
- `npm run verify` — passed.
- `node --test tests/home-sections.test.mjs` — 2 passed.
- Browser QA — passed: Home shows the demo-only primary action and a recent-demo link reaches the read-only sample route.
- Impeccable detector — passed with no findings for `apps/web/app/page.tsx` and `apps/web/app/globals.css`.

Checks not run:

- Full test suite and dependency, secret, SAST, container, and infrastructure scans were not rerun for this navigation-only UI change. No dependencies, external endpoints, secrets, or infrastructure changed.

Dependencies or infrastructure permissions added:

- None.

Known limitations and residual risks:

- The demo-only sample editor remains a read-only shell until the API-backed recorder and persistence path are connected.
- This change requires the independent Claude security review required by `AGENTS.md` before release.

Please review the full diff and surrounding code for OWASP Top 10, tenant isolation,
authentication/authorization, input validation, XSS, SSRF, injection, upload safety,
secret exposure, privacy, dependency risk, insecure cloud configuration, and missing
negative tests. Classify findings as BLOCKER, HIGH, MEDIUM, LOW, or NOTE.
