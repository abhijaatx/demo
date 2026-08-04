import assert from "node:assert/strict";
import { test } from "node:test";
import { createAwsQueueWorkerConfig } from "@supademo/domain";

test("createAwsQueueWorkerConfig generates paired DLQ and visibility timeouts", () => {
  const cfg = createAwsQueueWorkerConfig("media-processing");

  assert.equal(cfg.queueName, "media-processing");
  assert.equal(cfg.dlqName, "media-processing-dlq");
  assert.equal(cfg.maxReceiveCount, 5);
});
