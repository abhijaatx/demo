/**
 * RouteHub Viewer Runtime & State Machine — TASK-157
 */

import type { RouteHubJourney } from "./routehub-model.js";

export interface RouteHubSession {
  readonly sessionId: string;
  readonly journeyId: string;
  readonly currentNodeId: string;
  readonly visitedNodeIds: readonly string[];
}

export function createRouteHubSession(
  sessionId: string,
  journey: RouteHubJourney
): RouteHubSession {
  return Object.freeze({
    sessionId,
    journeyId: journey.journeyId,
    currentNodeId: journey.startNodeId,
    visitedNodeIds: Object.freeze([journey.startNodeId])
  });
}

export function transitionRouteHubNode(
  session: RouteHubSession,
  journey: RouteHubJourney,
  targetNodeId: string
): RouteHubSession {
  const currentNode = journey.nodes.find((n) => n.nodeId === session.currentNodeId);
  if (!currentNode || !currentNode.nextNodes.includes(targetNodeId)) {
    throw new Error(`Invalid transition from '${session.currentNodeId}' to '${targetNodeId}'.`);
  }

  return Object.freeze({
    ...session,
    currentNodeId: targetNodeId,
    visitedNodeIds: Object.freeze([...session.visitedNodeIds, targetNodeId])
  });
}
