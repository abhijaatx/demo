/**
 * Agent Full Configuration & Privacy-Preserving Analytics — TASK-168
 */

export interface AgentFullConfig {
  readonly agentId: string;
  readonly workspaceId: string;
  readonly systemTone: string;
  readonly isPublished: boolean;
}

export interface AgentAnalyticsSummary {
  readonly totalConversations: number;
  readonly leadsQualified: number;
  readonly conversionRatePercent: number;
}

export function createAgentFullConfig(
  agentId: string,
  workspaceId: string,
  systemTone = "helpful"
): AgentFullConfig {
  if (!agentId.trim() || !workspaceId.trim()) {
    throw new Error("Agent ID and workspace ID are required.");
  }

  return Object.freeze({
    agentId: agentId.trim(),
    workspaceId: workspaceId.trim(),
    systemTone: systemTone.trim(),
    isPublished: false
  });
}

export function generateAgentAnalyticsSummary(
  totalConversations: number,
  leadsQualified: number
): AgentAnalyticsSummary {
  const conversionRatePercent =
    totalConversations > 0 ? Math.round((leadsQualified / totalConversations) * 100) : 0;

  return Object.freeze({
    totalConversations,
    leadsQualified,
    conversionRatePercent
  });
}
