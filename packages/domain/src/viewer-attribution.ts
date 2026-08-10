/**
 * Viewer Sessions, Attribution & Privacy-Conscious Session Tokens — TASK-112
 */

import { randomBytes } from "node:crypto";
import { sanitizeOriginUrl } from "./capture-click-context.js";

export type DeviceTypeCategory = "desktop" | "mobile" | "tablet";

export interface ViewerSessionAttribution {
  readonly sessionId: string;
  readonly demoId: string;
  readonly sourceUrl: string | null;
  readonly referrerUrl: string | null;
  readonly campaignName: string | null;
  readonly deviceType: DeviceTypeCategory;
  readonly startedAtIso: string;
}

export function classifyDeviceType(userAgent: string): DeviceTypeCategory {
  const ua = userAgent.toLowerCase();
  if (ua.includes("ipad") || ua.includes("tablet")) return "tablet";
  if (ua.includes("mobi") || ua.includes("android") || ua.includes("iphone")) return "mobile";
  return "desktop";
}

export function createViewerSessionAttribution(
  demoId: string,
  rawSourceUrl?: string | null,
  rawReferrerUrl?: string | null,
  userAgent = "desktop"
): ViewerSessionAttribution {
  const sourceUrl = rawSourceUrl ? sanitizeOriginUrl(rawSourceUrl) : null;
  const referrerUrl = rawReferrerUrl ? sanitizeOriginUrl(rawReferrerUrl) : null;

  let campaignName: string | null = null;
  if (rawSourceUrl) {
    try {
      const parsed = new URL(rawSourceUrl);
      campaignName = parsed.searchParams.get("utm_campaign") || parsed.searchParams.get("ref");
    } catch {
      // Ignore
    }
  }

  const deviceType = classifyDeviceType(userAgent);

  return Object.freeze({
    sessionId: `vsess-${randomBytes(16).toString("hex")}`,
    demoId,
    sourceUrl,
    referrerUrl,
    campaignName,
    deviceType,
    startedAtIso: new Date().toISOString()
  });
}
