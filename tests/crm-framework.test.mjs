import assert from "node:assert/strict";
import { test } from "node:test";
import { createLeadRecord, createCrmSyncConfig, mapLeadToCrmFields } from "@supademo/domain";

test("createCrmSyncConfig and mapLeadToCrmFields transform leads to CRM property payloads", () => {
  const lead = createLeadRecord(
    "ws-1",
    "demo-1",
    "pat@company.com",
    "form-1",
    { firstname: "Pat" },
    95
  );
  const config = createCrmSyncConfig(
    "hubspot",
    "encrypted-token-xyz",
    "encrypted-refresh-abc",
    Date.now() + 3600000,
    { email: "email", intentScore: "hs_intent_score", firstname: "firstname" }
  );

  assert.equal(config.provider, "hubspot");
  assert.equal(config.isConnected, true);

  const mapped = mapLeadToCrmFields(lead, config.fieldMappings);
  assert.equal(mapped["email"], "pat@company.com");
  assert.equal(mapped["hs_intent_score"], 95);
  assert.equal(mapped["firstname"], "Pat");
});
