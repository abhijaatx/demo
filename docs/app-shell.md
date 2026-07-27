# Authenticated app shell

TASK-015 composes the existing dashboard into a client-side authenticated-shell placeholder. It does not implement identity or workspace authorization; those remain server-side tasks scheduled later.

## Shell regions

- Global navigation: Home, Demos, Hubs, Analytics, Leads, and Settings retain the existing information architecture.
- Workspace context: the current Acme workspace and plan usage are visible as placeholders; switching and persistence belong to later workspace tasks.
- Account menu: the current user has an accessible Dropdown shell with account settings and sign-out placeholders.
- Header: save state, Help, a command-palette trigger, and a mobile navigation toggle are available without adding a new top-level navigation item.
- Command palette: `⌘K`/`Ctrl+K` opens a labeled modal with a search field and a small allowlisted command list. Search filtering and command execution are intentionally deferred.
- Route boundaries: the root loading, error, and not-found boundaries remain in place with safe recovery actions.

## Deep links and mobile

Navigation uses same-origin paths such as `/?section=demos` so a refresh remains on a valid application route while real route data and authorization are added later. On narrow screens, the sidebar is closed by default and opened with an explicit button; selecting a navigation link closes it. The shell CSS keeps navigation local and does not add page-wide horizontal scrolling.

The shell keeps the primary Create demo action in the page content. The header command trigger is a secondary utility and does not compete with that primary action.
