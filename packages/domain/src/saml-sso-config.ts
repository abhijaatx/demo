/**
 * Enterprise SAML 2.0 SSO & Identity Provider Configuration — TASK-173
 */

import { validateWebhookUrl } from "./webhook-infrastructure.js";

export interface SamlProviderConfig {
  readonly providerId: string;
  readonly orgId: string;
  readonly idpMetadataUrl: string;
  readonly allowedDomain: string;
  readonly enforceSso: boolean;
}

export function createSamlProviderConfig(
  providerId: string,
  orgId: string,
  idpMetadataUrl: string,
  allowedDomain: string
): SamlProviderConfig {
  if (!providerId.trim() || !orgId.trim() || !allowedDomain.trim()) {
    throw new Error("Provider ID, org ID, and allowed domain are required.");
  }

  const isValidUrl = validateWebhookUrl(idpMetadataUrl);
  if (!isValidUrl) {
    throw new Error(`SSRF blocked SAML metadata URL: ${idpMetadataUrl}`);
  }

  return Object.freeze({
    providerId: providerId.trim(),
    orgId: orgId.trim(),
    idpMetadataUrl: idpMetadataUrl.trim(),
    allowedDomain: allowedDomain.trim().toLowerCase(),
    enforceSso: false
  });
}
