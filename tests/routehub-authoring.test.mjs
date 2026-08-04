import assert from "node:assert/strict";
import { test } from "node:test";
import { createRouteHubJourney, addNodeToJourney, connectJourneyNodes } from "@supademo/domain";

test("addNodeToJourney and connectJourneyNodes manipulate RouteHub graph immutably", () => {
  const n1 = { nodeId: "n1", nodeType: "question", title: "Role?", nextNodes: [] };
  let journey = createRouteHubJourney("j-156", "ws-1", "n1", [n1]);

  const n2 = { nodeId: "n2", nodeType: "demo", title: "Demo A", nextNodes: [] };
  journey = addNodeToJourney(journey, n2);
  assert.equal(journey.nodes.length, 2);

  journey = connectJourneyNodes(journey, "n1", "n2");
  const updatedN1 = journey.nodes.find((n) => n.nodeId === "n1");
  assert.equal(updatedN1?.nextNodes.includes("n2"), true);
});
