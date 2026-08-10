# SECURITY REVIEW REQUEST

## Change summary

- Rebuilt the public `/use-cases` marketing page to match the Supademo reference layout and interactions.
- Added bounded team tabs, a bounded feature carousel, a trust-section Featured toggle, responsive layout rules, reduced-motion handling, and image-backed reference artwork.
- Kept all page actions as ordinary same-origin links; external artwork is rendered as non-executable images with error fallbacks.

## Files changed

- `apps/web/components/marketing-use-cases.tsx`
- `apps/web/app/globals.css`
- `tests/use-cases.test.mjs`
- `browser-qa/local-fidelity-2026-08-02/local-use-cases-final-v2-top.jpg`
- `browser-qa/local-fidelity-2026-08-02/local-use-cases-final-v2-featured.jpg`
- `browser-qa/local-fidelity-2026-08-02/local-use-cases-final-v2-updates.jpg`
- `browser-qa/local-fidelity-2026-08-02/local-use-cases-final-v2-features.jpg`
- `browser-qa/local-fidelity-2026-08-02/local-use-cases-final-v2-trust.jpg`
- `browser-qa/local-fidelity-2026-08-02/local-use-cases-final-v2-footer.jpg`

## Trust boundaries and sensitive data affected

- This is a public, unauthenticated marketing route. It does not read or mutate tenant data, accept uploads, or call protected APIs.
- The browser requests static image assets hosted by `supademo.com`; those requests are not proxied through the application server.
- User-visible route links remain same-origin application navigation. No credentials, tokens, or personal data are introduced.

## Authorization model

- No new privileged operation is exposed. `/use-cases` and its linked public marketing routes are intentionally anonymous.
- Existing server-side authorization remains responsible for any protected destination reached after navigation.

## Threats considered

- XSS and unsafe DOM injection from marketing content.
- Malicious or unavailable remote image responses.
- Open redirects through CTA hrefs.
- Accidental exposure of authenticated or tenant-specific data.
- Unbounded client-side state changes through tab and carousel controls.

## Security controls implemented

- React JSX renders text and attributes without `dangerouslySetInnerHTML`, `innerHTML`, `eval`, or dynamic code execution.
- Team tabs and carousel indices are selected from fixed arrays and bounded with `Math.min`/`Math.max`.
- Remote images use explicit `https://supademo.com` URLs, `referrerPolicy="no-referrer"`, empty decorative alt text where appropriate, lazy loading, and `onError` fallbacks.
- CTA links are fixed same-origin paths; no user-controlled redirect parameter is accepted.
- CSS includes a `prefers-reduced-motion: reduce` path for animated transitions.

## Security tests added

- `tests/use-cases.test.mjs` asserts the route wiring, fixed tab semantics, bounded carousel controls, trust toggle state, accessible labels, reduced-motion styles, and absence of unsafe DOM APIs.
- Browser validation exercised all seven team tabs, Next/Previous carousel transitions, the Featured trust toggle, and the page's public CTA/link inventory.

## Checks run and results

- `node --test tests/use-cases.test.mjs tests/marketing-reference.test.mjs tests/pricing.test.mjs` — pending final run for this handoff.
- `npm run lint` — pending final run for this handoff.
- `npm run typecheck` — pending final run for this handoff.
- `npm run check:boundaries` — pending final run for this handoff.
- `git diff --check` — pending final run for this handoff.
- `npm audit --omit=dev --audit-level=high` — previously passed with zero high findings; rerun with the final checks.

## Checks not run

- Claude's independent review and repository-configured secret/SAST/container/IaC scanners are not available in this environment. A reviewer should run the repository's configured security pipeline before release.

## Dependencies or infrastructure permissions added

- None.

## Known limitations and residual risks

- Visual parity relies on public third-party-hosted Supademo image assets; availability or content changes can alter the page.
- The local logo-wall fallback hides a failed image rather than substituting a local asset, so a remote asset outage reduces visual fidelity but does not execute content.
- This change does not add authentication or tenant-data behavior; protected destinations must be reviewed independently.

Please review the full diff and surrounding code for OWASP Top 10, tenant isolation,
authentication/authorization, input validation, XSS, SSRF, injection, upload safety,
secret exposure, privacy, dependency risk, insecure cloud configuration, and missing
negative tests. Classify findings as BLOCKER, HIGH, MEDIUM, LOW, or NOTE.
