import type { ObjectStorageAdapter } from "@supademo/domain";

export class InMemoryStorageAdapter implements ObjectStorageAdapter {
  private readonly objects = new Map<
    string,
    { data: Buffer; contentType: string; checksumSha256?: string }
  >();

  async generateUploadUrl(
    key: string,
    contentType: string,
    expiresSeconds: number
  ): Promise<{ uploadUrl: string; headers: Record<string, string> }> {
    return {
      uploadUrl: `http://localhost:9000/test-bucket/${encodeURIComponent(key)}?expires=${expiresSeconds}`,
      headers: { "Content-Type": contentType }
    };
  }

  async generateDownloadUrl(key: string, expiresSeconds: number): Promise<string> {
    return `http://localhost:9000/test-bucket/${encodeURIComponent(key)}?expires=${expiresSeconds}`;
  }

  async deleteObject(key: string): Promise<void> {
    this.objects.delete(key);
  }

  async headObject(
    key: string
  ): Promise<{ size: number; mimeType: string; checksumSha256?: string } | null> {
    const obj = this.objects.get(key);
    if (!obj) return null;
    const result: { size: number; mimeType: string; checksumSha256?: string } = {
      size: obj.data.length,
      mimeType: obj.contentType
    };
    if (obj.checksumSha256) {
      result.checksumSha256 = obj.checksumSha256;
    }
    return result;
  }

  putMemoryObject(key: string, data: Buffer, contentType: string, checksumSha256?: string): void {
    const entry: { data: Buffer; contentType: string; checksumSha256?: string } = {
      data,
      contentType
    };
    if (checksumSha256) {
      entry.checksumSha256 = checksumSha256;
    }
    this.objects.set(key, entry);
  }
}
