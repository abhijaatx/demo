# SECURITY REVIEW REQUEST — TASK-004

## Change summary

- Replaced the config package placeholder with a typed `AppConfig` model and validated environment loader.
- Added fail-fast validation for runtime/source compatibility, ports, URLs, AWS regions, S3 bucket names, email header safety, required values, and log levels.
- Added local environment, AWS Secrets Manager, AWS Systems Manager Parameter Store, and composite provider boundaries.
- Added production/staging fail-closed behavior: `APP_ENV=staging|production` requires `CONFIG_SOURCE=aws` and an injected provider; application secrets are not read from the deployment environment in AWS mode.
- Added value-free configuration errors and a non-mutating `redactConfig()` helper for diagnostics.
- Wired API and worker startup through `loadConfig()` and root `.env` loading with Node’s `--env-file-if-exists`.
- Added security-focused configuration tests, environment examples, and operating documentation.

## Files changed

- `.env.example`
- `apps/api/package.json`, `apps/api/src/index.ts`, `apps/api/tsconfig.json`
- `apps/worker/package.json`, `apps/worker/src/index.ts`, `apps/worker/tsconfig.json`
- `packages/config/src/index.ts`
- `package.json`, `package-lock.json`
- `tests/config.test.mjs`, `tests/scaffold.test.mjs`
- `README.md`, `docs/configuration.md`

## Trust boundaries and sensitive data affected

- `process.env` is an untrusted configuration input at process startup. The config package is the single parsing and validation boundary.
- Database URLs, Redis URLs, AWS credentials, and provider-returned secret values are held in runtime memory but are not printed by the config package.
- In AWS mode, only bootstrap metadata (`APP_ENV`, `CONFIG_SOURCE`, `AWS_REGION`, and provider prefixes) is taken from the environment. Parameters and secrets are loaded through injected provider interfaces.
- The AWS adapters accept client-like interfaces and command factories. They do not create credentials, read arbitrary paths, or import SDK clients into the shared package.
- API and worker startup now fail before binding or processing when required configuration is missing or malformed.

## Authorization model

- No user, workspace, public-link, API authorization, or tenant-owned data access behavior was added.
- AWS authorization remains outside this package and must be supplied by the ECS/task role used to construct the injected AWS SDK clients.
- Provider prefixes are explicit and applied exactly once by the AWS adapters; caller-supplied keys are treated as path components and normalized at the prefix boundary.

## Threats considered

- Production accidentally using environment-provided secrets instead of the approved AWS secret boundary.
- Secret values leaking through validation errors, provider errors, startup logs, or redacted diagnostics.
- Malformed ports, URLs, AWS regions, bucket names, and SMTP sender values causing unsafe startup behavior.
- SMTP header injection through CR/LF in the configured sender address.
- AWS provider failures exposing SDK error bodies or secret identifiers beyond the configured lookup key.
- AWS parameter values being fetched without decryption enabled when SecureString parameters are used.
- Runtime configuration being mutated after validation.
- Browser-facing code importing server-only configuration.

## Security controls implemented

- Environment/source compatibility is enforced: local/test use `env`; staging/production use `aws`.
- Production AWS mode ignores environment copies of `DATABASE_URL` and `REDIS_URL` and requires provider-returned values.
- Configuration errors contain field names and generic remediation text, never rejected values or provider exception details.
- `redactConfig()` returns a copy and redacts URLs, passwords, tokens, authorization-like fields, API keys, and access keys.
- Returned config objects are frozen recursively across their known nested sections.
- URL protocols are allowlisted by purpose; database and Redis schemes cannot silently become file or arbitrary schemes.
- Ports are bounded; S3 bucket names are constrained to the expected DNS-compatible form; SMTP sender values reject control characters.
- AWS Parameter Store requests set `WithDecryption: true` for supported SecureString configuration.
- API and worker startup use the repository-root ignored `.env` file only for local/test execution; `.env.example` is explicitly documented as non-production placeholder data.
- The web and browser-extension packages do not import the server-only config package.

## Security tests/checks added or run

- Local/test defaults and immutable typed config.
- Malformed values fail without including rejected secrets in errors.
- Production requires AWS source/provider and ignores environment secret overrides.
- AWS adapter prefixing, Parameter Store decryption flag, and provider-error redaction.
- Redacted config does not contain database/Redis credentials or access keys.
- API and worker startup configuration validation remains covered by the existing process tests.
- `npm run verify` passed: formatting, ESLint, workspace boundaries, and TypeScript checks.
- `npm test` passed with 11/11 tests.
- `npm audit --omit=dev` reported 0 vulnerabilities.
- Root `npm run start:api` was smoke-tested with validated test configuration and the process shut down cleanly.

## Checks not run

- Secret scanning, SAST beyond ESLint, dependency policy scanning beyond npm audit, container scanning, SBOM generation, and IaC scanning remain deferred to TASK-010.
- No live AWS Secrets Manager or Parameter Store calls were made; adapters were tested with typed fake clients and command factories.
- IAM policy, KMS, VPC endpoint, ECS task-definition, and AWS runtime permission review remain infrastructure work.

## Dependencies or infrastructure permissions added

- No external npm dependencies were added.
- No AWS SDK, credentials, resources, IAM actions, or cloud permissions were added.
- API and worker now depend on the internal `@supademo/config` workspace package.

## Known limitations and residual risks

- The AWS client-like interfaces intentionally defer SDK versioning, retry behavior, timeouts, and IAM construction to the deployment layer; those choices must be reviewed when AWS infrastructure is introduced.
- Local/test configuration requires explicit database, Redis, and AWS-compatible credentials; a fresh checkout must copy `.env.example` to `.env` before starting API or worker processes.
- The redactor is conservative and key-based. New config fields containing sensitive values must use sensitive names or be added to the redaction rule before logging.
- Configuration validation does not verify network reachability or credentials against services; service health and connection tests belong to their adapters and later tasks.

## Requested Claude review

Review the full diff and surrounding configuration for secret leakage, unsafe defaults, environment-source confusion, incomplete production fail-closed behavior, provider path manipulation, AWS SDK/interface mismatches, missing redaction coverage, unsafe URL/host parsing, startup error disclosure, package-boundary violations, and accidental browser bundling of server configuration. Classify findings as BLOCKER, HIGH, MEDIUM, LOW, or NOTE.

### Status

Pending independent Claude review. Do not mark TASK-004 complete in `TASKS.md` until BLOCKER/HIGH findings are resolved or explicitly accepted by an authorized human.
