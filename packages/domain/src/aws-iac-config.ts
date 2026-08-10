/**
 * AWS Infrastructure as Code (IaC) & VPC Network Architecture — TASK-181
 */

export interface AwsInfrastructureConfig {
  readonly environment: "staging" | "production";
  readonly region: string;
  readonly vpcCidr: string;
  readonly isDestroyProtected: boolean;
}

export function createAwsInfrastructureConfig(
  environment: "staging" | "production" = "staging",
  region = "us-east-1"
): AwsInfrastructureConfig {
  return Object.freeze({
    environment,
    region,
    vpcCidr: "10.0.0.0/16",
    isDestroyProtected: environment === "production"
  });
}
