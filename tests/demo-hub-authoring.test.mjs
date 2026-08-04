import assert from "node:assert/strict";
import { test } from "node:test";
import { createDemoHubConfig, addCategoryToHub, publishDemoHub } from "@supademo/domain";

test("addCategoryToHub and publishDemoHub mutate Hub config immutably and enforce validation", () => {
  let hub = createDemoHubConfig("hub-152", "ws-1", "Resource Hub");
  assert.throws(() => publishDemoHub(hub), /zero categories/);

  const cat = { categoryId: "c1", title: "Overview", demoIds: ["d1"] };
  hub = addCategoryToHub(hub, cat);
  assert.equal(hub.categories.length, 1);

  hub = publishDemoHub(hub);
  assert.equal(hub.isPublished, true);
});
