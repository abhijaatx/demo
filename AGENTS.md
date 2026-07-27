# Mandatory Secure Development Policy for Coding Agents

This file applies to every coding agent working in this repository. Security is a completion requirement, not an optional cleanup task.

No automated process can guarantee that software contains zero vulnerabilities. The purpose of this policy is to require consistent prevention, testing, documentation, and independent review so security defects are found before code is accepted.

## 1. Required workflow

For every implementation or code change, the coding agent must:

1. Read this file before modifying code.
2. Read `UI_REQUIREMENTS.md` before any creator- or viewer-facing change.
3. Identify the data, trust boundaries, permissions, and external inputs affected by the change.
4. Inspect surrounding code before editing; do not assume existing behavior is secure.
5. Implement the smallest change that satisfies the requirement.
6. Add or update security-relevant tests.
7. Run the applicable checks listed in this policy.
8. Review the final diff specifically for security vulnerabilities.
9. Produce a security handoff for Claude using the template in this file.
10. Treat the task as incomplete until Claude's security review has been performed and all blocking findings are resolved or explicitly accepted by an authorized human.

Agents must never claim that code is “secure,” “vulnerability-free,” or “safe” solely because tests pass.

## 2. Security priorities for this product

This is a multi-tenant interactive-demo platform that processes untrusted uploads, captured HTML, public viewer traffic, analytics events, integrations, and AI requests. The highest-risk areas are:

- Cross-workspace and cross-tenant data access
- Authorization bypass and insecure direct object references
- Stored and reflected cross-site scripting
- Captured HTML and sandbox escape
- Unsafe file upload and media processing
- Server-side request forgery
- SQL, command, template, and prompt injection
- Public-link and embed access-control mistakes
- Secret, token, and personal-data exposure
- Webhook forgery and replay
- OAuth token mishandling
- Malicious analytics or form payloads
- Over-permissive IAM or cloud configuration
- Dependency and supply-chain vulnerabilities

Any change touching these areas requires explicit threat analysis and negative tests.

## 3. Tenant isolation and authorization

- Every tenant-owned record must be scoped by `workspace_id` or the repository's canonical tenant identifier.
- Every protected operation must verify both identity and authorization on the server.
- Never rely on UI visibility, client-provided roles, or guessed resource ownership.
- Resource lookup by ID must also include tenant scope unless the resource is explicitly public.
- Authorization checks must cover read, create, update, delete, publish, share, export, and administrative actions separately.
- Public links must have explicit access policies and unguessable identifiers.
- Password, email, and expiring gates must be enforced server-side.
- Presigned object-storage URLs must be short-lived and limited to one intended object and operation.
- Add negative tests proving that users from workspace A cannot access workspace B data.

## 4. Input validation and output safety

- Treat all browser, extension, embed, webhook, upload, integration, and AI inputs as untrusted.
- Validate input with allowlisted schemas at every API boundary.
- Reject unknown fields where practical.
- Apply length, range, count, and nesting limits.
- Use parameterized database queries; never concatenate untrusted values into SQL.
- Never pass untrusted input to a shell. If unavoidable, use argument arrays and strict allowlists.
- Escape output for its destination context: HTML, attribute, URL, JavaScript, CSS, SQL, shell, or logs.
- Sanitize rich text and captured HTML with a maintained allowlist-based sanitizer.
- Do not use unsafe DOM APIs such as `innerHTML`, `outerHTML`, or `document.write` with unsanitized content.
- Do not use dynamic code execution such as `eval`, `Function`, or untrusted template execution.
- Validate redirects and outbound URLs against allowlists to prevent open redirects and SSRF.
- Block access to loopback, link-local, private-network, instance-metadata, and internal service addresses for server-side URL fetching.

## 5. HTML cloning, embeds, and sandboxing

- Serve captured or user-controlled HTML from a separate origin that receives no creator-application authentication cookies.
- Render untrusted content inside sandboxed iframes with the minimum required permissions.
- Do not combine `allow-scripts` and `allow-same-origin` for untrusted same-origin content.
- Apply a restrictive Content Security Policy.
- Disable top navigation, popups, downloads, forms, clipboard, camera, microphone, geolocation, and storage unless the feature explicitly requires them.
- Remove or rewrite scripts, event handlers, dangerous URLs, forms, meta refreshes, iframes, object/embed elements, and network references during sanitization.
- Validate `postMessage` origin, source, type, and payload schema on both sender and receiver.
- Never accept privileged actions from embed events without server-side authorization.
- Add tests for malicious HTML, script URLs, event handlers, iframe escape attempts, and forged messages.

## 6. Authentication, sessions, and credentials

- Use the configured identity provider and established authentication middleware.
- Do not implement custom password hashing, token formats, or cryptography.
- Cookies must use `Secure`, `HttpOnly`, and an appropriate `SameSite` setting.
- Protect cookie-authenticated state-changing requests against CSRF.
- Validate token issuer, audience, signature, expiration, and intended use.
- Rotate refresh tokens where supported and revoke them after compromise or logout.
- Require re-authentication for high-risk account actions where appropriate.
- Never log passwords, session tokens, API keys, OAuth tokens, presigned URLs, or authorization headers.
- Store production secrets in AWS Secrets Manager or the approved secret store.
- Local secrets belong in ignored environment files, never committed files.

## 7. File upload and media processing

- Upload large media directly to object storage using constrained presigned requests.
- Enforce file-size, object-count, and workspace-quota limits before upload finalization.
- Validate extension, declared MIME type, detected file signature, and decoder result.
- Generate server-controlled object keys; never trust a user-supplied filesystem path.
- Reject archives or recursively inspect them with strict expansion limits if archives become necessary.
- Scan untrusted uploads before publication.
- Process media in isolated, resource-limited workers without cloud credentials beyond required object access.
- Set CPU, memory, duration, frame, pixel, and output-size limits for FFmpeg and image decoders.
- Keep raw uploads private and publish only validated derivatives.
- Remove unnecessary metadata from generated public assets.
- Protect against path traversal, decompression bombs, parser exploits, and malicious filenames.

## 8. APIs, analytics, forms, and public endpoints

- Apply authentication where appropriate and explicit anonymous policies where public access is intended.
- Rate-limit by IP, user, workspace, demo, and token as appropriate.
- Enforce request-body and batch-size limits before parsing large payloads.
- Use idempotency keys for retried state-changing operations.
- Validate pagination and cap page sizes.
- Avoid returning internal errors, stack traces, database details, or secret configuration.
- Treat analytics events as untrusted telemetry, not authorization evidence.
- Prevent formula injection when exporting CSV by neutralizing cells beginning with dangerous spreadsheet prefixes.
- Apply spam, abuse, and duplicate-submission controls to public forms.
- Keep identified viewer information separate from anonymous analytics where practical.

## 9. Webhooks and third-party integrations

- Verify webhook signatures using the raw request body and constant-time comparison.
- Validate timestamps and reject stale or replayed webhook events.
- Store processed provider event IDs for idempotency.
- Encrypt OAuth refresh tokens and integration credentials at rest.
- Request the minimum provider scopes.
- Do not expose provider error bodies directly to end users.
- Apply timeouts, retry limits, and circuit breakers to outbound requests.
- Prevent SSRF in user-configured webhook URLs.
- Redact secrets and personal data from integration logs.

## 10. AI-specific requirements

- Treat prompts, retrieved documents, tool output, and model output as untrusted data.
- Never let model output bypass normal authorization or validation.
- Keep AI tool permissions narrow and enforce them in deterministic server code.
- Defend against prompt injection in uploaded and retrieved content.
- Require confirmation for destructive actions, external messages, publishing, bulk edits, and permission changes.
- Validate structured model output against a strict schema.
- Escape or sanitize AI-generated content before rendering.
- Do not send secrets or unnecessary personal data to model providers.
- Record provider, model, prompt version, tool calls, and high-risk decisions for auditability without logging sensitive prompt content unnecessarily.
- Apply workspace quotas, timeouts, and cost controls.
- Preserve source attribution for retrieval-based answers.

## 11. Data protection and privacy

- Collect only data required for the feature.
- Define retention and deletion behavior for every new sensitive data type.
- Encrypt sensitive data in transit and at rest.
- Avoid placing personal or secret data in URLs, analytics properties, cache keys, logs, or client-readable error messages.
- Redact sensitive fields from telemetry and support tooling.
- Ensure account, workspace, and asset deletion workflows remove or schedule removal of dependent data.
- Ensure backups and exports follow documented retention and access policies.
- Document any new subprocessor or external data transfer.

## 12. Dependencies and supply chain

- Prefer platform capabilities and existing dependencies over adding packages.
- Before adding a package, check maintenance status, ownership, release activity, transitive dependencies, and known vulnerabilities.
- Pin production dependencies through the repository lockfile.
- Do not run untrusted install scripts without review.
- Do not copy opaque code from blogs, generated snippets, or unknown repositories.
- Run the ecosystem's dependency audit and inspect high/critical findings.
- Generate and retain an SBOM in CI when production packaging is established.
- Sign or otherwise verify production artifacts when the deployment pipeline supports it.

## 13. AWS and infrastructure security

- Apply least-privilege IAM to every task and CI role.
- Do not use wildcard actions or resources without a documented reason.
- Keep RDS, Redis, and internal services in private or isolated subnets.
- Block public access on S3 buckets.
- Serve S3 content through CloudFront Origin Access Control or short-lived presigned URLs.
- Encrypt RDS, Redis where supported, S3, queues, logs, and secrets with approved KMS keys where required.
- Restrict security-group ingress to known service dependencies.
- Enable database backups, S3 versioning where required, and log retention.
- Never expose infrastructure credentials to browser code.
- Review Terraform/CDK plans for public exposure, IAM expansion, deletion risk, and encryption changes.

## 14. Logging and error handling

- Use structured logs and correlation IDs.
- Do not log raw request bodies by default.
- Redact credentials, cookies, tokens, personal information, and uploaded content.
- Return stable public error codes and generic messages.
- Preserve useful internal diagnostic context without exposing it to clients.
- Record authentication failures, authorization denials, privileged actions, publishing, exports, and integration changes in audit logs.
- Do not catch and silently ignore security-relevant failures.

## 15. Required security tests

Tests must be proportional to the change. Relevant changes require:

- Unit tests for validation and authorization rules
- Integration tests for protected API endpoints
- Cross-tenant negative tests
- Unauthenticated-access tests
- Role and permission boundary tests
- Malformed and oversized input tests
- Stored/reflected XSS tests for rendered content
- SQL/command/template injection tests where applicable
- SSRF tests for URL-fetching features
- File-type, size, traversal, and malicious-upload tests
- Webhook signature and replay tests
- CSRF and CORS tests where applicable
- Rate-limit tests for public or expensive endpoints
- Idempotency and retry tests for jobs and integrations
- AI output-schema and tool-authorization tests
- Infrastructure-policy tests for public access and IAM

Security regression tests must accompany every fixed vulnerability.

## 16. Required automated checks

Use the repository's configured commands. When tooling is added, CI must include:

- Formatting and linting
- Type checking
- Unit and integration tests
- Secret scanning, such as Gitleaks
- Dependency vulnerability scanning
- Static application security testing, such as Semgrep or CodeQL
- Container-image scanning, such as Trivy
- Infrastructure-as-code scanning, such as Checkov or Trivy
- Dockerfile linting
- License-policy checks where required
- Dynamic security testing against staging for public releases

High and critical findings block completion unless they are demonstrated false positives or explicitly accepted by an authorized human with a written reason and expiry date.

If a check cannot be run, the coding agent must state exactly which check was skipped, why it was unavailable, the resulting risk, and the command Claude or a human should run later.

## 17. Diff-level self-review checklist

Before handing work to Claude, the coding agent must inspect the final diff and answer:

- Does every new endpoint enforce identity, tenant scope, and permission?
- Can an identifier be changed to access another workspace's data?
- Is every external input validated and bounded?
- Is any untrusted content rendered, executed, fetched, or passed to a parser?
- Are uploads private until verified?
- Could this expose secrets or personal data through logs, URLs, errors, analytics, or caches?
- Does this introduce SSRF, XSS, CSRF, SQL injection, command injection, path traversal, or unsafe deserialization?
- Are webhook and asynchronous operations authenticated, idempotent, and replay-safe?
- Are AI outputs treated as untrusted and tools authorized independently?
- Are AWS permissions and network exposure minimal?
- Are failure modes secure, observable, and recoverable?
- Were security tests added for the most likely abuse cases?

## 18. Mandatory handoff to Claude

After implementation, the coding agent must provide Claude with:

```text
SECURITY REVIEW REQUEST

Change summary:
- <what changed>

Files changed:
- <file paths>

Trust boundaries and sensitive data affected:
- <boundaries and data>

Authorization model:
- <who can perform each new operation and how it is enforced>

Threats considered:
- <likely abuse cases>

Security controls implemented:
- <validation, isolation, rate limits, encryption, etc.>

Security tests added:
- <tests and expected protections>

Checks run and results:
- <exact commands and outcomes>

Checks not run:
- <command, reason, and remaining risk>

Dependencies or infrastructure permissions added:
- <packages, services, IAM actions, or none>

Known limitations and residual risks:
- <honest list; never write “none” without justification>

Please review the full diff and surrounding code for OWASP Top 10, tenant isolation,
authentication/authorization, input validation, XSS, SSRF, injection, upload safety,
secret exposure, privacy, dependency risk, insecure cloud configuration, and missing
negative tests. Classify findings as BLOCKER, HIGH, MEDIUM, LOW, or NOTE.
```

The coding agent must not coach Claude toward approval or limit the review to files it believes are safe.

## 19. Claude security-review requirements

Claude must independently inspect the diff and enough surrounding code to validate assumptions. Claude should not rely solely on the coding agent's summary.

Claude must:

1. Identify changed trust boundaries and attack surfaces.
2. Trace authentication, authorization, and tenant scoping end to end.
3. Trace untrusted data from input to storage, rendering, execution, logging, and external calls.
4. Review failure paths, retries, race conditions, and idempotency.
5. Check dependencies and infrastructure changes.
6. Confirm tests cover realistic negative cases.
7. Report findings with file and line references where possible.
8. Classify each finding by severity.
9. Distinguish verified vulnerabilities from defense-in-depth recommendations.
10. State which checks it ran and which it could not run.

### Review outcome

- **APPROVED:** No unresolved blocker or high-severity findings; required checks passed.
- **APPROVED WITH NOTES:** No unresolved blocker or high-severity findings; only documented medium/low risks remain.
- **CHANGES REQUIRED:** At least one unresolved blocker/high finding, missing required security test, or material review gap.

Claude must not approve solely because scanners report no findings.

## 20. Finding resolution rules

- BLOCKER and HIGH findings must be fixed before merge or release.
- MEDIUM findings should be fixed before merge unless an authorized human accepts the risk in writing.
- LOW findings may become tracked follow-up work.
- A finding may be dismissed only with technical evidence.
- Every security fix must include a regression test when feasible.
- After security-related changes, the affected checks and Claude review must run again.
- Agents may not weaken tests, suppress scanners broadly, or disable controls to make a review pass.

## 21. Stop-and-escalate conditions

The coding agent must stop and ask for an authorized decision if a task requires:

- Committing a secret or production credential
- Disabling authentication, authorization, encryption, validation, sandboxing, scanning, or audit logging
- Making a private bucket, database, cache, or internal service public
- Granting broad administrator or wildcard IAM access
- Processing untrusted code without an isolation design
- Sending customer data to a new third party without approval
- Accepting a known blocker or high-severity vulnerability
- Hiding, deleting, or misrepresenting a security finding

## 22. Definition of done

A code change is complete only when:

- Functional requirements are implemented.
- Applicable security requirements in this file are implemented.
- Security-relevant tests pass.
- Static, dependency, secret, container, and infrastructure checks applicable to the change have passed or their absence is documented.
- The final diff has been manually reviewed by the coding agent.
- The security handoff is complete.
- Claude has reviewed the code.
- All blocker and high-severity findings are resolved.
- Remaining accepted risks are documented with an owner and follow-up date.
