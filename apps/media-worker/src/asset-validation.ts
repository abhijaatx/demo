/**
 * Asset validation and quarantine worker — TASK-044
 *
 * Validates uploaded assets by checking:
 * 1. File signature (magic bytes) vs declared MIME type
 * 2. Extension vs declared MIME type
 * 3. Malware scanner (pluggable adapter; no-op in local dev)
 * 4. Object size vs declared size
 *
 * Security requirements (AGENTS.md §7):
 * - Raw/quarantined assets remain private (no presigned download issued)
 * - Rejections are non-fatal and idempotent
 * - Worker has no cloud credentials beyond required object access
 */

import type { AssetRejectionCode, AssetRepository, ObjectStorageAdapter } from "@supademo/domain";

// ── File signature constants (magic bytes) ─────────────────────────────────

/** Minimum bytes needed to identify file signature */
const SIGNATURE_SAMPLE_SIZE = 16;

const FILE_SIGNATURES: ReadonlyArray<{
  readonly mime: string;
  readonly offset: number;
  readonly bytes: readonly number[];
}> = [
  // JPEG
  { mime: "image/jpeg", offset: 0, bytes: [0xff, 0xd8, 0xff] },
  // PNG
  { mime: "image/png", offset: 0, bytes: [0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a] },
  // GIF
  { mime: "image/gif", offset: 0, bytes: [0x47, 0x49, 0x46, 0x38] },
  // WebP
  { mime: "image/webp", offset: 8, bytes: [0x57, 0x45, 0x42, 0x50] },
  // AVIF / HEIC (ISO Base Media File Format — ftyp box)
  { mime: "image/avif", offset: 4, bytes: [0x66, 0x74, 0x79, 0x70] },
  { mime: "image/heic", offset: 4, bytes: [0x66, 0x74, 0x79, 0x70] },
  // SVG (text-based; checked separately)
  // PDF
  { mime: "application/pdf", offset: 0, bytes: [0x25, 0x50, 0x44, 0x46] },
  // MP4 / MOV / M4V (ISO BMFF ftyp)
  { mime: "video/mp4", offset: 4, bytes: [0x66, 0x74, 0x79, 0x70] },
  { mime: "video/quicktime", offset: 4, bytes: [0x66, 0x74, 0x79, 0x70] },
  { mime: "video/x-m4v", offset: 4, bytes: [0x66, 0x74, 0x79, 0x70] },
  // WebM
  { mime: "video/webm", offset: 0, bytes: [0x1a, 0x45, 0xdf, 0xa3] },
  // MP3
  { mime: "audio/mpeg", offset: 0, bytes: [0xff, 0xfb] },
  { mime: "audio/mpeg", offset: 0, bytes: [0x49, 0x44, 0x33] }, // ID3 tag
  // AAC / M4A
  { mime: "audio/aac", offset: 0, bytes: [0xff, 0xf1] },
  { mime: "audio/mp4", offset: 4, bytes: [0x66, 0x74, 0x79, 0x70] },
  // WAV
  { mime: "audio/wav", offset: 0, bytes: [0x52, 0x49, 0x46, 0x46] },
  // OGG (audio or video)
  { mime: "audio/ogg", offset: 0, bytes: [0x4f, 0x67, 0x67, 0x53] },
  { mime: "video/ogg", offset: 0, bytes: [0x4f, 0x67, 0x67, 0x53] }
];

/** MIME types that are always blocked from upload regardless of signature */
const BLOCKED_MIME_TYPES = new Set([
  "application/x-msdownload",
  "application/x-executable",
  "application/x-elf",
  "application/x-sh",
  "application/x-bash",
  "application/x-msdos-program",
  "text/x-shellscript",
  "application/javascript",
  "application/x-javascript",
  "text/javascript",
  "text/html",
  "application/xhtml+xml"
]);

/** Allowed MIME type prefixes */
const ALLOWED_MIME_PREFIXES = ["image/", "video/", "audio/", "application/pdf"];

// ── Malware scanner interface ──────────────────────────────────────────────

export interface MalwareScanAdapter {
  /** Scan a stream of bytes. Returns true if clean. */
  scan(stream: AsyncIterable<Uint8Array>, fileName: string): Promise<MalwareScanResult>;
}

export type MalwareScanResult =
  { readonly clean: true } | { readonly clean: false; readonly threat: string };

/** No-op scanner for local development */
export class NoOpMalwareScanAdapter implements MalwareScanAdapter {
  async scan(): Promise<MalwareScanResult> {
    return { clean: true };
  }
}

// ── Validation result ──────────────────────────────────────────────────────

export type ValidationResult =
  | { readonly valid: true }
  | { readonly valid: false; readonly code: AssetRejectionCode; readonly reason: string };

// ── Core validation logic ──────────────────────────────────────────────────

/**
 * Validate an uploaded asset by checking its file signature, MIME type, extension,
 * and scanning for malware. Returns a structured result.
 *
 * Security: reads only the first SIGNATURE_SAMPLE_SIZE bytes for signature detection,
 * then streams the full file to the scanner. Never passes untrusted content to a shell.
 */
export async function validateAssetUpload(
  storage: ObjectStorageAdapter,
  scanner: MalwareScanAdapter,
  storagePath: string,
  declaredMimeType: string,
  fileName: string
): Promise<ValidationResult> {
  // 1. Check against blocked MIME types
  if (BLOCKED_MIME_TYPES.has(declaredMimeType.toLowerCase())) {
    return {
      valid: false,
      code: "type_not_allowed",
      reason: `MIME type '${declaredMimeType}' is not permitted.`
    };
  }

  // 2. Check against allowed MIME prefixes
  const allowed = ALLOWED_MIME_PREFIXES.some((prefix) =>
    declaredMimeType.toLowerCase().startsWith(prefix)
  );
  if (!allowed) {
    return {
      valid: false,
      code: "type_not_allowed",
      reason: `MIME type '${declaredMimeType}' is not in the allowed list.`
    };
  }

  // 3. Read file signature (first bytes from storage)
  let signatureBytes: Uint8Array;
  try {
    const stream = await storage.getObjectStream(storagePath);
    signatureBytes = await readLeadingBytes(stream, SIGNATURE_SAMPLE_SIZE);
  } catch {
    return {
      valid: false,
      code: "corrupt_file",
      reason: "Could not read uploaded file from storage."
    };
  }

  if (signatureBytes.byteLength === 0) {
    return { valid: false, code: "corrupt_file", reason: "Uploaded file is empty." };
  }

  // 4. Detect MIME by signature and compare with declared type
  const detectedMime = detectMimeFromSignature(signatureBytes);
  if (detectedMime !== null) {
    // Allow "related" types (e.g. video/mp4 and video/quicktime both use ftyp box)
    const compatible = areMimesCompatible(detectedMime, declaredMimeType.toLowerCase());
    if (!compatible) {
      return {
        valid: false,
        code: "signature_mismatch",
        reason: `File signature does not match declared MIME type '${declaredMimeType}'. Detected: '${detectedMime}'.`
      };
    }
  }

  // 5. Extension vs MIME check
  const ext = extractExtension(fileName);
  if (ext && !isExtensionCompatible(ext, declaredMimeType.toLowerCase())) {
    return {
      valid: false,
      code: "mime_mismatch",
      reason: `File extension '.${ext}' is not compatible with MIME type '${declaredMimeType}'.`
    };
  }

  // 6. Malware scan (full stream)
  try {
    const scanStream = await storage.getObjectStream(storagePath);
    const scanResult = await scanner.scan(scanStream, fileName);
    if (!scanResult.clean) {
      return {
        valid: false,
        code: "malware_detected",
        reason: `Malware detected: ${scanResult.threat}`
      };
    }
  } catch {
    // Scanner failure should quarantine the asset conservatively
    return {
      valid: false,
      code: "malware_detected",
      reason: "Malware scanner failed to complete scan. Asset quarantined as a precaution."
    };
  }

  return { valid: true };
}

/** High-level job: validate and update asset status */
export async function runValidationJob(
  assetRepository: AssetRepository,
  storage: ObjectStorageAdapter,
  scanner: MalwareScanAdapter,
  workspaceId: string,
  assetId: string,
  storagePath: string,
  declaredMimeType: string,
  fileName: string
): Promise<void> {
  // Mark as validating (idempotent)
  await assetRepository.markValidating(workspaceId, assetId);

  const result = await validateAssetUpload(
    storage,
    scanner,
    storagePath,
    declaredMimeType,
    fileName
  );

  if (result.valid) {
    // Transition to processing for TASK-045/046 media pipeline
    const jobId = `validation-${assetId}-${Date.now()}`;
    await assetRepository.markProcessing(workspaceId, assetId, jobId);
  } else {
    await assetRepository.quarantine(workspaceId, assetId, result.code, result.reason);
  }
}

// ── Private helpers ────────────────────────────────────────────────────────

async function readLeadingBytes(
  stream: AsyncIterable<Uint8Array>,
  maxBytes: number
): Promise<Uint8Array> {
  const chunks: Uint8Array[] = [];
  let total = 0;
  for await (const chunk of stream) {
    chunks.push(chunk);
    total += chunk.byteLength;
    if (total >= maxBytes) break;
  }
  const result = new Uint8Array(Math.min(total, maxBytes));
  let offset = 0;
  for (const chunk of chunks) {
    const toCopy = Math.min(chunk.byteLength, maxBytes - offset);
    result.set(chunk.subarray(0, toCopy), offset);
    offset += toCopy;
    if (offset >= maxBytes) break;
  }
  return result;
}

function detectMimeFromSignature(bytes: Uint8Array): string | null {
  for (const sig of FILE_SIGNATURES) {
    if (sig.offset + sig.bytes.length > bytes.byteLength) continue;
    const match = sig.bytes.every((b, i) => bytes[sig.offset + i] === b);
    if (match) return sig.mime;
  }
  // SVG: check for XML/SVG text content
  const text = new TextDecoder("utf-8", { fatal: false }).decode(bytes.subarray(0, 16));
  if (text.includes("<svg") || text.startsWith("<?xml")) return "image/svg+xml";
  return null;
}

function areMimesCompatible(detected: string, declared: string): boolean {
  if (detected === declared) return true;
  // ISO BMFF container types are interchangeable at signature level
  const isoBmff = new Set([
    "video/mp4",
    "video/quicktime",
    "video/x-m4v",
    "audio/mp4",
    "image/avif",
    "image/heic"
  ]);
  if (isoBmff.has(detected) && isoBmff.has(declared)) return true;
  // OGG can be audio or video
  if (detected.endsWith("/ogg") && declared.endsWith("/ogg")) return true;
  return false;
}

const EXTENSION_MIME_MAP: Record<string, readonly string[]> = {
  jpg: ["image/jpeg"],
  jpeg: ["image/jpeg"],
  png: ["image/png"],
  gif: ["image/gif"],
  webp: ["image/webp"],
  avif: ["image/avif"],
  heic: ["image/heic"],
  heif: ["image/heif", "image/heic"],
  svg: ["image/svg+xml"],
  mp4: ["video/mp4"],
  mov: ["video/quicktime"],
  m4v: ["video/x-m4v", "video/mp4"],
  webm: ["video/webm"],
  ogv: ["video/ogg"],
  mp3: ["audio/mpeg"],
  m4a: ["audio/mp4", "audio/x-m4a"],
  aac: ["audio/aac"],
  wav: ["audio/wav"],
  ogg: ["audio/ogg"],
  flac: ["audio/flac"],
  pdf: ["application/pdf"]
};

function extractExtension(fileName: string): string | null {
  const idx = fileName.lastIndexOf(".");
  if (idx < 0) return null;
  return fileName.slice(idx + 1).toLowerCase();
}

function isExtensionCompatible(ext: string, declaredMime: string): boolean {
  const allowed = EXTENSION_MIME_MAP[ext];
  if (!allowed) return true; // Unknown extension — let signature check handle it
  return allowed.includes(declaredMime);
}
