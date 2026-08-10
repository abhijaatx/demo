import assert from "node:assert/strict";
import { test } from "node:test";
import { createRouteHubJourney } from "@supademo/domain";

test("createRouteHubJourney validates start node presence in graph", () => {
  const n1 = { nodeId: "node-1", nodeType: "question", title: "Role?", nextNodes: ["node-2"] };
  const n2 = { nodeId: "node-2", nodeType: "demo", title: "Overview Demo", nextNodes: [] };

  const journey = createRouteHubJourney("j-1", "ws-1", "node-1", [n1, n2]);
  assert.equal(journey.journeyId, "j-1");
  assert.equal(journey.nodes.length, 2);

  assert.throws(
    () => createRouteHubJourney("j-2", "ws-1", "missing-node", [n1]),
    /Start node ID 'missing-node' is not declared/
  );
});
