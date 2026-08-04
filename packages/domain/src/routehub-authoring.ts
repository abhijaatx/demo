/**
 * RouteHub Visual Journey Authoring & Graph Connections Engine — TASK-156
 */

import type { RouteHubJourney, RouteHubNode } from "./routehub-model.js";

export function addNodeToJourney(journey: RouteHubJourney, node: RouteHubNode): RouteHubJourney {
  if (journey.nodes.some((n) => n.nodeId === node.nodeId)) {
    throw new Error(`Node ID '${node.nodeId}' already exists in RouteHub journey.`);
  }

  return Object.freeze({
    ...journey,
    nodes: Object.freeze([...journey.nodes, node])
  });
}

export function connectJourneyNodes(
  journey: RouteHubJourney,
  sourceNodeId: string,
  targetNodeId: string
): RouteHubJourney {
  const sourceIndex = journey.nodes.findIndex((n) => n.nodeId === sourceNodeId);
  const targetExists = journey.nodes.some((n) => n.nodeId === targetNodeId);

  if (sourceIndex === -1 || !targetExists) {
    throw new Error("Source and target nodes must exist in journey.");
  }

  const updatedNodes = [...journey.nodes];
  const sourceNode = updatedNodes[sourceIndex];
  if (!sourceNode) throw new Error("Source node missing");

  if (!sourceNode.nextNodes.includes(targetNodeId)) {
    updatedNodes[sourceIndex] = Object.freeze({
      ...sourceNode,
      nextNodes: Object.freeze([...sourceNode.nextNodes, targetNodeId])
    });
  }

  return Object.freeze({
    ...journey,
    nodes: Object.freeze(updatedNodes)
  });
}
