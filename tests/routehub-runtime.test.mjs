import assert from "node:assert/strict";
import { test } from "node:test";
import {
  createRouteHubJourney,
  createRouteHubSession,
  transitionRouteHubNode
} from "@supademo/domain";

test("RouteHub runtime state machine transitions deterministically along valid nextNodes", () => {
  const n1 = { nodeId: "n1", nodeType: "question", title: "Role?", nextNodes: ["n2"] };
  const n2 = { nodeId: "n2", nodeType: "demo", title: "Demo", nextNodes: [] };
  const journey = createRouteHubJourney("j-157", "ws-1", "n1", [n1, n2]);

  let session = createRouteHubSession("sess-157", journey);
  assert.equal(session.currentNodeId, "n1");

  session = transitionRouteHubNode(session, journey, "n2");
  assert.equal(session.currentNodeId, "n2");
  assert.equal(session.visitedNodeIds.length, 2);

  assert.throws(() => transitionRouteHubNode(session, journey, "n1"), /Invalid transition/);
});
