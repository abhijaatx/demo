# SECURITY REVIEW REQUEST — TASK-012

## Change summary

- Added typed React primitives for Button, IconButton, Link, Input, Textarea, Select, Checkbox, Radio, Switch, Tooltip, Badge, Avatar, Separator, and Spinner.
- Kept controls native where possible so browser keyboard behavior, form semantics, and assistive-technology mappings remain available by default.
- Added semantic token-driven primitive styles, focus-visible states, disabled/loading/invalid states, tooltip visibility, and reduced-motion compatibility.
- Added server-rendered accessibility contract tests for names, descriptions, error association, roles, states, and external-link protections.

## Trust boundaries and sensitive data affected

- This task adds presentation components only. It does not add API routes, persistence, authentication, authorization, storage, uploads, analytics, or external permissions.
- Component props can contain application-provided text, labels, hrefs, image URLs, and tooltip content. React escapes text and attribute output; primitives do not render raw HTML or evaluate code.
- `Link external` adds `noopener noreferrer` and opens a new tab by default. Callers remain responsible for validating untrusted destinations at the relevant application boundary.
- `Avatar src` is rendered as an image URL and is not a server-side fetch. Callers must use the repository’s approved image-source policy for remote assets.

## Threats considered and controls

- XSS through labels, badges, errors, tooltip content, or avatar names: content is passed as React children/attributes; no `dangerouslySetInnerHTML`, `innerHTML`, `eval`, or dynamic code execution is introduced.
- Reverse-tabnabbing through external links: external links receive `rel="noopener noreferrer"`.
- Accessible-state ambiguity: loading maps to native `disabled` plus `aria-busy`; invalid fields expose `aria-invalid`, descriptions, and `role="alert"` errors; IconButton requires a typed accessible name.
- Keyboard and screen-reader regressions: Button, Link, form fields, and choice controls use native elements; Tooltip associates its message with the trigger through `aria-describedby`.
- Motion accessibility: spinner and tooltip transitions are covered by the existing global reduced-motion rule.
- CSS injection through class names or style props: primitives emit fixed class names and do not accept arbitrary style strings.

## Security tests/checks added or run

- `tests/ui-primitives.test.mjs` renders every primitive family and checks native elements, labels, error association, roles, states, tooltip relationships, and external-link rel attributes.
- `npm run build` passed, including the shared UI package and Next.js production build.
- The required repository gates remain applicable: formatting, ESLint, workspace boundaries, TypeScript checks, full tests, and high-severity dependency audit.

## Checks not run

- Browser keyboard, screen-reader, and visual regression testing were not run because no browser test workflow was requested for this task; the test suite verifies the rendered accessibility contract instead.
- Independent Claude review has not yet been performed.

## Requested Claude review

Review the full diff for unsafe prop forwarding, XSS through text/attribute values, reverse-tabnabbing, untrusted image handling, missing accessible names, incorrect disabled/loading semantics, tooltip disclosure behavior, CSS injection paths, and regressions to the simple creator UI. Classify findings as BLOCKER, HIGH, MEDIUM, LOW, or NOTE.

### Status

Pending independent Claude review. Do not mark TASK-012 complete in `TASKS.md` until BLOCKER/HIGH findings are resolved or explicitly accepted by an authorized human.
