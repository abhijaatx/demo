/**
 * AWS Cognito Identity, SES Email & Secrets Manager Configuration — TASK-186
 */

export interface AwsEnvironmentSecretsConfig {
  readonly userPoolId: string;
  readonly sesDomain: string;
  readonly kmsKeyArn: string;
  readonly isLocalMockDisabled: boolean;
}

export function createAwsEnvironmentSecretsConfig(
  userPoolId: string,
  sesDomain: string
): AwsEnvironmentSecretsConfig {
  if (!userPoolId.trim() || !sesDomain.trim()) {
    throw new Error("Cognito User Pool ID and SES domain are required.");
  }

  return Object.freeze({
    userPoolId: userPoolId.trim(),
    sesDomain: sesDomain.trim().toLowerCase(),
    kmsKeyArn: "arn:aws:kms:us-east-1:123456789012:key/supademo-prod-key",
    isLocalMockDisabled: true // Disables local mocks in production
  });
}
