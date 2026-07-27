# SECURITY REVIEW REQUEST — TASK-010

## Change summary

- Added SHA-pinned GitHub Actions CI for pull requests, pushes to `main`, and manual runs.
- Added locked dependency installation, formatting/lint/boundary/type checks, production build, tests, raw V8 coverage artifacts, and high-severity dependency audit.
- Added a Docker-backed local migration/integration job with stack health checks, migration dry-run/apply, API integration, log artifact capture, and guaranteed teardown.
- Added full-history Gitleaks secret scanning with read-only workflow permissions.
- Added explicit SAST, container-image, and IaC scanner placeholders with an owner, prerequisites, exit rule, and replacement criteria.
- Added a safe test-coverage runner and local CI reproduction guide.

## Files changed

- `.github/workflows/ci.yml`
- `.github/security/scanner-placeholders.md`
- `scripts/run-test-coverage.mjs`
- `scripts/check-deferred-security.mjs`
- `package.json`, `package-lock.json`, `.gitignore`
- `README.md`, `docs/ci.md`

## Trust boundaries and sensitive data affected

- GitHub Actions runners execute repository code and dependency install/build scripts; workflow permissions are limited to `contents: read`.
- Pull request workflows use `pull_request`, not `pull_request_target`, and do not expose repository secrets to forked code.
- Checkout credentials are disabled after checkout with `persist-credentials: false`.
- CI uses only development placeholders from `.env.example` for local Docker services; no production credentials or AWS secrets are configured.
- Test and coverage artifacts are limited to test output, raw V8 coverage, and local service logs. `.env`, Docker volumes, and dependency caches are not uploaded.
- Gitleaks scans full repository history; its comments are disabled to avoid requiring write permissions.

## Authorization model

- Workflow jobs have repository contents read permission only.
- No job can publish packages, deploy infrastructure, modify pull requests, approve changes, or access cloud credentials.
- Deferred scanner documentation is checked by a read-only script; it does not weaken the blocking quality, audit, or secret-scan jobs.
- `platform-security` owns replacing deferred placeholders with blocking scanners when production artifacts exist.

## Threats considered

- Mutable or compromised third-party actions changing CI behavior.
- Pull-request code gaining write permissions or repository secrets.
- Dependency install/build/test code exfiltrating secrets from the runner.
- Secrets in current source or Git history.
- High/critical dependency vulnerabilities being merged silently.
- Migrations not applying from an empty database or leaving local services running after failure.
- Coverage/test artifacts accidentally containing `.env`, credentials, or service volumes.
- Placeholder scanners being mistaken for completed SAST, image, or IaC scans.
- Docker service logs containing credentials or personal data.

## Security controls implemented

- All third-party workflow actions are pinned to full commit SHAs and annotated with release versions.
- Top-level and per-job workflow permissions are `contents: read` only.
- `pull_request` is used for untrusted change validation; no `pull_request_target` is present.
- `npm ci --ignore-scripts` provides deterministic installation while avoiding install-script execution in CI.
- `npm audit --audit-level=high` blocks high and critical dependency findings.
- Gitleaks scans the full history and is configured without comment/write behavior.
- Migration CI runs against isolated Docker services, validates dry-run ordering, applies migrations, checks health, runs integration, captures diagnostics, and always executes stack teardown.
- Coverage artifacts are written under an ignored directory and the upload action has a 14-day retention period.
- Deferred scanner checks fail if ownership/documentation disappears and clearly state that they are not scanner results.

## Security tests/checks added or run

- `npm run verify` passed: formatting, ESLint, workspace boundaries, and TypeScript checks.
- `npm run test:coverage` passed with 27 tests executed and one intentional skip, producing raw V8 coverage artifacts without the test runner coverage warning.
- `npm audit --audit-level=high` passed with zero vulnerabilities.
- `npm run security:placeholders` passed for SAST, container, and IaC placeholders.
- Local migration and API integration checks passed previously against PostgreSQL; the same commands are wired into CI with a clean Docker stack.
- Workflow and scanner manifest formatting passed Prettier validation.

## Checks not run

- The GitHub Actions workflow was not executed in a remote repository because this workspace is not connected to a GitHub repository.
- Gitleaks itself was not run locally; the pinned GitHub Action is the CI execution path.
- Semgrep/CodeQL, Trivy, Checkov, SBOM, license, container, and IaC scanners remain explicitly deferred and are not falsely marked as passed.
- No hosted-runner network isolation or organization-level Actions policy was validated.

## Dependencies or infrastructure permissions added

- No runtime dependencies were added.
- GitHub Actions uses pinned `actions/checkout`, `actions/setup-node`, `actions/upload-artifact`, and Gitleaks Action revisions.
- No AWS credentials, IAM permissions, cloud resources, deployment permissions, or repository write permissions were added.

## Known limitations and residual risks

- CI cannot guarantee that a malicious dependency install script is harmless; `npm ci --ignore-scripts` reduces this risk but package runtime/build behavior still executes during tests/build.
- Gitleaks configuration and organization allowlists require review when real secrets or generated fixtures are introduced.
- Raw V8 coverage is uploaded rather than a hosted coverage threshold; threshold policy belongs with the test architecture and should become blocking when coverage baselines stabilize.
- Deferred scanners leave a known gap until production source artifacts, images, and IaC are introduced; the owner and replacement criteria are recorded in `.github/security/scanner-placeholders.md`.
- Docker image provenance, action provenance, SBOM signing, and artifact attestation are deferred to the deployment pipeline.

## Requested Claude review

Review the full diff for workflow injection, unsafe event selection, permission expansion, action SHA correctness, secret exposure through forks/caches/artifacts/logs, dependency-install behavior, Gitleaks configuration, migration cleanup guarantees, artifact retention/content, scanner-placeholder ambiguity, CI bypasses, and missing branch-protection assumptions. Classify findings as BLOCKER, HIGH, MEDIUM, LOW, or NOTE.

### Status

Pending independent Claude review. Do not mark TASK-010 complete in `TASKS.md` until BLOCKER/HIGH findings are resolved or explicitly accepted by an authorized human.
