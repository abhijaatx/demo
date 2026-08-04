import {
  AbortMultipartUploadCommand,
  CompleteMultipartUploadCommand,
  CreateMultipartUploadCommand,
  DeleteObjectCommand,
  GetObjectCommand,
  HeadObjectCommand,
  ListPartsCommand,
  PutObjectCommand,
  S3Client,
  UploadPartCommand,
  type S3ClientConfig
} from "@aws-sdk/client-s3";
import { getSignedUrl } from "@aws-sdk/s3-request-presigner";
import type {
  CompletedMultipartUpload,
  MultipartUploadHandle,
  MultipartUploadPart,
  MultipartUploadUrl,
  ObjectStorageAdapter,
  StoredObjectMetadata
} from "@supademo/domain";

export interface S3StorageConfig {
  readonly endpoint?: string;
  readonly bucket: string;
  readonly region: string;
  readonly accessKeyId?: string;
  readonly secretAccessKey?: string;
  readonly forcePathStyle?: boolean;
  readonly serverSideEncryption?: "AES256" | "aws:kms";
  readonly kmsKeyId?: string;
  readonly client?: S3Client;
  readonly presign?: typeof getSignedUrl;
}

export class StorageAdapterError extends Error {
  constructor(
    message = "The object storage request failed.",
    readonly code:
      | "invalid_configuration"
      | "invalid_request"
      | "not_found"
      | "provider_failure" = "provider_failure"
  ) {
    super(message);
    this.name = "StorageAdapterError";
  }
}

export class S3CompatibleStorageAdapter implements ObjectStorageAdapter {
  private readonly bucket: string;
  private readonly client: S3Client;
  private readonly presign: typeof getSignedUrl;
  private readonly serverSideEncryption: "AES256" | "aws:kms";
  private readonly kmsKeyId: string | undefined;

  constructor(config: S3StorageConfig) {
    this.bucket = validateBucket(config.bucket);
    this.serverSideEncryption = config.serverSideEncryption ?? "AES256";
    this.kmsKeyId = validateEncryption(this.serverSideEncryption, config.kmsKeyId);
    this.presign = config.presign ?? getSignedUrl;
    this.client = config.client ?? new S3Client(createClientConfig(config));
  }

  async generateUploadUrl(
    keyInput: string,
    contentTypeInput: string,
    expiresSeconds: number
  ): Promise<{ uploadUrl: string; headers: Record<string, string> }> {
    const key = validateKey(keyInput);
    const contentType = validateContentType(contentTypeInput);
    validateExpiry(expiresSeconds, 60, 900);
    try {
      const command = new PutObjectCommand({
        Bucket: this.bucket,
        Key: key,
        ContentType: contentType,
        ServerSideEncryption: this.serverSideEncryption,
        ...(this.kmsKeyId === undefined ? {} : { SSEKMSKeyId: this.kmsKeyId })
      });
      return Object.freeze({
        uploadUrl: await this.presign(this.client, command, { expiresIn: expiresSeconds }),
        headers: Object.freeze({ "Content-Type": contentType })
      });
    } catch {
      throw new StorageAdapterError();
    }
  }

  async generateDownloadUrl(keyInput: string, expiresSeconds: number): Promise<string> {
    const key = validateKey(keyInput);
    validateExpiry(expiresSeconds, 60, 3_600);
    try {
      return await this.presign(
        this.client,
        new GetObjectCommand({ Bucket: this.bucket, Key: key }),
        { expiresIn: expiresSeconds }
      );
    } catch {
      throw new StorageAdapterError();
    }
  }

  async deleteObject(keyInput: string): Promise<void> {
    const key = validateKey(keyInput);
    try {
      await this.client.send(new DeleteObjectCommand({ Bucket: this.bucket, Key: key }));
    } catch {
      throw new StorageAdapterError();
    }
  }

  async headObject(keyInput: string): Promise<StoredObjectMetadata | null> {
    const key = validateKey(keyInput);
    try {
      const result = await this.client.send(
        new HeadObjectCommand({
          Bucket: this.bucket,
          Key: key,
          ChecksumMode: "ENABLED"
        })
      );
      const sizeInBytes = result.ContentLength;
      if (sizeInBytes === undefined || !Number.isSafeInteger(sizeInBytes) || sizeInBytes < 0) {
        throw new StorageAdapterError();
      }
      return Object.freeze({
        sizeInBytes,
        mimeType: validateContentType(result.ContentType ?? "application/octet-stream"),
        etag: normalizeOptionalEtag(result.ETag),
        checksumSha256Base64: normalizeOptionalChecksum(result.ChecksumSHA256)
      });
    } catch (error) {
      if (isNotFound(error)) return null;
      if (error instanceof StorageAdapterError) throw error;
      throw new StorageAdapterError();
    }
  }

  async getObjectStream(
    keyInput: string,
    signal?: AbortSignal
  ): Promise<AsyncIterable<Uint8Array>> {
    const key = validateKey(keyInput);
    let body: unknown;
    try {
      const result = await this.client.send(
        new GetObjectCommand({ Bucket: this.bucket, Key: key }),
        signal === undefined ? undefined : { abortSignal: signal }
      );
      body = result.Body;
    } catch (error) {
      if (isNotFound(error)) {
        throw new StorageAdapterError("The storage object was not found.", "not_found");
      }
      throw new StorageAdapterError();
    }
    if (!isAsyncIterable(body)) throw new StorageAdapterError();
    return wrapBody(body, signal);
  }

  async createMultipartUpload(
    keyInput: string,
    contentTypeInput: string
  ): Promise<MultipartUploadHandle> {
    const key = validateKey(keyInput);
    const contentType = validateContentType(contentTypeInput);
    try {
      const result = await this.client.send(
        new CreateMultipartUploadCommand({
          Bucket: this.bucket,
          Key: key,
          ContentType: contentType,
          ChecksumAlgorithm: "SHA256",
          ChecksumType: "COMPOSITE",
          ServerSideEncryption: this.serverSideEncryption,
          ...(this.kmsKeyId === undefined ? {} : { SSEKMSKeyId: this.kmsKeyId })
        })
      );
      const uploadId = validateUploadId(result.UploadId);
      return Object.freeze({ uploadId });
    } catch (error) {
      if (error instanceof StorageAdapterError) throw error;
      throw new StorageAdapterError();
    }
  }

  async generateMultipartPartUploadUrl(
    keyInput: string,
    uploadIdInput: string,
    partNumber: number,
    sizeInBytes: number,
    checksumSha256Base64Input: string,
    expiresSeconds: number
  ): Promise<MultipartUploadUrl> {
    const key = validateKey(keyInput);
    const uploadId = validateUploadId(uploadIdInput);
    const checksumSha256Base64 = validateChecksum(checksumSha256Base64Input);
    validatePart(partNumber, sizeInBytes);
    validateExpiry(expiresSeconds, 60, 900);
    try {
      const command = new UploadPartCommand({
        Bucket: this.bucket,
        Key: key,
        UploadId: uploadId,
        PartNumber: partNumber,
        ContentLength: sizeInBytes,
        ChecksumSHA256: checksumSha256Base64
      });
      const uploadUrl = await this.presign(this.client, command, {
        expiresIn: expiresSeconds,
        unhoistableHeaders: new Set(["x-amz-checksum-sha256"])
      });
      return Object.freeze({
        uploadUrl,
        expiresInSeconds: expiresSeconds,
        headers: Object.freeze({ "x-amz-checksum-sha256": checksumSha256Base64 })
      });
    } catch {
      throw new StorageAdapterError();
    }
  }

  async completeMultipartUpload(
    keyInput: string,
    uploadIdInput: string,
    partsInput: readonly MultipartUploadPart[]
  ): Promise<CompletedMultipartUpload> {
    const key = validateKey(keyInput);
    const uploadId = validateUploadId(uploadIdInput);
    const parts = validateCompletionParts(partsInput);
    try {
      const result = await this.client.send(
        new CompleteMultipartUploadCommand({
          Bucket: this.bucket,
          Key: key,
          UploadId: uploadId,
          ChecksumType: "COMPOSITE",
          MpuObjectSize: parts.reduce((total, part) => total + part.sizeInBytes, 0),
          MultipartUpload: {
            Parts: parts.map((part) => ({
              PartNumber: part.partNumber,
              ETag: part.etag,
              ChecksumSHA256: part.checksumSha256Base64
            }))
          }
        })
      );
      return Object.freeze({
        etag: normalizeOptionalEtag(result.ETag),
        checksumSha256Base64: normalizeOptionalChecksum(result.ChecksumSHA256)
      });
    } catch {
      throw new StorageAdapterError();
    }
  }

  async listMultipartUploadParts(
    keyInput: string,
    uploadIdInput: string
  ): Promise<readonly MultipartUploadPart[]> {
    const key = validateKey(keyInput);
    const uploadId = validateUploadId(uploadIdInput);
    const parts: MultipartUploadPart[] = [];
    let marker: string | undefined;
    try {
      do {
        const result = await this.client.send(
          new ListPartsCommand({
            Bucket: this.bucket,
            Key: key,
            UploadId: uploadId,
            ...(marker === undefined ? {} : { PartNumberMarker: marker }),
            MaxParts: 1_000
          })
        );
        for (const part of result.Parts ?? []) {
          const partNumber = part.PartNumber;
          const sizeInBytes = part.Size;
          if (
            partNumber === undefined ||
            sizeInBytes === undefined ||
            part.ETag === undefined ||
            part.ChecksumSHA256 === undefined
          ) {
            throw new StorageAdapterError();
          }
          validatePart(partNumber, sizeInBytes);
          parts.push(
            Object.freeze({
              partNumber,
              sizeInBytes,
              etag: normalizeRequiredEtag(part.ETag),
              checksumSha256Base64: validateChecksum(part.ChecksumSHA256)
            })
          );
          if (parts.length > 1_000) throw new StorageAdapterError();
        }
        if (!result.IsTruncated) break;
        const nextMarker = result.NextPartNumberMarker;
        if (
          nextMarker === undefined ||
          String(nextMarker) === marker ||
          !Number.isSafeInteger(nextMarker)
        ) {
          throw new StorageAdapterError();
        }
        marker = String(nextMarker);
      } while (parts.length <= 1_000);
      return Object.freeze(parts);
    } catch (error) {
      if (error instanceof StorageAdapterError) throw error;
      if (isNotFound(error)) {
        throw new StorageAdapterError("The multipart upload was not found.", "not_found");
      }
      throw new StorageAdapterError();
    }
  }

  async abortMultipartUpload(keyInput: string, uploadIdInput: string): Promise<void> {
    const key = validateKey(keyInput);
    const uploadId = validateUploadId(uploadIdInput);
    try {
      await this.client.send(
        new AbortMultipartUploadCommand({
          Bucket: this.bucket,
          Key: key,
          UploadId: uploadId
        })
      );
    } catch (error) {
      if (isNotFound(error)) return;
      throw new StorageAdapterError();
    }
  }
}

function createClientConfig(config: S3StorageConfig): S3ClientConfig {
  if (!/^[a-z0-9][a-z0-9-]{1,62}$/u.test(config.region)) {
    throw new StorageAdapterError("The object storage region is invalid.", "invalid_configuration");
  }
  const credentials =
    config.accessKeyId === undefined && config.secretAccessKey === undefined
      ? undefined
      : config.accessKeyId && config.secretAccessKey
        ? {
            accessKeyId: config.accessKeyId,
            secretAccessKey: config.secretAccessKey
          }
        : invalidCredentials();
  const endpoint = normalizeEndpoint(config.endpoint);
  return {
    region: config.region,
    ...(endpoint === undefined ? {} : { endpoint }),
    ...(credentials === undefined ? {} : { credentials }),
    forcePathStyle: config.forcePathStyle ?? endpoint !== undefined,
    maxAttempts: 3
  };
}

function invalidCredentials(): never {
  throw new StorageAdapterError(
    "The object storage credentials are incomplete.",
    "invalid_configuration"
  );
}

function normalizeEndpoint(value: string | undefined): string | undefined {
  if (value === undefined) return undefined;
  let endpoint: URL;
  try {
    endpoint = new URL(value);
  } catch {
    throw new StorageAdapterError(
      "The object storage endpoint is invalid.",
      "invalid_configuration"
    );
  }
  if (
    !["http:", "https:"].includes(endpoint.protocol) ||
    endpoint.username ||
    endpoint.password ||
    endpoint.search ||
    endpoint.hash
  ) {
    throw new StorageAdapterError(
      "The object storage endpoint is invalid.",
      "invalid_configuration"
    );
  }
  return endpoint.toString().replace(/\/$/u, "");
}

function validateBucket(value: string): string {
  if (
    value.length < 3 ||
    value.length > 63 ||
    !/^[a-z0-9][a-z0-9.-]*[a-z0-9]$/u.test(value) ||
    value.includes("..")
  ) {
    throw new StorageAdapterError("The object storage bucket is invalid.", "invalid_configuration");
  }
  return value;
}

function validateEncryption(
  encryption: "AES256" | "aws:kms",
  kmsKeyId: string | undefined
): string | undefined {
  if (encryption === "aws:kms") {
    if (!kmsKeyId || kmsKeyId.length > 2_048 || /[\r\n]/u.test(kmsKeyId)) {
      throw new StorageAdapterError(
        "The object storage KMS key is invalid.",
        "invalid_configuration"
      );
    }
    return kmsKeyId;
  }
  if (kmsKeyId !== undefined) {
    throw new StorageAdapterError(
      "A KMS key requires aws:kms encryption.",
      "invalid_configuration"
    );
  }
  return undefined;
}

function validateKey(value: string): string {
  if (
    value.length < 1 ||
    value.length > 1_024 ||
    value.startsWith("/") ||
    value.includes("\\") ||
    value.split("/").some((segment) => segment === "." || segment === "..") ||
    hasControlCharacters(value)
  ) {
    throw new StorageAdapterError("The storage object key is invalid.", "invalid_request");
  }
  return value;
}

function validateContentType(value: string): string {
  if (!/^[a-z0-9][a-z0-9!#$&^_.+-]{0,126}\/[a-z0-9][a-z0-9!#$&^_.+-]{0,126}$/iu.test(value)) {
    throw new StorageAdapterError("The object content type is invalid.", "invalid_request");
  }
  return value.toLowerCase();
}

function validateUploadId(value: string | undefined): string {
  if (!value || value.length > 1_024 || hasControlCharacters(value)) {
    throw new StorageAdapterError("The multipart upload identifier is invalid.", "invalid_request");
  }
  return value;
}

function validatePart(partNumber: number, sizeInBytes: number): void {
  if (!Number.isSafeInteger(partNumber) || partNumber < 1 || partNumber > 1_000) {
    throw new StorageAdapterError("The multipart part number is invalid.", "invalid_request");
  }
  if (!Number.isSafeInteger(sizeInBytes) || sizeInBytes < 1 || sizeInBytes > 64 * 1024 * 1024) {
    throw new StorageAdapterError("The multipart part size is invalid.", "invalid_request");
  }
}

function validateChecksum(value: string): string {
  if (!/^[A-Za-z0-9+/]{43}=$/u.test(value)) {
    throw new StorageAdapterError("The SHA-256 checksum is invalid.", "invalid_request");
  }
  return value;
}

function validateCompletionParts(
  parts: readonly MultipartUploadPart[]
): readonly MultipartUploadPart[] {
  if (parts.length < 1 || parts.length > 1_000) {
    throw new StorageAdapterError("The multipart completion list is invalid.", "invalid_request");
  }
  for (const [index, part] of parts.entries()) {
    validatePart(part.partNumber, part.sizeInBytes);
    validateChecksum(part.checksumSha256Base64);
    if (
      part.partNumber !== index + 1 ||
      part.etag.length < 1 ||
      part.etag.length > 256 ||
      /[\r\n]/u.test(part.etag)
    ) {
      throw new StorageAdapterError("The multipart completion list is invalid.", "invalid_request");
    }
  }
  return parts;
}

function validateExpiry(value: number, minimum: number, maximum: number): void {
  if (!Number.isSafeInteger(value) || value < minimum || value > maximum) {
    throw new StorageAdapterError("The presigned URL expiry is invalid.", "invalid_request");
  }
}

function normalizeOptionalEtag(value: string | undefined): string | null {
  if (value === undefined) return null;
  return normalizeRequiredEtag(value);
}

function normalizeRequiredEtag(value: string): string {
  if (value.length < 1 || value.length > 256 || /[\r\n]/u.test(value)) {
    throw new StorageAdapterError();
  }
  return value;
}

function normalizeOptionalChecksum(value: string | undefined): string | null {
  if (value === undefined) return null;
  const composite = /^([A-Za-z0-9+/]{43}=)(?:-\d{1,4})?$/u.exec(value);
  if (!composite) throw new StorageAdapterError();
  return value;
}

function isAsyncIterable(value: unknown): value is AsyncIterable<unknown> {
  return (
    typeof value === "object" &&
    value !== null &&
    Symbol.asyncIterator in value &&
    typeof (value as { [Symbol.asyncIterator]?: unknown })[Symbol.asyncIterator] === "function"
  );
}

function wrapBody(
  body: AsyncIterable<unknown>,
  signal: AbortSignal | undefined
): AsyncIterable<Uint8Array> {
  return {
    async *[Symbol.asyncIterator]() {
      try {
        for await (const chunk of body) {
          if (signal?.aborted) {
            throw new StorageAdapterError("The storage read was aborted.", "provider_failure");
          }
          if (chunk instanceof Uint8Array) {
            yield chunk;
          } else if (typeof chunk === "string") {
            yield new TextEncoder().encode(chunk);
          } else {
            throw new StorageAdapterError();
          }
        }
      } catch (error) {
        if (error instanceof StorageAdapterError) throw error;
        throw new StorageAdapterError();
      }
    }
  };
}

function isNotFound(error: unknown): boolean {
  if (!error || typeof error !== "object") return false;
  const candidate = error as {
    name?: unknown;
    $metadata?: { httpStatusCode?: unknown };
  };
  return (
    candidate.name === "NotFound" ||
    candidate.name === "NoSuchKey" ||
    candidate.name === "NoSuchUpload" ||
    candidate.$metadata?.httpStatusCode === 404
  );
}

function hasControlCharacters(value: string): boolean {
  return [...value].some((character) => {
    const codePoint = character.codePointAt(0) ?? 0;
    return codePoint <= 0x1f || codePoint === 0x7f;
  });
}
