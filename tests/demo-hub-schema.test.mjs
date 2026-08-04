import assert from "node:assert/strict";
import { test } from "node:test";
import { createDemoHubConfig } from "@supademo/domain";

test("createDemoHubConfig initializes validated Hub schemas", () => {
  const cat = { categoryId: "cat-1", title: "Getting Started", demoIds: ["d1", "d2"] };
  const hub = createDemoHubConfig("hub-1", "ws-1", "Product Resource Center", [cat]);

  assert.equal(hub.hubId, "hub-1");
  assert.equal(hub.title, "Product Resource Center");
  assert.equal(hub.categories.length, 1);
  assert.equal(hub.isPublished, false);
});
