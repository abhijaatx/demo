import { randomBytes } from "node:crypto";

export type UuidV7 = string & { readonly __uuidV7: unique symbol };

const maximumUuidV7Timestamp = 0xffffffffffff;
const uuidV7Pattern = /^[0-9a-f]{8}-[0-9a-f]{4}-7[0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/u;

export function createUuidV7(timestampMs = Date.now()): UuidV7 {
  if (
    !Number.isSafeInteger(timestampMs) ||
    timestampMs < 0 ||
    timestampMs > maximumUuidV7Timestamp
  ) {
    throw new RangeError("UUIDv7 timestamp must be a non-negative Unix millisecond value.");
  }

  const bytes = randomBytes(16);
  const timestamp = BigInt(timestampMs);
  for (let index = 0; index < 6; index += 1) {
    const shift = BigInt((5 - index) * 8);
    bytes[index] = Number((timestamp >> shift) & 0xffn);
  }

  bytes[6] = ((bytes[6] ?? 0) & 0x0f) | 0x70;
  bytes[8] = ((bytes[8] ?? 0) & 0x3f) | 0x80;

  const hex = bytes.toString("hex");
  return `${hex.slice(0, 8)}-${hex.slice(8, 12)}-${hex.slice(12, 16)}-${hex.slice(16, 20)}-${hex.slice(20)}` as UuidV7;
}

export function isUuidV7(value: string): value is UuidV7 {
  return uuidV7Pattern.test(value);
}
