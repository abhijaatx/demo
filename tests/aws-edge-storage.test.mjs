import assert from "node:assert/strict";
import { test } from "node:test";
import { createAwsStorageDistributionConfig } from "@supademo/domain";

test("createAwsStorageDistributionConfig blocks S3 public access and returns CDN domain", () => {
  const cfg = createAwsStorageDistributionConfig("supademo-assets-prod");

  assert.equal(cfg.s3BucketName, "supademo-assets-prod");
  assert.equal(cfg.isPublicAccessBlocked, true);
  assert.equal(cfg.cloudFrontDomain.includes("cloudfront.net"), true);
});
