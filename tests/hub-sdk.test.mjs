import assert from "node:assert/strict";
import { test } from "node:test";
import { createHubSdkOptions, toggleHubWidget } from "@supademo/domain";

test("createHubSdkOptions & toggleHubWidget manage SDK widget mount options", () => {
  let opts = createHubSdkOptions("hub-153");

  assert.equal(opts.hubId, "hub-153");
  assert.equal(opts.isOpen, false);

  opts = toggleHubWidget(opts);
  assert.equal(opts.isOpen, true);
});
