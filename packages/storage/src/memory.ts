import { createHash, randomUUID } from "node:crypto";
import type {
  CompletedMultipartUpload,
  MultipartUploadHandle,
  MultipartUploadPart,
  MultipartUploadUrl,
  ObjectStorageAdapter,
  StoredObjectMetadata
} from "@supademo/domain";

type MemoryObject = {
  data: Buffer;
  contentType: string;
  checksumSha256Base64: string;
  etag: string;
};

type MemoryPart = {
  data: Buffer;
  checksumSha256Base64: string;
  etag: string;
};

type MemoryMultipartUpload = {
  key: string;
  contentType: string;
  parts: Map<number, MemoryPart>;
};

export class InMemoryStorageAdapter implements ObjectStorageAdapter {
  private readonly objects = new Map<string, MemoryObject>();
  private readonly multipartUploads = new Map<string, MemoryMultipartUpload>();

  async generateUploadUrl(
    key: string,
    contentType: string,
    expiresSeconds: number
  ): Promise<{ uploadUrl: string; headers: Record<string, string> }> {
    validateKey(key);
    validateExpiry(expiresSeconds, 60, 900);
    return {
      uploadUrl: `http://localhost:9000/test-bucket/${encodeURIComponent(key)}?expires=${expiresSeconds}`,
      headers: { "Content-Type": contentType }
    };
  }

  async generateDownloadUrl(key: string, expiresSeconds: number): Promise<string> {
    validateKey(key);
    validateExpiry(expiresSeconds, 60, 3_600);
    return `http://localhost:9000/test-bucket/${encodeURIComponent(key)}?expires=${expiresSeconds}`;
  }

  async deleteObject(key: string): Promise<void> {
    validateKey(key);
    this.objects.delete(key);
  }

  async headObject(key: string): Promise<StoredObjectMetadata | null> {
    validateKey(key);
    const object = this.objects.get(key);
    if (!object) return null;
    return Object.freeze({
      sizeInBytes: object.data.length,
      mimeType: object.contentType,
      etag: object.etag,
      checksumSha256Base64: object.checksumSha256Base64
    });
  }

  async getObjectStream(key: string, signal?: AbortSignal): Promise<AsyncIterable<Uint8Array>> {
    validateKey(key);
    const object = this.objects.get(key);
    if (!object) throw new Error("The storage object was not found.");
    const data = object.data;
    return {
      async *[Symbol.asyncIterator]() {
        for (let offset = 0; offset < data.length; offset += 64 * 1024) {
          if (signal?.aborted) throw new Error("The storage read was aborted.");
          yield data.subarray(offset, Math.min(offset + 64 * 1024, data.length));
        }
      }
    };
  }

  async createMultipartUpload(key: string, contentType: string): Promise<MultipartUploadHandle> {
    validateKey(key);
    const uploadId = randomUUID();
    this.multipartUploads.set(uploadId, {
      key,
      contentType,
      parts: new Map<number, MemoryPart>()
    });
    return Object.freeze({ uploadId });
  }

  async generateMultipartPartUploadUrl(
    key: string,
    uploadId: string,
    partNumber: number,
    sizeInBytes: number,
    checksumSha256Base64: string,
    expiresSeconds: number
  ): Promise<MultipartUploadUrl> {
    validatePartRequest(partNumber, sizeInBytes, checksumSha256Base64);
    validateExpiry(expiresSeconds, 60, 900);
    const upload = requireMultipartUpload(this.multipartUploads, key, uploadId);
    if (upload.parts.has(partNumber)) {
      throw new Error("The multipart part has already been uploaded.");
    }
    return Object.freeze({
      uploadUrl: `http://localhost:9000/test-bucket/${encodeURIComponent(key)}?uploadId=${encodeURIComponent(uploadId)}&partNumber=${partNumber}&expires=${expiresSeconds}`,
      expiresInSeconds: expiresSeconds,
      headers: Object.freeze({ "x-amz-checksum-sha256": checksumSha256Base64 })
    });
  }

  async completeMultipartUpload(
    key: string,
    uploadId: string,
    parts: readonly MultipartUploadPart[]
  ): Promise<CompletedMultipartUpload> {
    const upload = requireMultipartUpload(this.multipartUploads, key, uploadId);
    validateCompletionParts(parts);
    const buffers: Buffer[] = [];
    for (const requestedPart of parts) {
      const storedPart = upload.parts.get(requestedPart.partNumber);
      if (
        !storedPart ||
        storedPart.etag !== requestedPart.etag ||
        storedPart.checksumSha256Base64 !== requestedPart.checksumSha256Base64 ||
        storedPart.data.length !== requestedPart.sizeInBytes
      ) {
        throw new Error("The multipart upload parts do not match.");
      }
      buffers.push(storedPart.data);
    }
    const data = Buffer.concat(buffers);
    const checksumSha256Base64 = sha256Base64(data);
    const etag = quoteEtag(createHash("md5").update(data).digest("hex"));
    this.objects.set(key, {
      data,
      contentType: upload.contentType,
      checksumSha256Base64,
      etag
    });
    this.multipartUploads.delete(uploadId);
    return Object.freeze({ etag, checksumSha256Base64 });
  }

  async listMultipartUploadParts(
    key: string,
    uploadId: string
  ): Promise<readonly MultipartUploadPart[]> {
    const upload = requireMultipartUpload(this.multipartUploads, key, uploadId);
    return Object.freeze(
      [...upload.parts.entries()]
        .sort(([left], [right]) => left - right)
        .map(([partNumber, part]) =>
          Object.freeze({
            partNumber,
            etag: part.etag,
            checksumSha256Base64: part.checksumSha256Base64,
            sizeInBytes: part.data.length
          })
        )
    );
  }

  async abortMultipartUpload(key: string, uploadId: string): Promise<void> {
    requireMultipartUpload(this.multipartUploads, key, uploadId);
    this.multipartUploads.delete(uploadId);
  }

  putMemoryObject(key: string, data: Buffer, contentType: string, checksumSha256?: string): void {
    validateKey(key);
    const checksumSha256Base64 =
      checksumSha256 === undefined
        ? sha256Base64(data)
        : /^[0-9a-f]{64}$/iu.test(checksumSha256)
          ? Buffer.from(checksumSha256, "hex").toString("base64")
          : validateSha256Base64(checksumSha256);
    this.objects.set(key, {
      data: Buffer.from(data),
      contentType,
      checksumSha256Base64,
      etag: quoteEtag(createHash("md5").update(data).digest("hex"))
    });
  }

  putMemoryMultipartPart(
    key: string,
    uploadId: string,
    partNumber: number,
    data: Buffer,
    checksumSha256Base64 = sha256Base64(data)
  ): Readonly<{ etag: string; checksumSha256Base64: string }> {
    const upload = requireMultipartUpload(this.multipartUploads, key, uploadId);
    validatePartRequest(partNumber, data.length, checksumSha256Base64);
    const etag = quoteEtag(createHash("md5").update(data).digest("hex"));
    upload.parts.set(partNumber, {
      data: Buffer.from(data),
      checksumSha256Base64,
      etag
    });
    return Object.freeze({ etag, checksumSha256Base64 });
  }
}

function requireMultipartUpload(
  uploads: ReadonlyMap<string, MemoryMultipartUpload>,
  key: string,
  uploadId: string
): MemoryMultipartUpload {
  validateKey(key);
  if (!/^[0-9a-f-]{36}$/iu.test(uploadId)) {
    throw new Error("The multipart upload identifier is invalid.");
  }
  const upload = uploads.get(uploadId);
  if (!upload || upload.key !== key) throw new Error("The multipart upload was not found.");
  return upload;
}

function validateCompletionParts(parts: readonly MultipartUploadPart[]): void {
  if (parts.length < 1 || parts.length > 1_000) {
    throw new Error("The multipart completion list is invalid.");
  }
  for (const [index, part] of parts.entries()) {
    validatePartRequest(part.partNumber, part.sizeInBytes, part.checksumSha256Base64);
    if (part.partNumber !== index + 1 || !/^"[^"\r\n]{1,200}"$/u.test(part.etag)) {
      throw new Error("The multipart completion list is invalid.");
    }
  }
}

function validatePartRequest(
  partNumber: number,
  sizeInBytes: number,
  checksumSha256Base64: string
): void {
  if (!Number.isSafeInteger(partNumber) || partNumber < 1 || partNumber > 1_000) {
    throw new Error("The multipart part number is invalid.");
  }
  if (!Number.isSafeInteger(sizeInBytes) || sizeInBytes < 1 || sizeInBytes > 64 * 1024 * 1024) {
    throw new Error("The multipart part size is invalid.");
  }
  validateSha256Base64(checksumSha256Base64);
}

function validateSha256Base64(value: string): string {
  if (!/^[A-Za-z0-9+/]{43}=$/u.test(value)) {
    throw new Error("The SHA-256 checksum is invalid.");
  }
  return value;
}

function validateKey(value: string): void {
  if (
    value.length < 1 ||
    value.length > 1_024 ||
    value.startsWith("/") ||
    value.includes("\\") ||
    value.split("/").some((segment) => segment === "." || segment === "..") ||
    hasControlCharacters(value)
  ) {
    throw new Error("The storage object key is invalid.");
  }
}

function validateExpiry(value: number, minimum: number, maximum: number): void {
  if (!Number.isSafeInteger(value) || value < minimum || value > maximum) {
    throw new Error("The presigned URL expiry is invalid.");
  }
}

function sha256Base64(value: Uint8Array): string {
  return createHash("sha256").update(value).digest("base64");
}

function quoteEtag(value: string): string {
  return `"${value}"`;
}

function hasControlCharacters(value: string): boolean {
  return [...value].some((character) => {
    const codePoint = character.codePointAt(0) ?? 0;
    return codePoint <= 0x1f || codePoint === 0x7f;
  });
}
