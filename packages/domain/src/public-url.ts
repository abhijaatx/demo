/**
 * Bounded public-HTTPS URL sanitizer shared by showcase items and embed
 * chapters. Only normalized public HTTPS URLs without credentials, hashes, or
 * private/link-local/metadata hosts are accepted; overlong values are rejected
 * outright (never truncated into a shorter accepted URL).
 */

export const MAX_PUBLIC_URL_LENGTH = 2_048;

function isPrivateHost(host: string): boolean {
  const normalized = host.toLowerCase();
  if (
    normalized === "localhost" ||
    normalized.endsWith(".localhost") ||
    normalized.endsWith(".local") ||
    normalized === "0.0.0.0"
  ) {
    return true;
  }
  // IPv6 literals: loopback, unspecified, ULA (fc/fd), link-local (fe80), and
  // the IPv4-mapped form (::ffff:, which URL parsers normalize to hex such as
  // ::ffff:7f00:1). These checks only apply to hosts that actually contain ":"
  // so public hostnames like fda.gov are never mistaken for IPv6 ULA.
  if (normalized.includes(":")) {
    if (
      normalized === "::" ||
      normalized === "::1" ||
      normalized.startsWith("fc") ||
      normalized.startsWith("fd") ||
      normalized.startsWith("fe80:") ||
      normalized.startsWith("::ffff:")
    ) {
      return true;
    }
  }
  const octets = normalized.split(".").map((part) => Number(part));
  if (
    octets.length !== 4 ||
    !octets.every((part) => Number.isInteger(part) && part >= 0 && part <= 255)
  ) {
    // Reject IPv4-style shorthands such as 127.1 or 10.1 that browsers resolve
    // to private addresses, plus single-token hex spellings like 0x7f000001
    // (loopback). Legitimate public embed hosts are never bare numeric forms.
    return /^\d+(\.\d+)*$/u.test(normalized) || /^0x[0-9a-f]+$/iu.test(normalized);
  }
  const first = octets[0] ?? -1;
  const second = octets[1] ?? -1;
  return (
    first === 10 ||
    first === 127 ||
    (first === 169 && second === 254) ||
    (first === 172 && second >= 16 && second <= 31) ||
    (first === 192 && second === 168)
  );
}

/**
 * Normalize an untrusted value into a public HTTPS URL, or null when it is
 * missing, malformed, overlong, carries credentials, uses a non-HTTPS scheme,
 * or targets a private/link-local/metadata host. Hash fragments are removed.
 */
export function sanitizePublicHttpsUrl(
  value: string | null | undefined,
  maxLength = MAX_PUBLIC_URL_LENGTH
): string | null {
  if (typeof value !== "string") return null;
  const trimmed = value.trim();
  if (!trimmed || trimmed.length > maxLength) return null;
  try {
    const parsed = new URL(trimmed);
    if (parsed.protocol !== "https:" || parsed.username || parsed.password) return null;
    const host = parsed.hostname.toLowerCase().replaceAll("[", "").replaceAll("]", "");
    if (isPrivateHost(host)) return null;
    parsed.hash = "";
    return parsed.toString();
  } catch {
    return null;
  }
}
