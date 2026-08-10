/**
 * Outbound Webhook Delivery, SSRF Protection & HMAC Signing — TASK-125
 */

import { createHmac } from "node:crypto";

export interface WebhookSubscription {
  readonly id: string;
  readonly url: string;
  readonly events: readonly string[];
  readonly secret: string;
  readonly isDisabled: boolean;
}

export function validateWebhookUrl(targetUrl: string): boolean {
  try {
    const parsed = new URL(targetUrl);
    if (parsed.protocol !== "https:") return false;

    const host = parsed.hostname.toLowerCase();

    // Rejection list for SSRF protections (localhost, cloud metadata, private IPs)
    const privateHosts = [
      "localhost",
      "127.0.0.1",
      "::1",
      "169.254.169.254", // AWS metadata
      "0.0.0.0"
    ];

    if (privateHosts.includes(host)) return false;
    if (host.startsWith("10.") || host.startsWith("192.168.")) return false;

    return true;
  } catch {
    return false;
  }
}

export function createWebhookSignature(
  payloadJson: string,
  secret: string,
  timestampMs = Date.now()
): string {
  const signature = createHmac("sha256", secret)
    .update(`${timestampMs}.${payloadJson}`)
    .digest("hex");

  return `t=${timestampMs},v1=${signature}`;
}
