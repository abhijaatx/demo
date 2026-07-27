import type { ObjectStorageAdapter } from "@supademo/domain";

export interface S3StorageConfig {
  readonly endpoint: string;
  readonly bucket: string;
  readonly region?: string;
  readonly accessKeyId?: string;
  readonly secretAccessKey?: string;
}

export class S3CompatibleStorageAdapter implements ObjectStorageAdapter {
  private readonly endpoint: string;
  private readonly bucket: string;

  constructor(config: S3StorageConfig) {
    this.endpoint = config.endpoint.replace(/\/+$/u, "");
    this.bucket = config.bucket;
  }

  async generateUploadUrl(
    key: string,
    contentType: string,
    expiresSeconds: number
  ): Promise<{ uploadUrl: string; headers: Record<string, string> }> {
    const encodedKey = encodeURIComponent(key);
    const expires = Math.floor(Date.now() / 1000) + expiresSeconds;
    const uploadUrl = `${this.endpoint}/${this.bucket}/${encodedKey}?X-Amz-Expires=${expiresSeconds}&X-Amz-Date=${expires}`;

    return {
      uploadUrl,
      headers: {
        "Content-Type": contentType
      }
    };
  }

  async generateDownloadUrl(key: string, expiresSeconds: number): Promise<string> {
    const encodedKey = encodeURIComponent(key);
    const expires = Math.floor(Date.now() / 1000) + expiresSeconds;
    return `${this.endpoint}/${this.bucket}/${encodedKey}?X-Amz-Expires=${expiresSeconds}&X-Amz-Date=${expires}`;
  }

  async deleteObject(_key: string): Promise<void> {
    // S3 HTTP DELETE object stub
  }

  async headObject(
    _key: string
  ): Promise<{ size: number; mimeType: string; checksumSha256?: string } | null> {
    return null;
  }
}
