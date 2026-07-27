# SECURITY REVIEW REQUEST — TASK-007

## Change summary

- Added the Next.js/React web application baseline under `apps/web`.
- Added a simple creator workspace shell with navigation, the Record → Edit → Share workflow, recent demos, and responsive states.
- Added loading, error, and not-found routes so first load and route failures remain usable.
- Added a client API health card with checking, online, offline, no-network, and retry states.
- Added OpenAPI-driven TypeScript client types generated from the API contract.
- Added a local same-origin Next.js rewrite and a public-only `NEXT_PUBLIC_API_BASE_URL` runtime setting.
- Added a production build and a web trust-boundary regression test.

## Files changed

- `apps/web/package.json`
- `apps/web/tsconfig.json`
- `apps/web/next.config.mjs`
- `apps/web/app/layout.tsx`
- `apps/web/app/page.tsx`
- `apps/web/app/loading.tsx`
- `apps/web/app/error.tsx`
- `apps/web/app/not-found.tsx`
- `apps/web/app/globals.css`
- `apps/web/components/api-status-card.tsx`
- `apps/web/src/lib/api-client.ts`
- `apps/web/src/generated/api.ts`
- `scripts/generate-api-contract.mjs`
- `.env.example`, `docs/configuration.md`, `package.json`, `package-lock.json`
- `tests/web.test.mjs`

## Trust boundaries and sensitive data affected

- Browser code reads only `NEXT_PUBLIC_API_BASE_URL`, which is explicitly public and defaults to a same-origin local proxy.
- Server-only values such as database URLs, Redis URLs, AWS credentials, and application secrets are not imported by the web app and are not referenced by its client API module.
- API responses are treated as untrusted network data and pass a small runtime health-shape guard before the UI renders the service name.
- The baseline does not render captured HTML, user-provided markup, or arbitrary URLs; it contains no `dangerouslySetInnerHTML` usage.
- The local rewrite targets `127.0.0.1:3001` only for development. Production deployments must set the public API origin through deployment configuration or use an equivalent platform proxy.

## Authorization model

- No authenticated creator, viewer, workspace, or tenant resource was added in this task.
- The current screen is static product scaffolding plus a public operational health check.
- Future data-bearing routes must establish identity, workspace scope, authorization, and safe redirect/link handling before they are connected to this UI.

## Threats considered

- Accidental client-bundle inclusion of server secrets through environment variables or imports.
- Rendering untrusted API data as HTML or executable content.
- API failure, malformed responses, offline mode, and retry loops creating unusable states.
- Browser requests crossing an unintended origin or leaking credentials through URL configuration.
- Hydration mismatch from time-dependent or browser-only rendering.
- Error surfaces exposing stack traces, internal paths, or sensitive implementation details.
- Responsive layout and focus behavior making navigation inaccessible at small widths.

## Security controls implemented

- Only the `NEXT_PUBLIC_API_BASE_URL` environment variable is read by the browser API client.
- The API client uses `Accept: application/json`, `cache: no-store`, an abort signal, and a runtime response guard.
- API errors are reduced to a generic client error with status and request ID; response bodies are not copied into the UI.
- Loading, error, not-found, offline, and no-network states have explicit accessible copy and retry behavior.
- The UI uses React text rendering and ordinary links/buttons; no raw HTML injection path is present.
- The Next config has an explicit local Turbopack root and a development-only API rewrite.
- A regression test checks the public environment boundary, absence of raw HTML injection, and presence of the core workflow.
- `postcss` is pinned to a patched version compatible with the installed Next dependency tree.

## Security tests/checks added or run

- `npm run build` passed, including API contract generation, OpenAPI type generation, and the optimized Next.js production build.
- `npm audit --audit-level=high` passed with zero vulnerabilities after the patched PostCSS dependency was pinned.
- `tests/web.test.mjs` verifies the browser trust boundary and no-raw-HTML invariant.
- `npm run verify` passed: formatting, ESLint, workspace boundaries, and TypeScript checks.
- `npm test` passed with 18 executed tests and one intentionally skipped integration test in the default environment.
- `npm run test:integration` passed against the local PostgreSQL service with explicit local connection variables.
- Browser visual QA was not run because it was not part of the requested task; the build and static checks cover this baseline's automated gate.

## Checks not run

- Secret scanning, SAST beyond ESLint, dependency license review, SBOM generation, and IaC scanning remain deferred to TASK-010.
- No authenticated browser flow, tenant isolation test, CSP integration test, or production reverse-proxy test exists yet.
- No live AWS deployment or browser test against the deployed origin was run.

## Dependencies or infrastructure permissions added

- `next@16.2.10`, `react@19.2.7`, and `react-dom@19.2.7`.
- React type packages and `openapi-typescript@7.13.0`.
- No cloud resources, IAM permissions, credentials, or external API calls were added.

## Known limitations and residual risks

- The screen is presentation scaffolding; it does not yet protect or load creator data.
- The API proxy/rewrite is local-development configuration. Production routing, CORS, CSP deployment headers, and authentication are later responsibilities.
- `NEXT_PUBLIC_*` values are intentionally public and must never contain secrets.
- The generated API types are contract artifacts and do not replace runtime validation of untrusted responses.
- A future recorder or embed renderer must add URL allowlists, iframe/content isolation, CSP, sanitization, and abuse controls before rendering user-controlled content.

## Requested Claude review

Review the full diff and surrounding configuration for accidental secret inclusion in client bundles, unsafe environment-variable handling, API-origin/CORS/proxy mistakes, hydration and error-boundary leaks, unsafe URL or HTML rendering, network retry/resource exhaustion behavior, accessibility regressions, dependency risk, generated-client drift, and production-vs-local configuration confusion. Classify findings as BLOCKER, HIGH, MEDIUM, LOW, or NOTE.

### Status

Pending independent Claude review. Do not mark TASK-007 complete in `TASKS.md` until BLOCKER/HIGH findings are resolved or explicitly accepted by an authorized human.
