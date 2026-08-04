/**
 * AWS Production Observability, CloudWatch & OpenTelemetry Config — TASK-188
 */

export interface AwsObservabilityConfig {
  readonly serviceName: string;
  readonly cloudWatchLogGroup: string;
  readonly isOpenTelemetryEnabled: boolean;
  readonly sloAvailabilityTarget: number;
}

export function createAwsObservabilityConfig(serviceName: string): AwsObservabilityConfig {
  if (!serviceName.trim()) {
    throw new Error("Service name is required for observability.");
  }

  const cleanName = serviceName.trim();

  return Object.freeze({
    serviceName: cleanName,
    cloudWatchLogGroup: `/aws/ecs/${cleanName}`,
    isOpenTelemetryEnabled: true,
    sloAvailabilityTarget: 99.9
  });
}
