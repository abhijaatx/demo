/**
 * Branching Authoring & Diagnostics Summary — TASK-074
 */

import {
  buildBranchingGraphFromDocument,
  validateBranchingGraph,
  type GraphDiagnostic
} from "./branching-graph.js";
import type { DemoDocument } from "./demo-document.js";

export interface BranchingDiagnosticSummary {
  readonly totalNodes: number;
  readonly totalEdges: number;
  readonly unreachableNodeCount: number;
  readonly deadEndNodeCount: number;
  readonly missingTargetCount: number;
  readonly isPublishable: boolean;
  readonly diagnostics: readonly GraphDiagnostic[];
}

export function generateBranchingDiagnosticSummary(
  document: DemoDocument
): BranchingDiagnosticSummary {
  const graph = buildBranchingGraphFromDocument(document);
  const diagnostics = validateBranchingGraph(graph);

  let unreachableNodeCount = 0;
  let deadEndNodeCount = 0;
  let missingTargetCount = 0;

  diagnostics.forEach((d) => {
    if (d.code === "UNREACHABLE_NODE") unreachableNodeCount++;
    if (d.code === "DEAD_END_NODE") deadEndNodeCount++;
    if (d.code === "MISSING_TARGET_NODE") missingTargetCount++;
  });

  // Graph is publishable if there are no missing targets or unreachable nodes
  const isPublishable = missingTargetCount === 0 && unreachableNodeCount === 0;

  return Object.freeze({
    totalNodes: graph.nodes.length,
    totalEdges: graph.edges.length,
    unreachableNodeCount,
    deadEndNodeCount,
    missingTargetCount,
    isPublishable,
    diagnostics
  });
}
