import assert from "node:assert/strict";
import { test } from "node:test";
import { createVoiceConsentRecord, revokeVoiceConsent } from "@supademo/domain";

test("createVoiceConsentRecord requires valid HTTPS consent URLs and handles revocation", () => {
  let record = createVoiceConsentRecord("Sarah Connor", "https://legal.company.com/consent.pdf");

  assert.equal(record.speakerName, "Sarah Connor");
  assert.equal(record.isRevoked, false);

  record = revokeVoiceConsent(record);
  assert.equal(record.isRevoked, true);

  assert.throws(
    () => createVoiceConsentRecord("Sarah", "http://insecure.com/consent.pdf"),
    /HTTPS consent document URL/
  );
});
