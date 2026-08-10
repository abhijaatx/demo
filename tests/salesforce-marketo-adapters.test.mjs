import assert from "node:assert/strict";
import { test } from "node:test";
import {
  createLeadRecord,
  formatSalesforceLeadPayload,
  formatMarketoLeadPayload
} from "@supademo/domain";

test("formatSalesforceLeadPayload produces REST API compliant Lead payloads", () => {
  const lead = createLeadRecord(
    "ws-sf",
    "demo-sf",
    "sf-lead@company.com",
    "form-sf",
    { company: "Salesforce Inc" },
    85
  );
  const sfPayload = formatSalesforceLeadPayload(lead);

  assert.equal(sfPayload["Email"], "sf-lead@company.com");
  assert.equal(sfPayload["Company"], "Salesforce Inc");
  assert.equal(sfPayload["Rating"], "Hot");
});

test("formatMarketoLeadPayload produces Marketo REST Sync Lead payloads", () => {
  const lead = createLeadRecord("ws-mk", "demo-mk", "mk-lead@company.com", "form-mk", {}, 40);
  const mkPayload = formatMarketoLeadPayload(lead);

  assert.equal(mkPayload["lookupField"], "email");
  const inputs = mkPayload["input"];
  assert.equal(Array.isArray(inputs), true);
  assert.equal(inputs[0]["email"], "mk-lead@company.com");
});
