import assert from "node:assert/strict";
import { test } from "node:test";
import { createPlayerEvent, emitEmbedEvent, isSupaDemoEmbedEvent } from "@supademo/player";

test("emitEmbedEvent and isSupaDemoEmbedEvent handle cross-window postMessage contracts safely", () => {
  let posted = null;
  const mockWin = {
    postMessage: (msg) => {
      posted = msg;
    }
  };

  const event = createPlayerEvent("COMPLETION", "demo-em-1", { durationMs: 12000 });
  emitEmbedEvent(mockWin, "*", event);

  assert.ok(posted);
  assert.equal(isSupaDemoEmbedEvent(posted), true);

  const fakeMessage = { type: "random", event: { v: 1 } };
  assert.equal(isSupaDemoEmbedEvent(fakeMessage), false);
});
