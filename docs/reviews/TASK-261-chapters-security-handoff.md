SECURITY REVIEW REQUEST

Change summary:

- Added a local Chapters workbench for initial overlays, between-step context, end CTAs, forms, layout/theme/opacity/blur controls, viewer buttons, and conditional branching previews.

Files changed:

- apps/web/components/chapters-workbench.tsx
- apps/web/app/chapters/page.tsx
- apps/web/app/globals.css
- apps/web/components/editor-shell.tsx
- tests/chapters-workbench.test.mjs

Trust boundaries and sensitive data affected:

- Chapter copy, button labels, and destination URLs are user-entered authoring values held in browser state.
- The preview contains illustrative form fields only and never accepts or sends a lead submission.

Authorization model:

- This route is a local authoring preview with no server persistence. Production chapter writes must bind demo and workspace IDs, enforce edit/publish permissions, validate target steps, and protect publish actions with revision checks and audit events.

Threats considered:

- Unsafe external URLs, stored XSS in chapter copy, branch loops, unbounded button/form growth, and accidental lead-data collection.

Security controls implemented:

- Button count limit of 12, title/body/URL bounds, allowlisted `validateSafeUrl` destinations, React text rendering, fixed step targets, and local-only form preview.
- No fetch, innerHTML, dynamic code execution, file upload processing, or lead persistence.

Security tests added:

- tests/chapters-workbench.test.mjs checks intro/CTA/form/branching controls, button limits, safe URL validation, no unsafe sinks, and editor entry link.

Checks run and results:

- npm run verify — passed.
- node --test tests — 508 passed, 1 skipped.
- npm run build — passed; /chapters generated.
- npm audit --omit=dev --audit-level=high — 0 vulnerabilities.
- git diff --check — passed.
- Browser verification — added a between-step chapter, switched it to a lead-capture form, added a second button, and confirmed the preview.

Checks not run:

- Native file upload, lead submission, and published branching were not exercised because this route intentionally has no remote persistence and the browser session cannot grant native capture permissions.

Dependencies or infrastructure permissions added:

- None.

Known limitations and residual risks:

- Production chapter publishing still needs server-side loop/target validation, tenant authorization, form schema validation, CSRF/idempotency, lead privacy/retention controls, and safe media processing if cover uploads are added.

Please review the full diff and surrounding code for OWASP Top 10, tenant isolation,
authentication/authorization, input validation, XSS, SSRF, injection, upload safety,
secret exposure, privacy, dependency risk, insecure cloud configuration, and missing
negative tests. Classify findings as BLOCKER, HIGH, MEDIUM, LOW, or NOTE.

Claude review status: unavailable in this environment; human/Claude review remains required before production use.
