import assert from "node:assert/strict";
import { test } from "node:test";
import { approveReleaseCandidate } from "@supademo/domain";

test("approveReleaseCandidate generates signed SBOM release candidate approval", () => {
  const approval = approveReleaseCandidate("v1.0.0", "f0a1b2c3d4e5f6");

  assert.equal(approval.releaseVersion, "v1.0.0");
  assert.equal(approval.commitSha, "f0a1b2c3d4e5f6");
  assert.equal(approval.sbomGenerated, true);
  assert.equal(approval.signOffs.length, 4);
  assert.equal(approval.isPassed, true);
});
