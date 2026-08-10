/**
 * AWS Staging & Production CI/CD Deployment Pipeline — TASK-187
 */

export interface AwsDeploymentPipelineConfig {
  readonly commitSha: string;
  readonly environment: "staging" | "production";
  readonly isOidcAuthenticated: boolean;
  readonly requiresManualApproval: boolean;
}

export function createAwsDeploymentPipelineConfig(
  commitSha: string,
  environment: "staging" | "production" = "staging"
): AwsDeploymentPipelineConfig {
  if (!commitSha.trim()) {
    throw new Error("Commit SHA is required for deployment provenance.");
  }

  return Object.freeze({
    commitSha: commitSha.trim(),
    environment,
    isOidcAuthenticated: true, // Uses short-lived OIDC role assumption instead of long-lived AWS keys
    requiresManualApproval: environment === "production"
  });
}
