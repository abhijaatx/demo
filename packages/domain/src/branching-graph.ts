/**
 * Branching Graph Model & Validation — TASK-073
 *
 * The graph models every branch a viewer can take: chapter CTA buttons and
 * step hotspots. Chapter nodes are inserted into the sequence before the step
 * at their `orderIndex` (chapters render before that step). Documents without
 * chapters keep the exact sequential step contract.
 */

import type { DemoChapter } from "./chapter-model.js";
import type { DemoDocument, DemoStep } from "./demo-document.js";

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

type SequenceEntry =
  | { readonly kind: "step"; readonly step: DemoStep; readonly position: number }
  | { readonly kind: "chapter"; readonly chapter: DemoChapter; readonly position: number };

function isInternalHotspotAction(actionType: DemoHotspotAction): boolean {
  // "open_url" and "none" never produce an internal graph edge. Omitted values
  // keep the legacy linear behavior (treated as an internal navigation).
  return actionType !== "open_url" && actionType !== "none";
}

type DemoHotspotAction = DemoStep["hotspots"][number]["actionType"];

export function buildBranchingGraphFromDocument(document: DemoDocument): BranchGraph {
  // Deterministic sequence: chapters render before the step at their position,
  // so each position emits its chapters (in document order, which is stable
  // after parseDemoDocument's orderIndex sort) followed by the step itself.
  // A chapter whose orderIndex is out of range is clamped to the demo ends.
  const chaptersByPosition = new Map<number, DemoChapter[]>();
  for (const chapter of document.chapters) {
    const position = Math.max(0, Math.min(document.steps.length, Math.floor(chapter.orderIndex)));
    const list = chaptersByPosition.get(position) ?? [];
    list.push(chapter);
    chaptersByPosition.set(position, list);
  }

  const sequence: SequenceEntry[] = [];
  for (let position = 0; position <= document.steps.length; position++) {
    for (const chapter of chaptersByPosition.get(position) ?? []) {
      sequence.push({ kind: "chapter", chapter, position });
    }
    if (position < document.steps.length) {
      sequence.push({ kind: "step", step: document.steps[position]!, position });
    }
  }

  const nodes: BranchNode[] = sequence.map((entry, idx) => {
    const isStartNode = idx === 0;
    const isTerminalNode = idx === sequence.length - 1;
    if (entry.kind === "step") {
      return Object.freeze({
        id: entry.step.id,
        label: `Step ${entry.position + 1}: ${entry.step.title}`,
        nodeType: "step" as const,
        isStartNode,
        isTerminalNode
      });
    }
    return Object.freeze({
      id: entry.chapter.id,
      label: `Chapter: ${entry.chapter.title}`,
      nodeType: "chapter" as const,
      isStartNode,
      isTerminalNode
    });
  });

  const entryId = (entry: SequenceEntry): string =>
    entry.kind === "step" ? entry.step.id : entry.chapter.id;
  const nextSequenceId = (index: number): string | null =>
    sequence[index + 1] ? entryId(sequence[index + 1]!) : null;

  const edges: BranchEdge[] = [];
  sequence.forEach((entry, index) => {
    if (entry.kind === "chapter") {
      const chapter = entry.chapter;
      if (chapter.buttons.length > 0) {
        chapter.buttons.forEach((button, bIdx) => {
          if (button.actionType === "next") {
            const targetId = nextSequenceId(index);
            if (targetId) {
              edges.push(
                Object.freeze({
                  id: `edge-btn-${chapter.id}-${bIdx}`,
                  sourceNodeId: chapter.id,
                  targetNodeId: targetId,
                  label: button.label
                })
              );
            }
          } else if (button.actionType === "step") {
            const targetId = button.targetStepId?.trim() || null;
            // An explicit step target is an internal edge; a missing target is
            // diagnosable through validateBranchingGraph. URL buttons are never
            // internal edges (external/relative URLs are not trusted targets).
            if (targetId) {
              edges.push(
                Object.freeze({
                  id: `edge-btn-${chapter.id}-${bIdx}`,
                  sourceNodeId: chapter.id,
                  targetNodeId: targetId,
                  label: button.label
                })
              );
            }
          }
        });
      } else {
        // Chapters without buttons keep a deterministic sequential edge.
        const targetId = nextSequenceId(index);
        if (targetId) {
          edges.push(
            Object.freeze({
              id: `edge-seq-${chapter.id}`,
              sourceNodeId: chapter.id,
              targetNodeId: targetId,
              label: "Sequential Next"
            })
          );
        }
      }
      return;
    }

    const step = entry.step;
    const nextId = nextSequenceId(index);
    step.hotspots.forEach((hotspot, hIdx) => {
      if (!isInternalHotspotAction(hotspot.actionType)) return;
      const targetId = hotspot.targetStepId ?? nextId ?? null;
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

    // Default sequential transition if step has no internal hotspots.
    if (!step.hotspots.some((hotspot) => isInternalHotspotAction(hotspot.actionType)) && nextId) {
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
