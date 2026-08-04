import assert from "node:assert/strict";
import { test } from "node:test";
import { hashSharePassword, verifyShareLinkAccess } from "@supademo/domain";

test("verifyShareLinkAccess enforces password protection and noindex policies", () => {
  const secretPass = "SuperSecret123";
  const passHash = hashSharePassword(secretPass);

  const config = {
    id: "link-1",
    kind: "password",
    token: "tok-123",
    passwordHash: passHash,
    expiresAtIso: null,
    isRevoked: false
  };

  const denied = verifyShareLinkAccess(config, "WrongPass");
  assert.equal(denied.isAllowed, false);
  assert.equal(denied.searchIndexingPolicy, "noindex");

  const allowed = verifyShareLinkAccess(config, secretPass);
  assert.equal(allowed.isAllowed, true);
});

test("verifyShareLinkAccess rejects revoked and expired share links", () => {
  const revokedConfig = {
    id: "link-2",
    kind: "normal",
    token: "tok-456",
    passwordHash: null,
    expiresAtIso: null,
    isRevoked: true
  };

  const res = verifyShareLinkAccess(revokedConfig);
  assert.equal(res.isAllowed, false);
  assert.equal(res.denialReason, "This share link has been revoked.");
});
