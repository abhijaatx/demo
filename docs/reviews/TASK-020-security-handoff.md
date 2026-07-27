# SECURITY REVIEW REQUEST — TASK-020

## Change summary

- Added a direct `/ui-lab` reference route for the Record → Edit → Share creator journey.
- Added simple-by-default progressive disclosure with contextual advanced controls.
- Added responsive/accessibility audit tests for stage navigation, editor landmarks, mobile layout, 44px targets, and reduced motion.
- Refactored the authenticated shell to reuse shared UI primitives and reduce one-off shell control styling.

## Files changed

- `apps/web/app/ui-lab/page.tsx`
- `apps/web/components/ui-lab.tsx`
- `apps/web/components/app-shell.tsx`
- `apps/web/app/globals.css`
- `tests/ui-lab.test.mjs`
- `docs/ui-laboratory.md`
- `docs/reviews/TASK-020-security-handoff.md`

## Trust boundaries and sensitive data affected

The UI laboratory is local reference UI and fixture data only. It adds no API routes, persistence, authorization, uploads, analytics, storage, external permissions, or infrastructure permissions. The route is marked noindex and is not linked from primary product navigation. Fixture labels and media paths are rendered through React components; no raw HTML or dynamic code execution is introduced.

## Authorization model

No privileged operation is introduced. `/ui-lab` is not an authenticated product surface and must not be treated as a production feature without deployment-level access control. The UI's stage buttons and publish affordance are presentation fixtures and do not authorize server-side publishing.

## Threats considered

- Accidental discovery of internal reference content through navigation or indexing.
- XSS or code execution through fixture content.
- Confusing UI-only stage transitions with authorization or publication enforcement.
- Keyboard, responsive, or reduced-motion regressions that hide critical actions.
- Advanced controls becoming the default workflow or exposing sensitive internal concepts.
- Unsafe remote media or external data requests from the laboratory.

## Security controls implemented

- `/ui-lab` is not added to `AppShell` navigation and declares `robots: { index: false, follow: false }`.
- All fixture content is structured React content; no `dangerouslySetInnerHTML`, `innerHTML`, `eval`, or `Function` is introduced.
- Stage transitions are local state only; the documentation explicitly distinguishes them from authorization.
- Advanced controls are opt-in and contextual.
- Stage controls use native buttons with 44px minimum targets and `aria-current="step"`.
- The editor has explicit step-rail, canvas, and inspector landmarks.
- Media uses the existing same-origin-by-default image policy.

## Security tests added

- `tests/ui-lab.test.mjs` checks stage coverage, route privacy metadata, no new product navigation, progressive-disclosure markers, editor landmarks, unsafe-HTML exclusions, responsive CSS, reduced-motion CSS, and target sizing.

## Checks run and results

- `npm run build` — passed; Next.js produced `/`, `/_not-found`, `/ui-lab`, and `/workbench`.
- `node --test tests/ui-lab.test.mjs` — 3 passed.
- `npm test` — 62 total; 61 passed and 1 expected integration test skipped because local dependency environment variables were absent.
- `npm run verify` — passed: formatting, ESLint, workspace boundaries, and TypeScript checks.
- `npm audit --audit-level=high` — passed; 0 vulnerabilities reported.
- `curl -fsS http://127.0.0.1:3000/ui-lab` — passed against the already-running local web server; the route returned the journey heading and noindex metadata.

No dependencies, IAM actions, or infrastructure permissions were added.

## Checks not run

- Browser-based responsive screenshot capture, keyboard traversal, and screen-reader testing were not run because no browser visual runner is configured in the repository. Run `/ui-lab` at 1280×720 and 390px widths before release.
- Independent Claude review has not yet been performed.

## Known limitations and residual risks

- `robots` metadata is not access control; deployment protection is required if the laboratory is hosted outside local development.
- Static tests cannot prove full browser focus order, screen-reader announcements, or pixel fidelity.
- The fixture publish button must never be wired to a real publish operation without server-side identity, tenant scope, permissions, CSRF protection, and audit logging.

## Requested Claude review

Please independently review the full diff and surrounding code for OWASP Top 10, accidental exposure, XSS, unsafe media, authorization assumptions, accessibility regressions, responsive failure modes, and missing negative tests. Classify findings as BLOCKER, HIGH, MEDIUM, LOW, or NOTE. Do not rely only on this summary.

### Status

Pending independent Claude review. Do not mark TASK-020 complete in `TASKS.md` until BLOCKER/HIGH findings are resolved or explicitly accepted by an authorized human.
