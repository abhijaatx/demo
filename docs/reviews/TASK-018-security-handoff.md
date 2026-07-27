# SECURITY REVIEW REQUEST — TASK-018

## Change summary

- Added a named, accessible, tree-shakeable SVG icon set.
- Added `Image`, `Thumbnail`, `AspectRatio`, `MediaFallback`, and `DeviceFrame` presentation primitives.
- Added responsive media CSS, usage rules, and negative tests for unsafe image sources.

## Files changed

- `packages/ui/src/icons.tsx`
- `packages/ui/src/media.tsx`
- `packages/ui/src/index.ts`
- `apps/web/app/globals.css`
- `tests/iconography-media.test.mjs`
- `docs/iconography-media.md`
- `docs/reviews/TASK-018-security-handoff.md`

## Trust boundaries and sensitive data affected

This task changes presentation and local client rendering only. It adds no API routes, persistence, authorization, uploads, analytics, storage, third-party permissions, or infrastructure permissions. Image `src`, `alt`, labels, fallback React nodes, and media children are caller-provided values; React renders them as structured elements and these primitives do not execute strings or inject raw HTML.

## Authorization model

No new privileged operation is introduced. A component caller may choose an image source, but server-side authorization, asset ownership, tenant scope, content-type validation, CSP, and any proxy/cache policy remain responsibilities of the application boundary. Client-side `remoteOrigins` is not an authorization mechanism.

## Security review request for Claude

Please independently review the implementation in:

- `packages/ui/src/icons.tsx`
- `packages/ui/src/media.tsx`
- `packages/ui/src/index.ts`
- `apps/web/app/globals.css`
- `tests/iconography-media.test.mjs`

Check especially for XSS through SVG or image inputs, unsafe remote-image policy, origin allowlist bypasses, layout/resource exhaustion through dimensions, accessibility regressions, and accidental exposure of untrusted media URLs. Confirm that the public component contract does not imply that client-side origin checks replace server-side authorization, CSP, proxying, or content-type validation.

## Threats considered

- XSS or active-content injection through SVG, `data:`, `blob:`, or arbitrary HTML.
- SSRF or unintended browser requests caused by unrestricted remote image URLs.
- Origin allowlist bypasses through protocol-relative URLs, non-HTTPS URLs, or lookalike origins.
- Layout/resource exhaustion through attacker-controlled dimensions or media content.
- Accessibility regressions caused by decorative or unlabeled icons and screenshot-only device frames.
- Sensitive URL or caller content exposure through error states or generated markup.

## Security controls implemented

- Icons are named exports using fixed inline paths; there is no raw SVG/HTML injection API.
- Decorative icons are hidden from assistive technology, while labeled icons expose an accessible name.
- Image sources are same-origin path-only by default.
- Remote images require explicit HTTPS and exact origin allowlisting.
- `data:`, `blob:`, protocol-relative, and non-HTTPS sources are rejected.
- Width and height are required and clamped before rendering.
- Image errors use a neutral fallback and never render caller-provided HTML.
- Tests assert the source policy, dimensions, semantics, and absence of raw HTML injection APIs.

## Security tests added

- `tests/iconography-media.test.mjs` checks icon accessibility, same-origin defaults, exact HTTPS origin opt-in, rejection of unsafe schemes, fallback behavior, explicit dimensions, and responsive presentation hooks.

## Checks run and results

- `npm run build` — passed.
- `node --test tests/iconography-media.test.mjs` — 4 passed.
- `npm test` — 56 total; 55 passed and 1 expected integration test skipped because local dependency environment variables were absent.
- `npm run verify` — passed: formatting, ESLint, workspace boundaries, and TypeScript checks.
- `npm audit --audit-level=high` — passed; 0 vulnerabilities reported.
- No dependencies, IAM actions, or infrastructure permissions were added.

## Checks not run

- Browser-based visual regression, screen-reader testing, and responsive interaction testing were not run because no browser workflow was requested. Run the TASK-019 visual and accessibility workbench before release.
- Live remote-image fetching, proxy/content-type validation, CSP validation, and production asset authorization were not run because this task intentionally does not enable external fetching by default. Validate those controls at the application/asset boundary before enabling remote media.
- Independent Claude review has not yet been performed.

## Known limitations and residual risks

- Same-origin image paths can still reference application-hosted content that must be authorized and served safely by the asset pipeline.
- The component-level exact-origin allowlist is defense in depth; it does not replace server-side authorization or a controlled media proxy.
- Visual screenshot fidelity and browser-specific image behavior require the component workbench and visual regression coverage planned in TASK-019.

## Requested Claude review

Please review the full diff and surrounding code for OWASP Top 10, XSS, SSRF, unsafe SVG/image handling, origin allowlist bypasses, resource exhaustion, accessibility regressions, secret/privacy exposure, dependency risk, and missing negative tests. Classify findings as BLOCKER, HIGH, MEDIUM, LOW, or NOTE. Independently inspect the implementation rather than relying only on this summary.

### Status

Pending independent Claude review. Do not mark TASK-018 complete in `TASKS.md` until BLOCKER/HIGH findings are resolved or explicitly accepted by an authorized human.
