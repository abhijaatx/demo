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

function chapterFixture(overrides) {
  return {
    id: "ch-1",
    type: "cta",
    orderIndex: 0,
    title: "Chapter",
    bodyText: null,
    mediaAssetId: null,
    mediaUrl: null,
    presenterNotes: null,
    layout: "center",
    theme: "light",
    backgroundColor: null,
    opacity: 1,
    blurPx: 0,
    voiceover: null,
    form: null,
    buttons: [],
    ...overrides
  };
}

function stepFixture(id, orderIndex, title, extra = {}) {
  return {
    id,
    orderIndex,
    title,
    media: null,
    hotspots: [],
    callouts: [],
    audioNarration: null,
    ...extra
  };
}

test("buildBranchingGraphFromDocument represents chapter CTA buttons as internal edges only", () => {
  const doc = createDefaultDemoDocument("demo-chapter-branch");
  const chapter = chapterFixture({
    id: "ch-0",
    orderIndex: 0,
    title: "Choose a path",
    buttons: [
      { id: "b-1", label: "Continue", actionType: "next", targetStepId: null, url: null },
      { id: "b-2", label: "Deep dive", actionType: "step", targetStepId: "s-3", url: null },
      {
        id: "b-3",
        label: "External",
        actionType: "url",
        targetStepId: null,
        url: "https://example.com/book"
      }
    ]
  });
  const docWithChapter = {
    ...doc,
    steps: [
      stepFixture("s-1", 0, "Start"),
      stepFixture("s-2", 1, "Linear"),
      stepFixture("s-3", 2, "Deep dive")
    ],
    chapters: [chapter]
  };

  const graph = buildBranchingGraphFromDocument(docWithChapter);

  assert.equal(graph.nodes.length, 4); // chapter + 3 steps
  assert.equal(graph.nodes[0].nodeType, "chapter");
  assert.equal(graph.nodes[0].id, "ch-0");
  assert.equal(graph.nodes[0].isStartNode, true);
  assert.equal(graph.nodes[3].isTerminalNode, true);

  // The URL button is never an internal edge; next and step buttons are.
  const chapterEdges = graph.edges.filter((edge) => edge.sourceNodeId === "ch-0");
  assert.equal(chapterEdges.length, 2);
  assert.deepEqual(chapterEdges.map((edge) => edge.targetNodeId).sort(), ["s-1", "s-3"]);
  assert.equal(chapterEdges[0].label, "Continue");

  // Sequential steps remain reachable through their default edges.
  assert.ok(graph.edges.some((edge) => edge.sourceNodeId === "s-1" && edge.targetNodeId === "s-2"));
  assert.ok(graph.edges.some((edge) => edge.sourceNodeId === "s-2" && edge.targetNodeId === "s-3"));

  assert.equal(validateBranchingGraph(graph).length, 0);
});

test("buildBranchingGraphFromDocument falls back to a sequential edge through a button-less chapter", () => {
  const doc = createDefaultDemoDocument("demo-chapter-seq");
  const chapter = chapterFixture({ id: "ch-1", orderIndex: 1, title: "Context between steps" });
  const docWithChapter = {
    ...doc,
    steps: [stepFixture("s-1", 0, "S1"), stepFixture("s-2", 1, "S2")],
    chapters: [chapter]
  };

  const graph = buildBranchingGraphFromDocument(docWithChapter);

  assert.equal(graph.nodes.length, 3);
  assert.deepEqual(
    graph.nodes.map((node) => node.id),
    ["s-1", "ch-1", "s-2"]
  );
  assert.ok(
    graph.edges.some((edge) => edge.sourceNodeId === "s-1" && edge.targetNodeId === "ch-1")
  );
  assert.ok(
    graph.edges.some((edge) => edge.sourceNodeId === "ch-1" && edge.targetNodeId === "s-2")
  );
  assert.equal(validateBranchingGraph(graph).length, 0);
});

test("validateBranchingGraph flags missing chapter targets and unreachable/dead-end chapters", () => {
  const doc = createDefaultDemoDocument("demo-chapter-broken");
  const steps = [stepFixture("s-1", 0, "S1")];
  const brokenTarget = chapterFixture({
    id: "ch-broken",
    orderIndex: 0,
    title: "Broken branch",
    buttons: [
      { id: "b-1", label: "Go nowhere", actionType: "step", targetStepId: "s-missing", url: null }
    ]
  });
  const externalOnly = chapterFixture({
    id: "ch-ext",
    orderIndex: 0,
    title: "External only",
    buttons: [
      {
        id: "b-2",
        label: "Book",
        actionType: "url",
        targetStepId: null,
        url: "https://example.com"
      }
    ]
  });

  const graph1 = buildBranchingGraphFromDocument({ ...doc, steps, chapters: [brokenTarget] });
  const diagnostics1 = validateBranchingGraph(graph1);
  assert.equal(
    diagnostics1.some((d) => d.code === "MISSING_TARGET_NODE" && d.nodeId === "ch-broken"),
    true
  );

  // A start chapter whose only button is an external URL has no internal path:
  // it is a dead end and the following step becomes unreachable.
  const graph2 = buildBranchingGraphFromDocument({ ...doc, steps, chapters: [externalOnly] });
  const diagnostics2 = validateBranchingGraph(graph2);
  assert.equal(
    diagnostics2.some((d) => d.code === "DEAD_END_NODE" && d.nodeId === "ch-ext"),
    true
  );
  assert.equal(
    diagnostics2.some((d) => d.code === "UNREACHABLE_NODE" && d.nodeId === "s-1"),
    true
  );
});

test("buildBranchingGraphFromDocument keeps open_url and none hotspots out of internal edges", () => {
  const doc = createDefaultDemoDocument("demo-hotspot-actions");
  const step1 = stepFixture("s-1", 0, "S1", {
    hotspots: [
      {
        id: "h-ext",
        x: 10,
        y: 10,
        width: 20,
        height: 10,
        targetStepId: null,
        tooltipText: "External",
        actionType: "open_url",
        url: "https://example.com",
        style: { pulse: true, color: "#4d56e8", opacity: 0.8 }
      },
      {
        id: "h-none",
        x: 40,
        y: 10,
        width: 20,
        height: 10,
        targetStepId: null,
        tooltipText: "Pause",
        actionType: "none",
        style: { pulse: true, color: "#4d56e8", opacity: 0.8 }
      },
      {
        id: "h-internal",
        x: 60,
        y: 10,
        width: 20,
        height: 10,
        targetStepId: "s-2",
        tooltipText: "Continue",
        style: { pulse: true, color: "#4d56e8", opacity: 0.8 }
      }
    ]
  });
  const docWithSteps = {
    ...doc,
    steps: [step1, stepFixture("s-2", 1, "S2")]
  };

  const graph = buildBranchingGraphFromDocument(docWithSteps);
  const stepEdges = graph.edges.filter((edge) => edge.sourceNodeId === "s-1");
  assert.equal(stepEdges.length, 1); // only the internal hotspot
  assert.equal(stepEdges[0].targetNodeId, "s-2");
  assert.equal(stepEdges[0].label, "Continue");
  assert.equal(validateBranchingGraph(graph).length, 0);
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
