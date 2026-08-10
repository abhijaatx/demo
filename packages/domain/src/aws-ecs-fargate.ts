/**
 * AWS ECS Fargate & Application Load Balancer Service Configuration — TASK-183
 */

export interface AwsEcsFargateServiceConfig {
  readonly serviceName: string;
  readonly cpu: number;
  readonly memoryMb: number;
  readonly desiredCount: number;
  readonly isNonRootUser: boolean;
}

export function createAwsEcsFargateServiceConfig(serviceName: string): AwsEcsFargateServiceConfig {
  if (!serviceName.trim()) {
    throw new Error("ECS service name is required.");
  }

  return Object.freeze({
    serviceName: serviceName.trim(),
    cpu: 512,
    memoryMb: 1024,
    desiredCount: 2,
    isNonRootUser: true
  });
}
