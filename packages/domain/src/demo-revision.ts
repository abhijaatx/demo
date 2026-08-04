/**
 * Demo Revisions & Drafts Domain Models — TASK-052
 */

import type { DemoDocument } from "./demo-document.js";

export type DemoDraft = Readonly<{
  demoId: string;
  workspaceId: string;
  document: DemoDocument;
  revisionNumber: number;
  updatedByUserId: string;
  updatedAtIso: string;
}>;

export type DemoRevision = Readonly<{
  id: string;
  demoId: string;
  workspaceId: string;
  revisionNumber: number;
  snapshot: DemoDocument;
  createdByUserId: string;
  message: string | null;
  createdAtIso: string;
}>;

export class DemoRevisionConflictError extends Error {
  constructor(message = "Revision conflict: draft was modified by another request.") {
    super(message);
    this.name = "DemoRevisionConflictError";
  }
}

export class DemoRevisionNotFoundError extends Error {
  constructor(message = "Demo revision not found.") {
    super(message);
    this.name = "DemoRevisionNotFoundError";
  }
}

export interface DemoRevisionRepository {
  getDraft(actorUserId: string, workspaceId: string, demoId: string): Promise<DemoDraft | null>;

  saveDraft(
    actorUserId: string,
    workspaceId: string,
    demoId: string,
    document: DemoDocument,
    expectedRevisionNumber?: number
  ): Promise<DemoDraft>;

  createSnapshot(
    actorUserId: string,
    workspaceId: string,
    demoId: string,
    message?: string
  ): Promise<DemoRevision>;

  listRevisions(
    actorUserId: string,
    workspaceId: string,
    demoId: string,
    limit?: number,
    offset?: number
  ): Promise<readonly DemoRevision[]>;

  restoreRevision(
    actorUserId: string,
    workspaceId: string,
    demoId: string,
    revisionNumber: number
  ): Promise<DemoDraft>;

  compactRevisions(
    actorUserId: string,
    workspaceId: string,
    demoId: string,
    keepCount: number
  ): Promise<number>;
}
