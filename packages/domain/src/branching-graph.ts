/**
 * Branching Graph Model & Validation — TASK-073
 */

import type { DemoDocument } from "./demo-document.js";

export interface BranchNode {
  readonly id: string;
  readonly label: string;
  readonly nodeType: "step" | "chapter";
  readonly isStartNode: boolean;
  readonly isTerminalNode: boolean;
}

export interface BranchEdge {
  readonly id: string;
  readonly sourceNodeId: string;
  readonly targetNodeId: string;
  readonly label: string;
}

export interface BranchGraph {
  readonly nodes: readonly BranchNode[];
  readonly edges: readonly BranchEdge[];
}

export interface GraphDiagnostic {
  readonly code: "UNREACHABLE_NODE" | "DEAD_END_NODE" | "MISSING_TARGET_NODE";
  readonly nodeId: string;
  readonly message: string;
}

export function buildBranchingGraphFromDocument(document: DemoDocument): BranchGraph {
  const nodes: BranchNode[] = document.steps.map((step, idx) =>
    Object.freeze({
      id: step.id,
      label: `Step ${idx + 1}: ${step.title}`,
      nodeType: "step",
      isStartNode: idx === 0,
      isTerminalNode: idx === document.steps.length - 1
    })
  );

  const edges: BranchEdge[] = [];
  document.steps.forEach((step, idx) => {
    step.hotspots.forEach((hotspot, hIdx) => {
      const targetId = hotspot.targetStepId ?? document.steps[idx + 1]?.id ?? null;
      if (targetId) {
        edges.push(
          Object.freeze({
            id: `edge-${step.id}-${hIdx}`,
            sourceNodeId: step.id,
            targetNodeId: targetId,
            label: hotspot.tooltipText ?? "Next"
          })
        );
      }
    });

    // Default sequential transition if step has no explicit hotspots
    if (step.hotspots.length === 0 && idx < document.steps.length - 1) {
      const nextId = document.steps[idx + 1]!.id;
      edges.push(
        Object.freeze({
          id: `edge-seq-${step.id}`,
          sourceNodeId: step.id,
          targetNodeId: nextId,
          label: "Sequential Next"
        })
      );
    }
  });

  return Object.freeze({
    nodes: Object.freeze(nodes),
    edges: Object.freeze(edges)
  });
}

export function validateBranchingGraph(graph: BranchGraph): readonly GraphDiagnostic[] {
  const nodeMap = new Map(graph.nodes.map((n) => [n.id, n]));
  const incomingCounts = new Map<string, number>();
  const outgoingCounts = new Map<string, number>();

  graph.nodes.forEach((n) => {
    incomingCounts.set(n.id, 0);
    outgoingCounts.set(n.id, 0);
  });

  const diagnostics: GraphDiagnostic[] = [];

  graph.edges.forEach((edge) => {
    if (!nodeMap.has(edge.targetNodeId)) {
      diagnostics.push(
        Object.freeze({
          code: "MISSING_TARGET_NODE",
          nodeId: edge.sourceNodeId,
          message: `Edge targets non-existent node '${edge.targetNodeId}'.`
        })
      );
    } else {
      incomingCounts.set(edge.targetNodeId, (incomingCounts.get(edge.targetNodeId) ?? 0) + 1);
    }
    outgoingCounts.set(edge.sourceNodeId, (outgoingCounts.get(edge.sourceNodeId) ?? 0) + 1);
  });

  // Check unreachable nodes
  graph.nodes.forEach((node) => {
    if (!node.isStartNode && (incomingCounts.get(node.id) ?? 0) === 0) {
      diagnostics.push(
        Object.freeze({
          code: "UNREACHABLE_NODE",
          nodeId: node.id,
          message: `Node '${node.label}' is unreachable (0 incoming connections).`
        })
      );
    }

    if (!node.isTerminalNode && (outgoingCounts.get(node.id) ?? 0) === 0) {
      diagnostics.push(
        Object.freeze({
          code: "DEAD_END_NODE",
          nodeId: node.id,
          message: `Node '${node.label}' is a dead end (0 outgoing connections).`
        })
      );
    }
  });

  return Object.freeze(diagnostics);
}
