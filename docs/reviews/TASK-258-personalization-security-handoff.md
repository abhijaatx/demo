# SECURITY REVIEW REQUEST

Change summary:

- Added a browser-local personalization workbench with allowlisted variable configuration, bounded fallbacks, URL `v_*` parsing, text-safe token preview, personalized link generation, and metadata-only plan download.
- Added editor navigation and regression tests.

Files changed:

- apps/web/components/personalization-workbench.tsx
- apps/web/app/personalize/page.tsx
- apps/web/app/globals.css
- apps/web/components/editor-shell.tsx
- tests/personalization-workbench.test.mjs

Trust boundaries and sensitive data affected:

- Viewer URL parameters, token templates, and fallback values are untrusted browser input.
- Values remain in local state and can appear in the generated local link/plan; no analytics or server persistence is performed.

Authorization model:

- The preview has no protected operation and does not publish or access tenant records.
- Production personalized links must enforce the demo’s server-side allowlist, access policy, expiry, and workspace authorization.

Threats considered:

- Reflected/stored XSS through URL variables or token templates.
- Parameter smuggling with non-allowlisted keys.
- Oversized variable names/values and excessive variable count.
- Leaking personal data through generated URLs or logs.

Security controls implemented:

- `parseDemoPersonalization` enforces the domain allowlist and bounds; URL parsing accepts only allowlisted `v_*` keys.
- `resolveTemplateTokens` renders plain React text; no `dangerouslySetInnerHTML` or HTML sink is used.
- Query/template lengths are capped and link generation uses the domain helper rather than string concatenation.

Security tests added:

- `tests/personalization-workbench.test.mjs` checks allowlist/domain helper usage, bounds, text-safe rendering, unsafe API absence, and the resolved-variable surface.

Checks run and results:

- `npm run format:check` — passed.
- `npm run verify` — passed (format, lint, workspace boundaries, and typecheck).
- `node --test tests` — passed (505 passed, 1 skipped).
- `npm run build` — passed (Next.js production build, including `/personalize`).
- `npm audit --omit=dev --audit-level=high` — passed (0 vulnerabilities).
- `git diff --check` — passed.
- Browser verification completed with a script-tag URL value; it remained visible as text and only allowlisted parameters were placed in the generated link.

Checks not run:

- Claude security review is unavailable in this environment; independent review remains required before release.

Dependencies or infrastructure permissions added:

- None.

Known limitations and residual risks:

- The route generates a local preview link and does not implement production share-link persistence, expiry, access gates, analytics redaction, or tenant checks.
- Personal data in a URL remains visible to browser history and referrers; production sharing should follow the repository’s privacy and link-redaction policy.

Please review the full diff and surrounding code for OWASP Top 10, tenant isolation,
authentication/authorization, input validation, XSS, SSRF, injection, upload safety,
secret exposure, privacy, dependency risk, insecure cloud configuration, and missing
negative tests. Classify findings as BLOCKER, HIGH, MEDIUM, LOW, or NOTE.
