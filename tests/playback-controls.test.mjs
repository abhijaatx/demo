import assert from "node:assert/strict";
import { test } from "node:test";
import { calculateNextAutoplayDelay, sanitizeAudienceOutputText } from "@supademo/player";

test("calculateNextAutoplayDelay calculates speed multipliers correctly", () => {
  assert.equal(calculateNextAutoplayDelay(3000, 1.0), 3000);
  assert.equal(calculateNextAutoplayDelay(3000, 2.0), 1500);
  assert.equal(calculateNextAutoplayDelay(3000, 0.5), 6000);
});

test("sanitizeAudienceOutputText hides presenter notes in audience view", () => {
  const notes = "Private notes: Explain ROI metrics here.";

  assert.equal(sanitizeAudienceOutputText(notes, true), null); // audience view -> hidden
  assert.equal(sanitizeAudienceOutputText(notes, false), notes); // presenter view -> visible
});
