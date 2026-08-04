import assert from "node:assert/strict";
import { test } from "node:test";
import {
  createDefaultDemoDocument,
  buildBranchingGraphFromDocument,
  validateBranchingGraph
} from "@supademo/domain";

test("buildBranchingGraphFromDocument constructs graph nodes and edges", () => {
  const doc = createDefaultDemoDocument("demo-graph-1");
  const step1 = {
    id: "s-1",
    orderIndex: 0,
    title: "S1",
    media: null,
    hotspots: [],
    callouts: [],
    audioNarration: null
  };
  const step2 = {
    id: "s-2",
    orderIndex: 1,
    title: "S2",
    media: null,
    hotspots: [],
    callouts: [],
    audioNarration: null
  };
  const docWithSteps = { ...doc, steps: [step1, step2] };

  const graph = buildBranchingGraphFromDocument(docWithSteps);
  assert.equal(graph.nodes.length, 2);
  assert.equal(graph.nodes[0].isStartNode, true);
  assert.equal(graph.nodes[1].isTerminalNode, true);
  assert.equal(graph.edges.length, 1);
  assert.equal(graph.edges[0].sourceNodeId, "s-1");
  assert.equal(graph.edges[0].targetNodeId, "s-2");

  const diagnostics = validateBranchingGraph(graph);
  assert.equal(diagnostics.length, 0); // valid sequential graph
});

test("validateBranchingGraph detects unreachable nodes and missing targets", () => {
  const node1 = {
    id: "n1",
    label: "Node 1",
    nodeType: "step",
    isStartNode: true,
    isTerminalNode: false
  };
  const node2 = {
    id: "n2",
    label: "Node 2",
    nodeType: "step",
    isStartNode: false,
    isTerminalNode: true
  };
  const unreached = {
    id: "n3",
    label: "Orphan",
    nodeType: "step",
    isStartNode: false,
    isTerminalNode: false
  };

  const edges = [
    { id: "e1", sourceNodeId: "n1", targetNodeId: "n2", label: "Next" },
    { id: "e2", sourceNodeId: "n1", targetNodeId: "n-missing", label: "Bad Link" }
  ];

  const graph = { nodes: [node1, node2, unreached], edges };
  const diagnostics = validateBranchingGraph(graph);

  assert.equal(
    diagnostics.some((d) => d.code === "MISSING_TARGET_NODE"),
    true
  );
  assert.equal(
    diagnostics.some((d) => d.code === "UNREACHABLE_NODE"),
    true
  );
});
