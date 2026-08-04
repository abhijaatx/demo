import assert from "node:assert/strict";
import { test } from "node:test";
import { createVideoEditTimeline, calculateTrimmedDuration } from "@supademo/domain";

test("createVideoEditTimeline validates trim start/end and computes duration", () => {
  const timeline = createVideoEditTimeline(60, {
    trimStartSeconds: 5,
    trimEndSeconds: 45,
    aspectRatio: "16:9",
    webcamPlacement: "bottom-right"
  });

  assert.equal(timeline.trimStartSeconds, 5);
  assert.equal(timeline.trimEndSeconds, 45);
  assert.equal(calculateTrimmedDuration(timeline), 40);

  assert.throws(
    () => createVideoEditTimeline(60, { trimStartSeconds: 50, trimEndSeconds: 10 }),
    /start time must be less/
  );
});
