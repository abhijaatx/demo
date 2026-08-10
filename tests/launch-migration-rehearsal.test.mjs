import assert from "node:assert/strict";
import { test } from "node:test";
import { rehearseLaunchAndMigrationSequence } from "@supademo/domain";

test("rehearseLaunchAndMigrationSequence verifies dry-run migration and integrity checks", () => {
  const report = rehearseLaunchAndMigrationSequence();

  assert.equal(report.isPassed, true);
  assert.equal(report.migrationDryRunPassed, true);
  assert.equal(report.integrityChecksVerified, true);
  assert.equal(report.rollbackPlanTested, true);
});
