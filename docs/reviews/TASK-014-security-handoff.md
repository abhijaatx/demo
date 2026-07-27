# SECURITY REVIEW REQUEST — TASK-014

## Change summary

- Added responsive `Stack`, `Grid`, `Container`, `SplitPane`, `Sidebar`, and `Header` primitives.
- Added semantic `Breadcrumb`, `Tabs`, and `Pagination` navigation primitives with landmarks, current state, disabled state, roving focus, arrow/Home/End navigation, and bounded page windows.
- Added token-driven responsive CSS with narrow-layout containment and local overflow for breadcrumb/tab rails.
- Added server-rendered component contract tests and responsive CSS/source checks.

## Trust boundaries and sensitive data affected

- This task changes presentation and client-side navigation controls only. It adds no API routes, persistence, authentication, authorization, upload, analytics, storage, or external permissions.
- Labels, panel content, breadcrumb labels, and hrefs are caller-provided React props. React escapes text and attributes; the primitives do not render raw HTML or execute code.
- Breadcrumb links are navigation hints, not authorization. Callers must validate untrusted destinations and enforce access on the server.
- Pagination values are display/navigation state only. The corresponding API must validate page bounds, tenant scope, and permissions independently.

## Threats considered and controls

- XSS through labels or panels: no `dangerouslySetInnerHTML`, `innerHTML`, `eval`, or string-to-code conversion is introduced.
- Keyboard traps or inaccessible navigation: tabs use native buttons, roving `tabIndex`, `aria-selected`, `aria-controls`, `aria-labelledby`, disabled semantics, and Arrow/Home/End handling.
- Hidden-content confusion: inactive tab panels use `hidden`; current breadcrumbs use `aria-current="page"`; pagination exposes only the current page as `aria-current`.
- Layout denial of service through large values: spacing/columns are allowlisted unions, pagination renders a bounded window, and skeleton-like unbounded rendering is not introduced.
- Responsive overflow: shrink boundaries use `min-width: 0`, page containers are width-bounded, and only breadcrumb/tab rails use local horizontal scrolling.

## Security tests/checks added or run

- `tests/layout-navigation.test.mjs` checks landmarks, tab roles/states, pagination state, keyboard-navigation source coverage, and narrow-layout CSS controls.
- Full repository build, tests, formatting, ESLint, workspace boundaries, TypeScript checks, and high-severity dependency audit remain required.

## Checks not run

- Browser visual regression, real keyboard interaction, and screen-reader testing were not run because no browser test workflow was requested for this task. The handoff identifies these as required follow-up validation before the design-system release.
- Independent Claude review has not yet been performed.

## Requested Claude review

Review the full diff for unsafe prop forwarding, unvalidated navigation destinations, incorrect tab keyboard behavior, focus loss, hidden-panel announcement problems, pagination bypass assumptions, responsive horizontal overflow, and accidental changes to primary navigation or the Record → Edit → Share model. Classify findings as BLOCKER, HIGH, MEDIUM, LOW, or NOTE.

### Status

Pending independent Claude review. Do not mark TASK-014 complete in `TASKS.md` until BLOCKER/HIGH findings are resolved or explicitly accepted by an authorized human.
