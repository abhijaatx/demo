/**
 * AWS SQS Queues, DLQs & Background Worker Infrastructure — TASK-185
 */

export interface AwsQueueWorkerConfig {
  readonly queueName: string;
  readonly dlqName: string;
  readonly maxReceiveCount: number;
  readonly visibilityTimeoutSeconds: number;
}

export function createAwsQueueWorkerConfig(queueName: string): AwsQueueWorkerConfig {
  if (!queueName.trim()) {
    throw new Error("Queue name is required.");
  }

  const cleanName = queueName.trim();

  return Object.freeze({
    queueName: cleanName,
    dlqName: `${cleanName}-dlq`,
    maxReceiveCount: 5,
    visibilityTimeoutSeconds: 300
  });
}
