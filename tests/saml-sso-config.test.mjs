import assert from "node:assert/strict";
import { test } from "node:test";
import { createSamlProviderConfig } from "@supademo/domain";

test("createSamlProviderConfig sets up SAML provider and validates IdP metadata URL", () => {
  const cfg = createSamlProviderConfig(
    "saml-1",
    "org-1",
    "https://idp.okta.com/metadata",
    "acme.com"
  );

  assert.equal(cfg.providerId, "saml-1");
  assert.equal(cfg.allowedDomain, "acme.com");
  assert.equal(cfg.enforceSso, false);

  assert.throws(
    () => createSamlProviderConfig("saml-2", "org-1", "http://169.254.169.254/meta", "bad.com"),
    /SSRF blocked SAML metadata URL/
  );
});
