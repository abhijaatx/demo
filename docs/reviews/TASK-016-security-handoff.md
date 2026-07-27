# SECURITY REVIEW REQUEST — TASK-016

## Change summary

- Added typed form state and submit architecture in `packages/ui/src/forms.tsx`.
- Added typed field bindings for text-like controls and checkboxes, stable field IDs, client validation mapping, server field-error mapping, reset/mark-saved behavior, and submitting/dirty state.
- Added bounded normalization for server errors, accessible error summaries with field links, reusable field description/error components, and a browser unload guard for unsaved changes.
- Added tests and documentation for value preservation, safe error handling, accessibility relationships, and security exclusions.

## Trust boundaries and sensitive data affected

- Form values are untrusted browser state and are passed to the caller’s submit function. This task does not send values to a server, persist them, authorize them, or log them.
- Server error payloads are untrusted input. Only the allowlisted `fieldErrors` and `formError` keys are read; messages are type-checked, control characters removed, trimmed, length-capped, and count-capped.
- Unknown thrown errors are replaced with a generic form-level message. Internal exception text is not rendered.
- Field names are sanitized before use in generated DOM IDs and error-summary fragment links.

## Threats considered and controls

- Sensitive-value exposure: no form values, error payloads, or submit exceptions are logged; the architecture contains no logging calls.
- Stored/reflected XSS through validation messages: React renders messages as text/attributes; raw HTML APIs and dynamic code execution are absent.
- Error-detail disclosure: only explicit `fieldErrors`/`formError` fields are accepted, with bounded safe messages; arbitrary payloads and `Error` objects are ignored.
- Data loss on validation failure: values are not reset when validation or submit mapping fails; reset occurs only when the caller requests it.
- Focus bypass: invalid submissions focus the first generated field ID and summaries link to the corresponding control.
- Unsaved-change loss: `beforeunload` protection is attached while dirty and removed after save/reset/unmount. In-app router blockers remain a later integration responsibility.
- Authorization/CSRF: not implemented here; the future submit function/API boundary must enforce authentication, tenant scope, CSRF protection, rate limits, and server-side validation.

## Security tests/checks added or run

- `tests/forms.test.mjs` checks bounded server-error normalization, generic handling of thrown errors, accessible summary links, stable field bindings, beforeunload/focus controls, and unsafe-rendering/logging exclusions.
- Full repository build, tests, formatting, ESLint, workspace boundaries, TypeScript checks, and high-severity dependency audit remain required.

## Checks not run

- Browser refresh/unload prompts, real form submission, keyboard focus movement in a browser, screen-reader behavior, and server/API integration were not run because no browser/API form workflow exists yet.
- Independent Claude review has not yet been performed.

## Requested Claude review

Review the full diff for sensitive-value leakage, unsafe server-error rendering, field-name/DOM-ID injection, validation bypass assumptions, data loss during retries/reset, beforeunload behavior, missing CSRF/authorization boundaries, and incorrect accessible error focus. Classify findings as BLOCKER, HIGH, MEDIUM, LOW, or NOTE.

### Status

Pending independent Claude review. Do not mark TASK-016 complete in `TASKS.md` until BLOCKER/HIGH findings are resolved or explicitly accepted by an authorized human.
