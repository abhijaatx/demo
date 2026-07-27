# SECURITY REVIEW REQUEST — TASK-019

## Change summary

- Added a local `/workbench` route as an equivalent component workbench for shared UI validation.
- Added representative normal, loading, error, empty, disabled, dark-mode, overlay, table, media, and simple-versus-advanced disclosure states.
- Added deterministic visual-baseline metadata and tests for stable selectors, blocked network assumptions, responsive viewports, and state coverage.

## Files changed

- `apps/web/app/workbench/page.tsx`
- `apps/web/components/component-workbench.tsx`
- `apps/web/app/globals.css`
- `tests/component-workbench.test.mjs`
- `tests/visual-baselines/workbench-baselines.json`
- `docs/component-workbench.md`
- `docs/reviews/TASK-019-security-handoff.md`

## Trust boundaries and sensitive data affected

The workbench is local development and test tooling only. It adds no API routes, persistence, authorization, uploads, analytics, storage, third-party permissions, or infrastructure permissions. The route is marked `noindex` and is not added to product navigation. Component labels, fields, and table rows are fixture data; they are rendered through React components without raw HTML execution.

## Authorization model

No privileged operation is introduced. The workbench is not an authenticated product surface and must not be deployed as a public production feature. Any future deployment of a component laboratory requires environment-level access control and an explicit review of fixture data.

## Threats considered

- Accidental exposure of internal workbench content through navigation or search indexing.
- XSS or code execution through fixture content or component examples.
- Unintended external requests from the blocked remote-media example.
- Misleading visual tests caused by live clocks, random values, animations, or network state.
- Accessibility regressions in buttons, fields, tabs, tables, dropdowns, and modal surfaces.
- Advanced controls becoming a default product workflow or bypassing authorization assumptions.

## Security controls implemented

- `/workbench` is not linked from the primary navigation and declares `robots: { index: false, follow: false }`.
- Fixture content uses typed React values and no `dangerouslySetInnerHTML`, `innerHTML`, or dynamic code execution.
- Remote media is intentionally blocked by the existing `Image` policy and renders a fallback.
- Stable `data-workbench-section` selectors define visual capture regions.
- The baseline contract requires blocked network, reduced animation, fixed clock, seeded randomness, and fixed locale.
- Advanced controls are opt-in through an explicit Simple/Advanced toggle.
- Existing shared primitives provide native controls, labels, table semantics, focus handling, and overlay behavior.

## Security tests added

- `tests/component-workbench.test.mjs` checks route privacy metadata, absence of unsafe HTML/code APIs, representative state coverage, accessible interaction markers, stable selectors, and deterministic baseline metadata.

## Checks run and results

- `npm run build` — passed; Next.js produced `/`, `/_not-found`, and `/workbench`.
- `node --test tests/component-workbench.test.mjs` — 3 passed.
- `npm test` — 59 total; 58 passed and 1 expected integration test skipped because local dependency environment variables were absent.
- `npm run verify` — passed: formatting, ESLint, workspace boundaries, and TypeScript checks.
- `npm audit --audit-level=high` — passed; 0 vulnerabilities reported.
- `curl -fsS http://127.0.0.1:3000/workbench` — passed against the already-running local web server; the route returned the workbench heading and noindex metadata.

No dependencies, IAM actions, or infrastructure permissions were added.

## Checks not run

- Browser screenshot capture/diff and screen-reader testing were not run in this local handoff; the repository has a deterministic baseline contract but no browser runner configured yet. Run the route at `/workbench` with the specified viewports and state matrix before release.
- Independent Claude review has not yet been performed.

## Known limitations and residual risks

- `robots` metadata is not an access-control boundary. The workbench must remain behind deployment-level access control if it is ever hosted outside local development.
- Source-level tests do not prove pixel fidelity or full assistive-technology behavior.
- The baseline contract describes the required browser controls; it does not itself produce PNG artifacts.

## Requested Claude review

Please independently inspect the full diff and surrounding code for OWASP Top 10, XSS, accidental public exposure, unsafe fixture rendering, external network access, accessibility regressions, dependency risk, and missing negative tests. Classify findings as BLOCKER, HIGH, MEDIUM, LOW, or NOTE. Do not rely only on this summary.

### Status

Pending independent Claude review. Do not mark TASK-019 complete in `TASKS.md` until BLOCKER/HIGH findings are resolved or explicitly accepted by an authorized human.
