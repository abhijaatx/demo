/**
 * Enterprise Encrypted Data Export & GDPR Privacy Erasure Workflows — TASK-177
 */

export interface DataExportJob {
  readonly jobId: string;
  readonly workspaceId: string;
  readonly requesterUserId: string;
  readonly status: "pending" | "completed" | "expired";
  readonly downloadUrl?: string | undefined;
}

export function createDataExportJob(
  jobId: string,
  workspaceId: string,
  requesterUserId: string
): DataExportJob {
  if (!jobId.trim() || !workspaceId.trim() || !requesterUserId.trim()) {
    throw new Error("Job ID, workspace ID, and requester user ID are required.");
  }

  return Object.freeze({
    jobId: jobId.trim(),
    workspaceId: workspaceId.trim(),
    requesterUserId: requesterUserId.trim(),
    status: "pending"
  });
}
