# Deferred scanner placeholders

These entries are intentionally visible in CI until the corresponding production packaging exists. They are not claims that the repository has passed those scanners.

Owner: `platform-security`

Exit rule: each scanner becomes a blocking job as soon as its target artifacts exist. A high or critical finding must fail CI unless an authorized human records a documented false-positive or risk acceptance with an owner and expiry.

### sast

- Tool decision: Semgrep or CodeQL, selected by `platform-security`.
- Current baseline: ESLint, strict TypeScript, dependency audit, and Gitleaks run in CI.
- Deferred because: no SAST ruleset or approved source-code findings policy has been established yet.
- Required before: the first authenticated/data-bearing release.

### container

- Tool decision: Trivy or the approved image scanner.
- Current baseline: no production Dockerfiles or deployable image workflow exists in TASK-010.
- Deferred because: scanning an absent image would be a false gate.
- Required before: the first ECS image build or registry push.

### iac

- Tool decision: Checkov or Trivy config, selected by `platform-security`.
- Current baseline: AWS infrastructure is documented in `architecture.md` but no Terraform/CDK source exists yet.
- Deferred because: there is no IaC plan to scan.
- Required before: the first AWS staging infrastructure change.

The CI `deferred-scanners` job validates that these placeholders remain documented and owned. It must be replaced by blocking scanner jobs when each prerequisite is introduced.
