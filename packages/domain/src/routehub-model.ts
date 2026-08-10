/**
 * RouteHub Declarative Journey Graph Model & Validation — TASK-155
 */

export type RouteHubNodeType = "question" | "demo" | "showcase" | "cta";

export interface RouteHubNode {
  readonly nodeId: string;
  readonly nodeType: RouteHubNodeType;
  readonly title: string;
  readonly nextNodes: readonly string[];
}

export interface RouteHubJourney {
  readonly journeyId: string;
  readonly workspaceId: string;
  readonly startNodeId: string;
  readonly nodes: readonly RouteHubNode[];
}

export function createRouteHubJourney(
  journeyId: string,
  workspaceId: string,
  startNodeId: string,
  nodes: readonly RouteHubNode[] = []
): RouteHubJourney {
  if (!journeyId.trim() || !workspaceId.trim() || !startNodeId.trim()) {
    throw new Error("Journey ID, workspace ID, and start node ID are required.");
  }

  const hasStartNode = nodes.some((n) => n.nodeId === startNodeId);
  if (nodes.length > 0 && !hasStartNode) {
    throw new Error(`Start node ID '${startNodeId}' is not declared in nodes graph.`);
  }

  return Object.freeze({
    journeyId: journeyId.trim(),
    workspaceId: workspaceId.trim(),
    startNodeId: startNodeId.trim(),
    nodes: Object.freeze([...nodes])
  });
}
