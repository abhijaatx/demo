import assert from "node:assert/strict";
import { test } from "node:test";
import { createLeadRecord, formatHubSpotContactPayload } from "@supademo/domain";

test("formatHubSpotContactPayload creates compliant HubSpot v3 contact property payloads", () => {
  const lead = createLeadRecord(
    "ws-1",
    "demo-99",
    "hs-lead@example.com",
    "form-hs",
    { company: "Acme" },
    90
  );
  const hsPayload = formatHubSpotContactPayload(lead);

  assert.equal(hsPayload.properties["email"], "hs-lead@example.com");
  assert.equal(hsPayload.properties["supademo_intent_score"], "90");
  assert.equal(hsPayload.properties["supademo_last_demo_id"], "demo-99");
  assert.equal(hsPayload.properties["supademo_form_company"], "Acme");
});
