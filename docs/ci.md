# CI and security gates

The repository workflow is `.github/workflows/ci.yml`. It runs on pull requests, pushes to `main`, and manual dispatch with repository-wide read-only permissions and concurrency cancellation.

## Blocking jobs

- **Quality, tests, audit:** locked `npm ci`, formatting, ESLint, workspace boundaries, TypeScript, build, Node test suite, raw V8 coverage artifacts, and `npm audit --audit-level=high`.
- **Local migration and integration:** starts the localhost-only Docker stack, validates the migration dry run, applies migrations from an empty CI database, checks PostgreSQL/stack health, runs the API integration test, uploads service logs, and always tears down services.
- **Secret scan:** scans the full Git history with the pinned Gitleaks action.

High or critical dependency findings, secret findings, failed quality checks, test failures, migration failures, and integration failures block the workflow.

## Deferred scanner gates

The `deferred-scanners` job validates `.github/security/scanner-placeholders.md`. SAST, container-image scanning, and IaC scanning are placeholders because this task has no approved SAST ruleset, production Dockerfiles, or Terraform/CDK source. `platform-security` owns replacing each placeholder with a blocking scanner before its documented prerequisite release.

The placeholder job is deliberately not presented as a successful scan. It only fails if the ownership, tool decision, or exit criteria documentation disappears.

## Local reproduction

```bash
npm ci --ignore-scripts
npm run verify
npm run test:coverage
npm audit --audit-level=high

cp .env.example .env
npm run stack:up
npm run db:dry-run
npm run db:migrate
npm run db:health
npm run stack:check
npm run test:integration
npm run stack:down
```

`test:coverage` writes ignored `artifacts/test-results.txt` and raw V8 coverage files under `artifacts/v8-coverage/`. The workflow uploads these artifacts for 14 days and never uploads `.env`, service volumes, or runtime logs containing credentials.

## Action pinning

Third-party actions are pinned to full commit SHAs with release comments. Dependabot or the platform-security owner must update the SHA and review the release before changing an action. `persist-credentials: false` prevents checkout credentials from remaining in the runner workspace.
