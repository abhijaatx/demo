SECURITY REVIEW REQUEST

Change summary:

- Split the interactive free-tool controls into a dedicated client component so the dynamic trust-category picker and team tabs do not cross a Next.js server/client boundary.
- Added bounded controls for the screenshot editor workbench (tool selection, upload affordance, output actions, status feedback) with image MIME and 10 MB client-side checks.
- Added reference-aligned section rhythm for all ten free-tool detail routes and captured full-page local/reference browser evidence for the complete 91-route public inventory.

Files changed:

- apps/web/components/marketing-tool-detail.tsx
- apps/web/components/tool-detail-interactions.tsx
- apps/web/components/tool-detail-workbench.tsx
- apps/web/components/marketing-features.tsx
- apps/web/app/globals.css
- tests/tool-detail.test.mjs
- tests/features.test.mjs (existing regression now passes with the accessible feature tab strip)
- browser-qa/supademo-crawl-2026-08-03/README.md
- browser-qa/supademo-crawl-2026-08-03/actions/route-crawl.json
- browser-qa/supademo-crawl-2026-08-03/actions/button-actions-reference.json
- browser-qa/supademo-crawl-2026-08-03/actions/tools-reference-sections.json
- browser-qa/supademo-crawl-2026-08-03/actions/tools-local-exercised.json
- browser-qa/supademo-crawl-2026-08-03/public/reference/*.png
- browser-qa/supademo-crawl-2026-08-03/public/local/*.png

Trust boundaries and sensitive data affected:

- Browser-rendered public marketing/tool pages and client-side UI state.
- User-selected screenshot files are accepted only by the local browser workbench; they are not uploaded, persisted, or sent to a server by this change.
- Public external image assets remain rendered with referrer suppression where applicable.

Authorization model:

- The public tool pages expose only public content and route to the existing signup flow for account creation.
- No new protected API or workspace operation was added.
- The screenshot editor workbench does not grant access to stored assets or bypass authentication; its upload input is a local preview affordance only.

Threats considered:

- Server/client boundary mistakes exposing callable server functions to the browser.
- Malicious or oversized image selection in the screenshot-editor input.
- Unsafe DOM injection through tool labels, trust categories, tabs, or route slugs.
- External navigation and download side effects from public CTA controls.
- Accidental secret or personal-data capture in the browser evidence directory.

Security controls implemented:

- Server-only tool catalog/getter exports remain in the server component; interactive state lives in a client child component.
- Screenshot input uses an explicit PNG/JPEG/WebP MIME allowlist and a 10 MB size limit before status is updated.
- React text rendering is used throughout; no `dangerouslySetInnerHTML`, `innerHTML`, `eval`, or dynamic code execution was added.
- Browser evidence records URLs, labels, headings, and measured heights rather than cookies, tokens, request bodies, or local storage.

Security tests added:

- tests/tool-detail.test.mjs verifies the server/client split, bounded listbox/tab controls, screenshot MIME/size guard, live status region, and absence of unsafe DOM/code sinks.
- Browser checks exercised all tool trust options, six use-case tabs, FAQ surfaces, and screenshot editor actions.
- Full route capture recorded 91 local and 91 live reference pages in the crawl manifest.

Checks run and results:

- `node --test tests/tool-detail.test.mjs tests/tools.test.mjs` — passed.
- `npm test` — passed: 438 tests passed, 1 skipped, 0 failed; includes production build and the complete test suite.
- `npm run verify` — passed: formatting, lint, workspace-boundary checks, and type checks.
- `npm run format` and `npm run format:check` — passed.
- `npm run lint` — passed.
- `npm run check:boundaries` — passed.
- `npm audit --omit=dev --audit-level=high` — passed; 0 vulnerabilities reported.
- `npm run typecheck --workspace=@supademo/web` — passed.
- `git diff --check` — passed.
- Browser runtime validation — all ten tool routes render without the prior server/client error; captured heights match the live reference for nine routes and are within one pixel for the screenshot editor.

Checks not run:

- Secret scanning, SAST, DAST, container scanning, IaC scanning, and Claude's independent review were unavailable in this environment. Run those checks before merge; the residual risk is that unrelated workspace or infrastructure-policy issues may remain outside this route-level validation.

Dependencies or infrastructure permissions added:

- None.

Known limitations and residual risks:

- The screenshot editor workbench is a local UI fixture; it does not yet perform server-side media processing or publication.
- Some public routes still have documented visual-height/content differences in `actions/route-crawl.json`; the evidence folder records those mismatches rather than hiding them.
- Browser action logs intentionally skip controls that would trigger authentication, downloads, external destinations, or other side effects; these are labeled in `button-actions-reference.json`.

Please review the full diff and surrounding code for OWASP Top 10, tenant isolation,
authentication/authorization, input validation, XSS, SSRF, injection, upload safety,
secret exposure, privacy, dependency risk, insecure cloud configuration, and missing
negative tests. Classify findings as BLOCKER, HIGH, MEDIUM, LOW, or NOTE.
