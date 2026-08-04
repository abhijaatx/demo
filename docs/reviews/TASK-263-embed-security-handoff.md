SECURITY REVIEW REQUEST

Change summary:

- Added an Embed workbench for individual demos, multi-demo Showcases, and HTML demos with responsive aspect ratios, fullscreen/lazy options, inline iframe or popup mode, safe ID normalization, preview, and copyable snippets.

Files changed:

- apps/web/components/embed-workbench.tsx
- apps/web/app/embed/page.tsx
- apps/web/app/globals.css
- apps/web/components/editor-shell.tsx
- tests/embed-workbench.test.mjs

Trust boundaries and sensitive data affected:

- User-entered demo/showcase IDs are normalized before appearing in URLs or generated code.
- Generated HTML is displayed as text in a read-only textarea; this page does not execute or load it.

Authorization model:

- The preview does not fetch or authorize embedded content. Production embed endpoints must enforce public-link policy, tenant/demo scope, origin restrictions, CSP, and sandbox permissions.

Threats considered:

- HTML/JS injection through IDs, unsafe third-party script origins, iframe escape, clipboard leakage, and accidental execution of generated code.

Security controls implemented:

- ID allowlist and 96-character bound.
- Existing domain `generateIframeSnippet` and `generatePopupEmbedSnippet` helpers; Showcase snippet uses a fixed Supademo origin and encoded ID.
- No `innerHTML`, `fetch`, eval, or live third-party iframe; generated code is shown as text only.
- Fullscreen and lazy loading are explicit toggles.

Security tests added:

- tests/embed-workbench.test.mjs checks generator helpers, target modes, ID normalization, local-only disclaimer, no unsafe sinks, and editor entry link.

Checks run and results:

- npm run verify — passed.
- node --test tests — 511 passed, 1 skipped.
- npm run build — passed; `/embed` generated as a static route.
- npm audit --omit=dev --audit-level=high — 0 vulnerabilities.
- git diff --check — passed.
- Browser verification — generated demo and Showcase snippets, switched to 4:3, disabled lazy loading, and copied the code.

Checks not run:

- No third-party embed was loaded or executed; native clipboard success was browser-permission dependent.

Dependencies or infrastructure permissions added:

- None.

Known limitations and residual risks:

- Production embeds need a documented sandbox/CSP policy, origin validation, postMessage validation, clickjacking protections, and server-side link authorization. Popup snippets should be reviewed against the host site’s CSP before use.

Please review the full diff and surrounding code for OWASP Top 10, tenant isolation,
authentication/authorization, input validation, XSS, SSRF, injection, upload safety,
secret exposure, privacy, dependency risk, insecure cloud configuration, and missing
negative tests. Classify findings as BLOCKER, HIGH, MEDIUM, LOW, or NOTE.

Claude review status: unavailable in this environment; human/Claude review remains required before production use.
