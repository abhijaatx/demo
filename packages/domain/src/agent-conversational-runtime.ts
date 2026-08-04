/**
 * Conversational Agent Runtime & Prompt Sanitization — TASK-164
 */

import { escapeHtml } from "./variable-rendering.js";

export interface AgentMessage {
  readonly messageId: string;
  readonly sender: "user" | "assistant";
  readonly text: string;
  readonly timestampMs: number;
}

export interface AgentSession {
  readonly sessionId: string;
  readonly agentId: string;
  readonly workspaceId: string;
  readonly messages: readonly AgentMessage[];
}

export function createAgentSession(
  sessionId: string,
  agentId: string,
  workspaceId: string
): AgentSession {
  if (!sessionId.trim() || !agentId.trim() || !workspaceId.trim()) {
    throw new Error("Session ID, agent ID, and workspace ID are required.");
  }

  return Object.freeze({
    sessionId: sessionId.trim(),
    agentId: agentId.trim(),
    workspaceId: workspaceId.trim(),
    messages: Object.freeze([])
  });
}

export function appendAgentMessage(
  session: AgentSession,
  sender: "user" | "assistant",
  rawText: string
): AgentSession {
  const cleanText = escapeHtml(rawText.trim());

  const msg: AgentMessage = Object.freeze({
    messageId: `msg_${Math.random().toString(36).slice(2, 10)}`,
    sender,
    text: cleanText,
    timestampMs: Date.now()
  });

  return Object.freeze({
    ...session,
    messages: Object.freeze([...session.messages, msg])
  });
}
