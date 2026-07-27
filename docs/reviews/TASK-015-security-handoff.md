# SECURITY REVIEW REQUEST — TASK-015

## Change summary

- Added the client-side authenticated app-shell composition in `apps/web/components/app-shell.tsx`.
- Integrated the existing Home page content into the shell without changing the Record → Edit → Share journey or adding top-level navigation.
- Added responsive sidebar open/close behavior, workspace context placeholder, account-menu shell, command-palette modal shell, and same-origin deep-link placeholders.
- Reused the shared UI package and retained route-level loading, error, and not-found boundaries.
- Added shell rendering and route-boundary tests.

## Trust boundaries and sensitive data affected

- This task adds presentation and client navigation only. It does not implement authentication, session handling, workspace switching, account mutation, sign-out, authorization, or server-side route protection.
- Workspace, plan, and account values are static placeholders; no tenant data or credentials are loaded into the browser by this task.
- Command destinations and navigation paths are code-controlled constants. No user-provided redirect or command URL is accepted.
- The account menu actions are placeholders and do not perform account changes or logout.

## Threats considered and controls

- Open redirects: navigation and command links use an allowlisted set of same-origin paths/fragments; future user-configurable destinations require boundary validation.
- Client-only authorization assumptions: the shell does not treat visible/hidden navigation as permission enforcement; future routes must authorize on the server.
- Shortcut/event leakage: the command shortcut only toggles local UI state; it does not log keys, send content, or invoke privileged actions.
- XSS and unsafe rendering: shell labels and commands are static React content; no `dangerouslySetInnerHTML`, `innerHTML`, `eval`, or dynamic CSS strings are introduced.
- Mobile navigation state: closing the menu is a local presentation change and does not mutate workspace data or cache tenant records.
- Error handling: existing route error reporting remains in place and does not render secret or internal error details.

## Security tests/checks added or run

- `tests/app-shell.test.mjs` checks shell landmarks, required navigation labels, accessible mobile/account controls, command-palette closed state, same-origin deep-link placeholders, route-boundary presence, and unsafe-rendering exclusions.
- `npm test` passed with the full suite.
- `npm run verify` passed formatting, ESLint, boundaries, and TypeScript checks.
- `npm audit --audit-level=high` passed with zero vulnerabilities.

## Checks not run

- Browser keyboard navigation, mobile visual regression, deep-link refresh in a real browser, and screen-reader testing were not run because no browser test workflow was requested for this task.
- Independent Claude review has not yet been performed.

## Requested Claude review

Review the full diff for client-side authorization assumptions, open redirects, unsafe prop forwarding, account-menu action confusion, keyboard focus loss, mobile navigation escape, command-palette shortcut handling, route-boundary information disclosure, and regressions to the simple creator UI. Classify findings as BLOCKER, HIGH, MEDIUM, LOW, or NOTE.

### Status

Pending independent Claude review. Do not mark TASK-015 complete in `TASKS.md` until BLOCKER/HIGH findings are resolved or explicitly accepted by an authorized human.
