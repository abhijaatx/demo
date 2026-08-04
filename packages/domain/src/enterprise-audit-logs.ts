/**
 * Enterprise Append-Only Audit Logging & Event Security — TASK-174
 */

export interface EnterpriseAuditEvent {
  readonly eventId: string;
  readonly workspaceId: string;
  readonly actorUserId: string;
  readonly action: string;
  readonly timestampMs: number;
}

export function createEnterpriseAuditEvent(
  eventId: string,
  workspaceId: string,
  actorUserId: string,
  action: string
): EnterpriseAuditEvent {
  if (!eventId.trim() || !workspaceId.trim() || !actorUserId.trim() || !action.trim()) {
    throw new Error("Event ID, workspace ID, actor user ID, and action are required.");
  }

  return Object.freeze({
    eventId: eventId.trim(),
    workspaceId: workspaceId.trim(),
    actorUserId: actorUserId.trim(),
    action: action.trim(),
    timestampMs: Date.now()
  });
}
