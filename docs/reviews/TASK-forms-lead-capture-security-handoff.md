# SECURITY REVIEW REQUEST

Change summary:

- Added native Forms & Lead Capture domain policy controls to the canonical form model and enforcement path. `DemoFormSchema` gains bounded, normalized `allowedEmailDomains` (allowlist) and `blockedEmailDomains` (blocklist) arrays; `normalizeEmailDomainList` rejects anything that is not a plain, fully-qualified DNS hostname. `validateFormSubmission` now rejects blocked domains, enforces the allowlist when present, and otherwise preserves the existing business-email restriction (unless `allowNonBusinessEmails`). The chapter form editor exposes accessible comma-separated inputs for both lists, and the fields flow through chapter parsing, editor updates, publication, and viewer rendering. No endpoints, permissions, dependencies, or CRM/network calls were added.

Files changed:

- packages/domain/src/form-schemas.ts (DemoFormSchemaOptions/DemoFormSchema fields, normalizeEmailDomainList, create/parse wiring)
- packages/domain/src/form-submission.ts (email domain policy in validateFormSubmission)
- packages/domain/src/index.ts (export normalizeEmailDomainList)
- apps/web/components/editor/chapter-editor.tsx (allowed/blocked domain inputs in FormChapterSettings)
- tests/form-schemas.test.mjs, tests/form-submission.test.mjs, tests/chapter-editor.test.mjs (regression/contract tests)
- docs/reviews/TASK-forms-lead-capture-security-handoff.md (this file)

Trust boundaries and sensitive data affected:

- Untrusted serialized demo documents (local drafts, published manifests, share links) can now carry two new form arrays. Malicious tokens (schemes, paths, @, wildcards, whitespace/control characters, IPv4 literals, single-label internal names) are dropped at the parse boundary, so they never reach submission policy or rendering.
- Viewer-submitted email addresses are compared against the normalized lists; the lists themselves are stored in the form schema and rendered nowhere except the editor inputs (as text values, not HTML).

Authorization model:

- No new operations, endpoints, or permissions. Forms remain scoped to their demo document; submission validation runs inside the existing local viewer flow (`validateFormSubmission` + `recordFormSubmission`), which is unchanged apart from the added email checks. Editor mutations flow through the existing readOnly-gated handlers.

Evidence limitation (documented honestly):

- Behavior follows the official docs page https://docs.supademo.com/customize/chapters/forms-and-lead-capture (native forms/lead capture with email controls) plus the existing local form implementation. The live app is login-gated, so no live end-to-end capture was possible; implementation follows the documented and local behavior rather than a live capture.

Threats considered:

- XSS/HTML injection via domain tokens rendered in the editor.
- URL/SSRF-style injection (javascript:, https://, paths, credentials) smuggled into email lists.
- Case/spacing/encoding tricks bypassing allowlist/blocklist (deterministic lowercase exact matching).
- Precedence ambiguity between allowlist and blocklist, and between the new policy and the legacy business-email restriction.
- Oversized lists/labels causing unbounded storage or denial of service.
- Blocklist/allowlist fields silently ignored on legacy documents (backwards compatibility).
- Email values flowing into policy checks before syntactic validation.
- Non-email fields being affected by email-domain policy.

Security controls implemented:

- `normalizeEmailDomainList` accepts a comma-separated string or array, lowercases/trims/deduplicates each token, and keeps only tokens matching a strict DNS-hostname regex (lowercase alphanumerics and hyphens per label, at least one dot, label length ≤ 63, total ≤ 253), rejecting IPv4 literals (all-numeric labels), `localhost`/`local`, schemes, paths, @, wildcards, whitespace/control characters, and empty/oversized tokens. Tokens are validated at full trimmed length and oversized original tokens (>253 chars) are dropped outright, never truncated into accepted hostnames. The caller-supplied `maximum` parameter is capped at the canonical count (25) with malformed/negative/NaN/Infinity values handled safely, so callers cannot bypass the count bound. Absent values normalize to `[]` (backwards compatible).
- `validateFormSubmission` runs the existing email regex first, then applies: (1) blocked-domain rejection ("This email domain is not accepted."), (2) if the allowlist is non-empty, rejection outside it ("Use an email address from an approved domain."), (3) otherwise the legacy business-email restriction unless `allowNonBusinessEmails`. Matching is deterministic, case-insensitive, exact (subdomain logic intentionally not inferred). Non-email fields are untouched.
- The editor inputs are plain text inputs with `maxLength` 2,000, accessible labels (`<label>`/`<span>`, `aria-describedby` help), `autoComplete="off"`/`spellCheck={false}`, committed through `normalizeEmailDomainList` on every change (so malformed entries never reach the stored schema), normalized-on-blur, and fully `disabled={readOnly}`. No `dangerouslySetInnerHTML`, `innerHTML`, or `eval`.
- Persistence: `parseDemoChapter` → `parseDemoFormSchema` (document boundary), `handleUpdateChapter` → `parseDemoFormSchema` (editor boundary), and `publishDemoDocument` → `parseDemoFormSchema` (publication boundary) all normalize the lists; no raw token ever bypasses normalization into a stored/published form.

Security tests added:

- Parser: lowercasing/trimming/dedup; rejection of `javascript:`/`https://`/paths/@/wildcard/whitespace/IP/literal/`localhost`/trailing-dot/double-dot/leading-hyphen tokens; count cap (25), label-length and total-length caps; backwards compatibility when absent (tests/form-schemas.test.mjs).
- Submission: blocked-domain rejection with safe message (case-insensitive); allowlist enforcement superseding the business rule; blocked-over-allowlist precedence; non-email fields unaffected; invalid email format fails before domain policy; existing business-email behavior preserved when no lists (tests/form-submission.test.mjs).
- Editor contract: allowed/blocked domain inputs with accessible labels and `aria-describedby`, `maxLength` bound, `disabled={readOnly}`, `normalizeEmailDomainList` wired, no unsafe sinks (tests/chapter-editor.test.mjs).

Checks run and results:

- Focused: node --test tests/form-schemas.test.mjs tests/form-submission.test.mjs tests/chapter-editor.test.mjs tests/form-editor.test.mjs tests/forms.test.mjs tests/chapter-model.test.mjs tests/demo-viewer-form.test.mjs tests/demo-document.test.mjs tests/publication-pipeline.test.mjs — 47 passed, 0 failed, 0 skipped.
- npm test (production build + full suite) — build passed; 581 tests, 580 passed, 1 skipped, 0 failed.
- npm run format:check — passed.
- npm run lint — passed.
- npm run check:boundaries — passed.
- npm run typecheck — passed (tsc --build + next typegen + tsc --noEmit for @supademo/web).
- npm audit --omit=dev --audit-level=high — 0 vulnerabilities.
- Browser verification in the local app (Chrome): the ChapterEditor form controls were reached; the allowed-domains input was sanitized (entering `acme.com` plus an unsafe `javascript:` token was reduced to safe domains); a blocked `evil.com` email was rejected in the viewer; and an allowlisted `person@acme.com` submission reached the success status.

Checks not run:

- Live Supademo app behavior could not be captured (login-gated); see the evidence limitation above.

Dependencies or infrastructure permissions added:

- None. No new packages, services, IAM actions, or cloud configuration.

Known limitations and residual risks:

- Domain matching is exact on the lowercase host portion of the address; a blocked `gmail.com` does not block `mail.gmail.com`, and `user@Gmail.com.evil.com` would be evaluated on `gmail.com.evil.com`. This is the documented deterministic exact-match rule; subdomain/punycode normalization is intentionally out of scope.
- Exotic, nonstandard IP notations (e.g., hex forms like `0x7f.1`) are not rejected by the all-numeric IPv4 check; they are syntactically valid hostnames that would never resolve to a mail server, so the practical risk is negligible. Strict IP-literal rejection of every nonstandard notation is intentionally out of scope.
- The allowlist overrides the legacy business-email restriction whenever it is non-empty (documented precedence). An author who enables both an allowlist and `allowNonBusinessEmails` still gets allowlist enforcement, which is the stricter, intended behavior.
- Local submissions are stored in `localStorage` under `supademo_form_submissions_${demoId}` as before; the email-domain policy does not change what is persisted (bounded to 2,000 chars per answer, last 50 entries). No new secrets or personal data are logged.
- The editor keeps a local draft while the committed schema holds only normalized tokens; on blur the draft is normalized. A partially typed token (e.g., "acmecor") is not committed to the stored schema until it is a valid FQDN, which may surprise authors mid-typing but guarantees stored values are always valid.

Please review the full diff and surrounding code for OWASP Top 10, tenant isolation,
authentication/authorization, input validation, XSS, SSRF, injection, upload safety,
secret exposure, privacy, dependency risk, insecure cloud configuration, and missing
negative tests. Classify findings as BLOCKER, HIGH, MEDIUM, LOW, or NOTE.

Claude review status: unavailable in this environment; human/Claude review remains required before production use.
