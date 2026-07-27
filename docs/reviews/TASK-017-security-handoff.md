# SECURITY REVIEW REQUEST — TASK-017

## Change summary

- Added accessible `Table`, `List`, `Card`, `Stat`, `Timeline`, `Progress`, and `VirtualizedCollection` primitives.
- Added `useTableSort` and `useSelection` hooks for local sort/selection state.
- Added explicit loading, empty, and error states; responsive table transformation; bounded virtualization range calculation; and tests.

## Trust boundaries and sensitive data affected

- This task changes presentation and local UI state only. It adds no API routes, persistence, authorization, uploads, analytics, storage, or external permissions.
- Rows, labels, cell renderers, and error content are caller-provided React values. React escapes text/attributes; the primitives do not render raw HTML or execute strings.
- Row IDs and sort keys are used as React keys or UI state only. They are not treated as authorization evidence, SQL fragments, URLs, or tenant identifiers by these components.
- Server filtering, sorting, pagination, row visibility, and tenant scope remain required at the API boundary.

## Threats considered and controls

- XSS through cells or state messages: no `dangerouslySetInnerHTML`, `innerHTML`, `eval`, or string-to-code execution is introduced.
- Authorization bypass through selected rows: selection hooks only hold client state; destructive actions must re-check authorization server-side.
- Large-list resource exhaustion: virtualization and range calculation cap item counts, row heights, viewport heights, overscan, and rendered windows.
- Table accessibility regression: native `<table>`, `<caption>`, scoped headers, `aria-sort`, selection labels, `aria-selected`, and responsive `data-label` cells are implemented.
- State ambiguity: loading, error, and empty states are rendered explicitly; error rows use alert semantics without exposing internal details.
- Layout denial of service: table and virtualized containers constrain overflow to local scroll regions; caller-controlled numeric dimensions are clamped.

## Security tests/checks added or run

- `tests/data-display.test.mjs` checks table semantics, sorting/selection state, explicit states, bounded virtualized rendering, unsafe-input exclusions, and responsive CSS controls.
- Full repository build, tests, formatting, ESLint, workspace boundaries, TypeScript checks, and high-severity dependency audit remain required.

## Checks not run

- Browser performance profiling with 1,000+ real rows, screen-reader testing, keyboard selection interaction, visual regression, and API-backed tenant/authorization tests were not run because no browser/data workflow was requested for this task.
- Independent Claude review has not yet been performed.

## Requested Claude review

Review the full diff for unsafe cell rendering, row-ID misuse, selection-driven authorization assumptions, unbounded virtualization, table semantics at responsive breakpoints, focus/keyboard regressions, misleading loading/error states, and sensitive data exposure. Classify findings as BLOCKER, HIGH, MEDIUM, LOW, or NOTE.

### Status

Pending independent Claude review. Do not mark TASK-017 complete in `TASKS.md` until BLOCKER/HIGH findings are resolved or explicitly accepted by an authorized human.
