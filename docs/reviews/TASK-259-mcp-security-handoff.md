SECURITY REVIEW REQUEST

Change summary:

- Added a browser-local MCP Server workflow for selecting an AI provider, reviewing least-privilege OAuth scopes, copying non-secret setup instructions, inspecting tool catalogs, and planning a prompt behind an approval boundary.

Files changed:

- apps/web/components/mcp-workbench.tsx
- apps/web/app/mcp-server/page.tsx
- apps/web/app/globals.css
- apps/web/components/editor-shell.tsx
- tests/mcp-workbench.test.mjs

Trust boundaries and sensitive data affected:

- Provider connection and requested OAuth scopes are represented in browser UI only.
- Prompt text is bounded and remains in React state; no demo data, access token, or provider credential is stored or transmitted.

Authorization model:

- The preview requires read scope before showing a connected state and labels write access as approval-gated.
- No remote authorization is performed. A production MCP adapter must enforce identity, workspace scope, provider OAuth issuer/audience, and per-tool permissions server-side.

Threats considered:

- Secret/token exposure, over-broad scopes, prompt injection, accidental remote writes, and misleading connection state.

Security controls implemented:

- Explicit provider and scope allowlists.
- Prompt limit of 600 characters.
- No fetch, dynamic code execution, HTML injection, or external MCP calls.
- Copy action contains only provider, scope, and setup metadata; no token.
- Mutations are described as requiring explicit approval.

Security tests added:

- tests/mcp-workbench.test.mjs checks provider/scopes/tool catalog, bounded prompt, approval language, no unsafe sinks, and editor entry link.

Checks run and results:

- npm run verify — passed.
- node --test tests — 508 passed, 1 skipped.
- npm run build — passed; /mcp-server generated.
- npm audit --omit=dev --audit-level=high — 0 vulnerabilities.
- git diff --check — passed.
- Browser verification — connected Claude preview, switched Analytics tools, planned prompt, and confirmed no-token disclaimer.

Checks not run:

- No real provider OAuth or MCP server was contacted; this is intentionally a local preview and the in-app browser cannot grant provider credentials.

Dependencies or infrastructure permissions added:

- None.

Known limitations and residual risks:

- A production MCP endpoint still needs server-side OAuth validation, tenant-scoped tool authorization, rate limiting, audit logs, replay protection, and confirmation for publishing/bulk edits. The local screen must not be treated as proof of those controls.

Please review the full diff and surrounding code for OWASP Top 10, tenant isolation,
authentication/authorization, input validation, XSS, SSRF, injection, upload safety,
secret exposure, privacy, dependency risk, insecure cloud configuration, and missing
negative tests. Classify findings as BLOCKER, HIGH, MEDIUM, LOW, or NOTE.

Claude review status: unavailable in this environment; human/Claude review remains required before production use.
