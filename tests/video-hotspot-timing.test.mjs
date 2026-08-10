import assert from "node:assert/strict";
import { test } from "node:test";
import {
  clampVideoHotspotTime,
  findCrossedPauseHotspots,
  isDemoHotspotVisibleAtTime,
  MAX_VIDEO_HOTSPOT_TIME_SECONDS,
  parseDemoHotspotTiming,
  pauseHotspotIdsBeforeTime,
  resolveTimelineEdgeDrag
} from "@supademo/domain";

test("parseDemoHotspotTiming accepts bounded pause and duration timing", () => {
  assert.deepEqual(parseDemoHotspotTiming({ kind: "pause", startSeconds: 2.5, endSeconds: 9 }), {
    kind: "pause",
    startSeconds: 2.5,
    endSeconds: null
  });
  assert.deepEqual(parseDemoHotspotTiming({ kind: "duration", startSeconds: 3, endSeconds: 5 }), {
    kind: "duration",
    startSeconds: 3,
    endSeconds: 5
  });
  assert.equal(MAX_VIDEO_HOTSPOT_TIME_SECONDS, 7_200);
});

test("parseDemoHotspotTiming rejects malformed and unbounded timing", () => {
  const invalid = [
    null,
    { kind: "unknown", startSeconds: 1 },
    { kind: "pause", startSeconds: "1" },
    { kind: "pause", startSeconds: Number.NaN },
    { kind: "pause", startSeconds: Number.POSITIVE_INFINITY },
    { kind: "pause", startSeconds: -1 },
    { kind: "pause", startSeconds: 7_201 },
    { kind: "duration", startSeconds: 2, endSeconds: 2 },
    { kind: "duration", startSeconds: 2, endSeconds: Number.POSITIVE_INFINITY },
    { kind: "duration", startSeconds: 2, endSeconds: 7_201 }
  ];
  for (const value of invalid) assert.equal(parseDemoHotspotTiming(value), null);
});

test("duration hotspots use a half-open visibility window and legacy hotspots remain visible", () => {
  const legacy = { id: "legacy" };
  const duration = {
    id: "duration",
    timing: { kind: "duration", startSeconds: 2, endSeconds: 4 }
  };
  const pause = {
    id: "pause",
    timing: { kind: "pause", startSeconds: 3, endSeconds: null }
  };

  assert.equal(isDemoHotspotVisibleAtTime(legacy, Number.NaN), true);
  assert.equal(isDemoHotspotVisibleAtTime(duration, 1.99), false);
  assert.equal(isDemoHotspotVisibleAtTime(duration, 2), true);
  assert.equal(isDemoHotspotVisibleAtTime(duration, 3.99), true);
  assert.equal(isDemoHotspotVisibleAtTime(duration, 4), false);
  assert.equal(isDemoHotspotVisibleAtTime(pause, 3, new Set()), false);
  assert.equal(isDemoHotspotVisibleAtTime(pause, 3, new Set(["pause"])), true);
});

test("findCrossedPauseHotspots returns the earliest untriggered timestamp group", () => {
  const hotspots = [
    {
      id: "duration",
      timing: { kind: "duration", startSeconds: 1, endSeconds: 5 }
    },
    {
      id: "pause-b",
      timing: { kind: "pause", startSeconds: 2, endSeconds: null }
    },
    {
      id: "pause-a",
      timing: { kind: "pause", startSeconds: 2, endSeconds: null }
    },
    {
      id: "pause-later",
      timing: { kind: "pause", startSeconds: 3, endSeconds: null }
    }
  ];

  assert.deepEqual(
    findCrossedPauseHotspots(hotspots, 0, 3.5).map((hotspot) => hotspot.id),
    ["pause-a", "pause-b"]
  );
  assert.deepEqual(
    findCrossedPauseHotspots(hotspots, 0, 3.5, new Set(["pause-a", "pause-b"])).map(
      (hotspot) => hotspot.id
    ),
    ["pause-later"]
  );
  assert.deepEqual(findCrossedPauseHotspots(hotspots, 3.5, 1), []);
});

test("pauseHotspotIdsBeforeTime rearms cues at and after an explicit seek", () => {
  const hotspots = [
    { id: "at-one", timing: { kind: "pause", startSeconds: 1, endSeconds: null } },
    { id: "at-three", timing: { kind: "pause", startSeconds: 3, endSeconds: null } },
    { id: "duration", timing: { kind: "duration", startSeconds: 1, endSeconds: 5 } }
  ];

  assert.deepEqual(pauseHotspotIdsBeforeTime(hotspots, 3), ["at-one"]);
  assert.deepEqual(pauseHotspotIdsBeforeTime(hotspots, 0), []);
});

test("playback does not repeatedly pause on an already triggered cue without a new seek", () => {
  const hotspots = [
    { id: "cue-a", timing: { kind: "pause", startSeconds: 2, endSeconds: null } },
    { id: "cue-b", timing: { kind: "pause", startSeconds: 3, endSeconds: null } }
  ];
  const triggered = new Set(["cue-a"]);
  // Resuming from the pause point re-crosses cue-a but it stays consumed.
  assert.deepEqual(findCrossedPauseHotspots(hotspots, 2, 2.5, triggered), []);
  // Only the still-untriggered later cue fires after a real seek forward.
  assert.deepEqual(
    findCrossedPauseHotspots(hotspots, 0, 3.5, new Set(["cue-a"])).map((cue) => cue.id),
    ["cue-b"]
  );
});

test("clampVideoHotspotTime bounds malformed timeline clicks and drags", () => {
  assert.equal(clampVideoHotspotTime(-5, 10), 0);
  assert.equal(clampVideoHotspotTime(Number.NaN, 10), 0);
  assert.equal(clampVideoHotspotTime(Number.POSITIVE_INFINITY, 10), 10);
  assert.equal(clampVideoHotspotTime(12, 10), 10);
  assert.equal(clampVideoHotspotTime(4.25, 10), 4.25);
  assert.equal(clampVideoHotspotTime(4.25, Number.NaN), 4.25);
  assert.equal(clampVideoHotspotTime(99_999, Number.NaN), MAX_VIDEO_HOTSPOT_TIME_SECONDS);
});

test("dragging the edges of a pause cue converts it into a duration cue", () => {
  const pause = parseDemoHotspotTiming({ kind: "pause", startSeconds: 4, endSeconds: null });
  assert.deepEqual(resolveTimelineEdgeDrag(pause, "end", 9, 30), {
    kind: "duration",
    startSeconds: 4,
    endSeconds: 9
  });
  assert.deepEqual(resolveTimelineEdgeDrag(pause, "start", 1.5, 30), {
    kind: "duration",
    startSeconds: 1.5,
    endSeconds: 4
  });
});

test("edge drags stay bounded and keep a valid half-open window", () => {
  const pause = parseDemoHotspotTiming({ kind: "pause", startSeconds: 4, endSeconds: null });
  const duration = parseDemoHotspotTiming({
    kind: "duration",
    startSeconds: 3,
    endSeconds: 7
  });

  // Right edge dragged before the anchor keeps a minimal forward window.
  const minimalForward = resolveTimelineEdgeDrag(pause, "end", 2, 30);
  assert.equal(minimalForward.kind, "duration");
  assert.equal(minimalForward.startSeconds, 4);
  assert.ok(minimalForward.endSeconds > minimalForward.startSeconds);

  // Left edge dragged past the anchor keeps a minimal backward window.
  const minimalBackward = resolveTimelineEdgeDrag(pause, "start", 8, 30);
  assert.equal(minimalBackward.kind, "duration");
  assert.ok(minimalBackward.endSeconds > minimalBackward.startSeconds);

  // Duration end edge clamps to the video length; start edge clamps to end.
  assert.deepEqual(resolveTimelineEdgeDrag(duration, "end", 99, 30), {
    kind: "duration",
    startSeconds: 3,
    endSeconds: 30
  });
  assert.deepEqual(resolveTimelineEdgeDrag(duration, "start", 99, 30), {
    kind: "duration",
    startSeconds: 6.99,
    endSeconds: 7
  });
  assert.deepEqual(resolveTimelineEdgeDrag(duration, "start", -5, 30), {
    kind: "duration",
    startSeconds: 0,
    endSeconds: 7
  });

  // A stale cue cannot escape the current video's shorter duration.
  const shortenedVideo = resolveTimelineEdgeDrag(duration, "start", -5, 0.5);
  assert.equal(shortenedVideo.endSeconds, 0.5);
  assert.ok(shortenedVideo.startSeconds < shortenedVideo.endSeconds);

  // Non-finite drag targets collapse to safe bounds and stay valid.
  for (const target of [Number.NaN, Number.POSITIVE_INFINITY, Number.NEGATIVE_INFINITY]) {
    const next = resolveTimelineEdgeDrag(duration, "end", target, 30);
    assert.deepEqual(next, {
      kind: "duration",
      startSeconds: 3,
      endSeconds: target > 0 ? 30 : 3.01
    });
    assert.equal(parseDemoHotspotTiming(next).kind, "duration");
  }

  // Anchors at the timeline edge cannot collapse into an invalid window.
  const atEnd = parseDemoHotspotTiming({ kind: "pause", startSeconds: 30, endSeconds: null });
  assert.deepEqual(resolveTimelineEdgeDrag(atEnd, "end", 29, 30), atEnd);
  const atStart = parseDemoHotspotTiming({ kind: "pause", startSeconds: 0, endSeconds: null });
  assert.deepEqual(resolveTimelineEdgeDrag(atStart, "start", 1, 30), atStart);
});

test("every resolved edge drag result parses as valid timing", () => {
  const cases = [
    {
      timing: { kind: "pause", startSeconds: 4, endSeconds: null },
      edge: "end",
      target: 9,
      duration: 30
    },
    {
      timing: { kind: "pause", startSeconds: 4, endSeconds: null },
      edge: "start",
      target: 1,
      duration: 30
    },
    {
      timing: { kind: "duration", startSeconds: 3, endSeconds: 7 },
      edge: "end",
      target: 6,
      duration: 30
    },
    {
      timing: { kind: "duration", startSeconds: 3, endSeconds: 7 },
      edge: "start",
      target: 5,
      duration: 30
    },
    {
      timing: { kind: "duration", startSeconds: 3, endSeconds: 7 },
      edge: "end",
      target: 99_999,
      duration: Number.NaN
    },
    {
      timing: { kind: "duration", startSeconds: 3, endSeconds: 7 },
      edge: "start",
      target: -5,
      duration: 0.5
    }
  ];
  for (const entry of cases) {
    const next = resolveTimelineEdgeDrag(entry.timing, entry.edge, entry.target, entry.duration);
    assert.deepEqual(parseDemoHotspotTiming(next), next, JSON.stringify(entry));
  }
});
