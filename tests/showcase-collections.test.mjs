import assert from "node:assert/strict";
import { test } from "node:test";
import {
  parseDemoShowcase,
  addDemoToShowcase,
  removeDemoFromShowcase,
  reorderShowcaseDemos
} from "@supademo/domain";

test("Showcase operations manage demo collection ordering safely", () => {
  const sc = parseDemoShowcase({
    id: "sc-1",
    title: "Product Overview Collection",
    demoIds: ["d-1", "d-2"]
  });

  assert.equal(sc.demoIds.length, 2);

  const added = addDemoToShowcase(sc, "d-3");
  assert.equal(added.demoIds.length, 3);

  const reordered = reorderShowcaseDemos(added, 0, 2);
  assert.equal(reordered.demoIds[2], "d-1");

  const removed = removeDemoFromShowcase(reordered, "d-2");
  assert.equal(removed.demoIds.length, 2);
  assert.equal(removed.demoIds.includes("d-2"), false);
});
