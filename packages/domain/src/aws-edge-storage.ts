/**
 * AWS S3 Private Storage & CloudFront CDN Distribution — TASK-182
 */

export interface AwsStorageDistributionConfig {
  readonly s3BucketName: string;
  readonly isPublicAccessBlocked: boolean;
  readonly cloudFrontDomain: string;
}

export function createAwsStorageDistributionConfig(
  s3BucketName: string
): AwsStorageDistributionConfig {
  if (!s3BucketName.trim()) {
    throw new Error("S3 bucket name is required.");
  }

  return Object.freeze({
    s3BucketName: s3BucketName.trim(),
    isPublicAccessBlocked: true,
    cloudFrontDomain: `d111111abcdef8.cloudfront.net`
  });
}
