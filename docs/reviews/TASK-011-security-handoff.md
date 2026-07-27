# SECURITY REVIEW REQUEST — TASK-011

## Change summary

- Added the shared product token contract in `packages/ui/src/tokens.ts`.
- Added light/dark semantic CSS variables, an allowlisted violet brand hook, and backwards-compatible aliases in the web stylesheet.
- Replaced application-level raw color values with semantic variables and added contrast/contract tests.
- Documented token usage, accessibility requirements, prohibited combinations, and theming guardrails.

## Trust boundaries and sensitive data affected

- This task changes presentation-layer CSS and shared constants only; it does not add a network boundary, persistence, authentication path, permission, or sensitive-data flow.
- Theme and brand selectors are code-controlled document attributes. No user-provided CSS, style string, font URL, or arbitrary custom property is accepted by this task.
- The TypeScript override helper accepts only the typed token-name union at compile time and returns a frozen object at runtime.

## Threats considered and controls

- CSS injection through theme customization: arbitrary CSS is not exposed; only `data-theme="light|dark"` and the approved `data-brand="blue|violet"` paths are supported.
- Theme-induced accessibility regressions: light/dark text, brand, success, and warning pairings are checked against the WCAG AA contrast floor in automated tests.
- Accidental design drift: application rules consume semantic variables, while raw color literals are kept in the token-definition sections.
- Motion accessibility: the token documentation requires reduced-motion handling for new animated states; the existing loading animation remains a later component-level verification item.

## Security tests/checks added or run

- `tests/design-tokens.test.mjs` checks contrast, frozen overrides, controlled theme selectors, and semantic variable consumption.
- The repository quality gates remain required: formatting, ESLint, workspace-boundary checks, TypeScript build, tests, and high-severity dependency audit.
- No raw HTML, request handling, storage, secrets, AWS credentials, or external permissions were added.

## Checks not run

- Browser visual QA and screenshot regression were not run because this task did not explicitly request browser testing and no hosted browser workflow is configured here.
- Independent Claude review has not yet been performed.

## Requested Claude review

Review the full diff for raw-color leakage outside token definitions, incorrect light/dark contrast, unsafe theme override expansion, CSS injection paths, missing reduced-motion behavior, and accidental changes to the Record → Edit → Share hierarchy. Classify findings as BLOCKER, HIGH, MEDIUM, LOW, or NOTE.

### Status

Pending independent Claude review. Do not mark TASK-011 complete in `TASKS.md` until BLOCKER/HIGH findings are resolved or explicitly accepted by an authorized human.
