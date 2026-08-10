# Supademo browser audit — 2026-08-04

This folder is the current browser audit of the public Supademo route inventory. The audit used the in-app Browser and covers all 91 routes in `actions/route-crawl.json`.

## Contents

- `reference/` — one complete full-page JPEG per route, named with the route index and slug.
- `actions/route-crawl.json` — URL, title, measured document height, headings, button inventory, and screenshot path for every route.
- `actions/button-actions-reference.json` — the complete one-by-one button outcome record (clicked, skipped with a reason, not found after reload, or error).
- `actions/button-inventory-current.json` — the current route/button inventory collected alongside today’s screenshots (with a bounded label sample for very dense pages).
- `actions/button-actions-report.md` — compact totals and the safe-action policy used for the button exercise.

## Coverage

- 91/91 route screenshots present.
- Screenshots are full-page JPEG captures from the browser’s default desktop viewport.
- The current inventory records rendered button counts and a bounded label sample after navigation; the complete one-by-one label/outcome record is `button-actions-reference.json`.
- The action record contains 1,129 controls: 565 clicked, 431 intentionally skipped, 84 not found after reload, 31 not found after the action pass, and 18 recorded errors.

Controls were intentionally skipped when they were sitewide navigation duplicates, disabled, authentication/download flows, or could mutate external state. Those outcomes remain recorded rather than being silently omitted. Authentication-gated pages under `app.supademo.com` are represented by the public login and signup routes; private post-login routes require a real account/session and were not bypassed.

## Reading the audit

Start with `actions/route-crawl.json` to map any route to its PNG. Use `actions/button-actions-reference.json` for the observed result of each discovered button. The route measurements are observations of the live site and can vary slightly when live content, fonts, or rotating copy changes.
