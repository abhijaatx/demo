import assert from "node:assert/strict";
import { test } from "node:test";
import { createDefaultDemoDocument, generateBranchingDiagnosticSummary } from "@supademo/domain";

test("generateBranchingDiagnosticSummary computes total nodes, edges, and publishability", () => {
  const doc = createDefaultDemoDocument("demo-branch-1");
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

  const summary = generateBranchingDiagnosticSummary(docWithSteps);
  assert.equal(summary.totalNodes, 2);
  assert.equal(summary.totalEdges, 1);
  assert.equal(summary.isPublishable, true);
  assert.equal(summary.missingTargetCount, 0);
});

test("generateBranchingDiagnosticSummary accepts multiple viewer-selected paths", () => {
  const doc = createDefaultDemoDocument("demo-branch-choices");
  const docWithBranches = {
    ...doc,
    steps: [
      {
        id: "s-1",
        orderIndex: 0,
        title: "Choose a path",
        media: null,
        hotspots: [
          {
            id: "h-linear",
            x: 10,
            y: 10,
            width: 20,
            height: 10,
            targetStepId: "s-2",
            tooltipText: "Continue",
            style: { pulse: true, color: "#4d56e8", opacity: 0.8 }
          },
          {
            id: "h-branch",
            x: 40,
            y: 10,
            width: 20,
            height: 10,
            targetStepId: "s-3",
            tooltipText: "Explore another path",
            style: { pulse: true, color: "#7c5cff", opacity: 0.86 }
          }
        ],
        callouts: [],
        audioNarration: null
      },
      {
        id: "s-2",
        orderIndex: 1,
        title: "Linear destination",
        media: null,
        hotspots: [],
        callouts: [],
        audioNarration: null
      },
      {
        id: "s-3",
        orderIndex: 2,
        title: "Branch destination",
        media: null,
        hotspots: [],
        callouts: [],
        audioNarration: null
      }
    ]
  };

  const summary = generateBranchingDiagnosticSummary(docWithBranches);
  assert.equal(summary.totalNodes, 3);
  assert.equal(summary.totalEdges, 3);
  assert.equal(summary.isPublishable, true);
  assert.equal(summary.unreachableNodeCount, 0);
  assert.equal(summary.missingTargetCount, 0);
});

test("generateBranchingDiagnosticSummary reports chapter CTA branch issues", () => {
  const doc = createDefaultDemoDocument("demo-branch-chapter");
  const chapter = {
    id: "ch-0",
    type: "cta",
    orderIndex: 0,
    title: "Choose",
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
    buttons: [
      {
        id: "b-1",
        label: "Continue",
        actionType: "next",
        targetStepId: null,
        url: null
      },
      {
        id: "b-2",
        label: "Deep dive",
        actionType: "step",
        targetStepId: "s-missing",
        url: null
      },
      {
        id: "b-3",
        label: "External",
        actionType: "url",
        targetStepId: null,
        url: "https://example.com"
      }
    ]
  };
  const docWithChapter = {
    ...doc,
    steps: [
      {
        id: "s-1",
        orderIndex: 0,
        title: "S1",
        media: null,
        hotspots: [],
        callouts: [],
        audioNarration: null
      }
    ],
    chapters: [chapter]
  };

  const summary = generateBranchingDiagnosticSummary(docWithChapter);
  // chapter + 1 step nodes; next + step buttons (URL is not an internal edge)
  assert.equal(summary.totalNodes, 2);
  assert.equal(summary.totalEdges, 2);
  assert.equal(summary.missingTargetCount, 1);
  assert.equal(summary.isPublishable, false);
  assert.ok(
    summary.diagnostics.some((d) => d.code === "MISSING_TARGET_NODE" && d.nodeId === "ch-0")
  );
});

test("generateBranchingDiagnosticSummary flags a start chapter that only has URL buttons", () => {
  const doc = createDefaultDemoDocument("demo-branch-chapter-ext");
  const chapter = {
    id: "ch-ext",
    type: "cta",
    orderIndex: 0,
    title: "External only",
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
    buttons: [
      {
        id: "b-1",
        label: "Book",
        actionType: "url",
        targetStepId: null,
        url: "https://example.com/book"
      }
    ]
  };
  const docWithChapter = {
    ...doc,
    steps: [
      {
        id: "s-1",
        orderIndex: 0,
        title: "S1",
        media: null,
        hotspots: [],
        callouts: [],
        audioNarration: null
      }
    ],
    chapters: [chapter]
  };

  const summary = generateBranchingDiagnosticSummary(docWithChapter);
  assert.equal(summary.totalNodes, 2);
  assert.equal(summary.totalEdges, 0); // URL buttons never become internal edges
  assert.equal(summary.deadEndNodeCount, 1);
  assert.equal(summary.unreachableNodeCount, 1); // the following step is stranded
  assert.equal(summary.isPublishable, false);
});
