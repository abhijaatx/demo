SECURITY REVIEW REQUEST

Change summary:

- Continued the captured Supademo page-fidelity pass across public customer, industry, tool, blog,
  product-update, and authenticated-home surfaces.
- Added route-specific static copy, section composition, fixed reference artwork, responsive layout
  geometry, and reduced-motion-safe transitions for the recently audited pages.
- Added the annotation-generator workbench preview, corrected route-specific CTA and section heights,
  and made Product Updates category/search controls filter their cards instead of ignoring input.
- Reused the existing local authentication flow; no new authentication implementation or privileged
  endpoint was introduced.

Files changed:

- apps/web/components/marketing-blog.tsx
- apps/web/components/marketing-customer-detail.tsx
- apps/web/components/marketing-industry.tsx
- apps/web/components/marketing-tool-detail.tsx
- apps/web/app/globals.css
- docs/reviews/TASK-201-security-handoff.md

Trust boundaries and sensitive data affected:

- Public marketing routes render static, reviewed content and fixed remote artwork.
- Product Updates search and category filters operate only on a bounded in-memory catalog; query
  text is rendered as text and is not used to build URLs or outbound requests.
- The annotation-generator workbench is a static local preview. It accepts no files, HTML, scripts,
  credentials, or network destinations and does not cross the authenticated workspace boundary.
- Existing authenticated-home navigation remains behind the established auth/session boundary.
- Fixed Supademo CDN artwork is an external availability/privacy dependency, not a user-controlled
  fetch target.

Authorization model:

- Public page reads expose only static marketing content and allowlisted route data.
- Product Updates controls change local display state only and cannot select a workspace, demo,
  tenant, or privileged operation.
- The annotation preview is non-persistent and has no account or tenant permissions.
- Existing sign-in/signup and authenticated workspace operations continue to use the established
  CSRF-protected client and server authorization checks.

Threats considered:

- Route-slug injection, open redirects, SSRF, XSS, unsafe HTML rendering, and accidental tenant-data
  exposure.
- Search/filter input abuse, unbounded query growth, unsafe dynamic image sources, and misleading
  client-only controls.
- Motion accessibility regressions and keyboard/focus behavior on interactive controls.

Security controls implemented:

- Route selection remains allowlisted through the existing static route maps and bounded fallback.
- Product Updates query input remains capped at 120 characters and is used only for case-insensitive
  text matching over static data.
- No `dangerouslySetInnerHTML`, `innerHTML`, `outerHTML`, `eval`, `Function`, shell execution, or
  user-controlled network URL was added.
- Remote preview artwork uses fixed reviewed constants and existing `no-referrer` handling.
- Client-only controls are bounded and do not issue privileged requests.
- Existing `prefers-reduced-motion` rules remain in force for the new/revised transition surfaces.

Security tests added:

- Existing `tests/marketing-reference.test.mjs`, `tests/tool-detail.test.mjs`,
  `tests/customers.test.mjs`, and `tests/blog-page.test.mjs` continue to cover route wiring,
  bounded content, fixed assets, accessible controls, and unsafe-DOM exclusions.
- Browser verification exercised Product Updates category filtering and restoration, the annotation
  preview route, the mobile-app-demos route, and the authenticated local sign-in/signup flow using
  synthetic `.invalid` credentials only.
- Existing full-suite tenant-isolation, auth, XSS, SSRF, upload, CSRF, and input-validation tests
  were rerun.

Checks run and results:

- `npx prettier --write apps/web/components/marketing-blog.tsx` (passed)
- `npm run verify` (passed: formatting, lint, boundary checks, and typecheck)
- `npm test` (passed: 434 tests, 1 skipped, 0 failed)
- `git diff --check` (passed)
- Impeccable detector (no new findings in the changed components; it reported only the repository's
  existing global CSS warnings for side-tab borders, Arial, and a tiled grid background).
- Browser measurements against captured Supademo references: mobile-app-demos 7568px, Product
  Updates 6360px, and annotation-generator 5724px local document heights; the first two matched
  the captured references exactly, while annotation differed by one pixel from the capture.

Checks not run:

- Secret scanning, dependency audit, Semgrep/CodeQL, container scanning, infrastructure policy
  scans, and a live pixel-diff service were not run because no configured commands/service are
  available in this environment. Claude or CI should run the approved scanners before release.
- The remote Supademo CDN was not modified or trusted for authorization; its availability and
  content stability remain external dependencies.

Dependencies or infrastructure permissions added:

- None.

Known limitations and residual risks:

- This pass reproduces the captured routes and interactions observed during the browser crawl;
  newly launched Supademo routes or server-backed controls require a new audit.
- Static reference artwork can drift or become unavailable if the upstream public CDN changes.
- The annotation workbench is a visual preview, not a production upload/annotation pipeline; it
  intentionally does not persist or process user files.
- One captured annotation page differed by one document pixel due to browser rounding; no section
  was missing and all measured blocks aligned.

Please review the full diff and surrounding code for OWASP Top 10, tenant isolation,
authentication/authorization, input validation, XSS, SSRF, injection, upload safety,
secret exposure, privacy, dependency risk, insecure cloud configuration, and missing
negative tests. Classify findings as BLOCKER, HIGH, MEDIUM, LOW, or NOTE.
