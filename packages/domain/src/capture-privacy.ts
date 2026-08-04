/**
 * Capture Privacy Rules, Domain Allow/Deny & Masking Rules — TASK-097
 */

export interface CapturePrivacyPolicy {
  readonly allowedDomains: readonly string[];
  readonly deniedDomains: readonly string[];
  readonly excludedCssSelectors: readonly string[];
  readonly maskInputFields: boolean;
}

export function isUrlAllowedForCapture(targetUrl: string, policy: CapturePrivacyPolicy): boolean {
  try {
    const parsed = new URL(targetUrl);
    const hostname = parsed.hostname.toLowerCase();

    // Deny takes precedence
    if (policy.deniedDomains.some((d) => hostname.endsWith(d.toLowerCase()))) {
      return false;
    }

    if (policy.allowedDomains.length > 0) {
      return policy.allowedDomains.some((a) => hostname.endsWith(a.toLowerCase()));
    }

    return true;
  } catch {
    return false;
  }
}

export function shouldMaskElementHint(
  elementHint: string | null,
  policy: CapturePrivacyPolicy
): boolean {
  if (!elementHint) return false;
  const hint = elementHint.toLowerCase();

  if (
    policy.maskInputFields &&
    (hint.includes("input") || hint.includes("password") || hint.includes("card"))
  ) {
    return true;
  }

  return policy.excludedCssSelectors.some((sel) => hint.includes(sel.toLowerCase()));
}
