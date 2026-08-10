import assert from "node:assert/strict";
import { test } from "node:test";
import { createPairingSession, verifyPairingSession, revokePairingSession } from "@supademo/domain";

test("createPairingSession & verifyPairingSession validate pairing codes securely", () => {
  const { session, rawToken } = createPairingSession("ws-pair-1", 10);

  assert.equal(session.pairingCode.length, 6);
  assert.equal(verifyPairingSession(session, session.pairingCode, rawToken), true);
  assert.equal(verifyPairingSession(session, "WRONG1", rawToken), false);

  const revoked = revokePairingSession(session);
  assert.equal(verifyPairingSession(revoked, session.pairingCode, rawToken), false);
});
