/**
 * Autosave Manager & Optimistic Concurrency Journal — TASK-056
 */

import type { DemoDocument } from "@supademo/domain";

export type AutosaveStatus = "saved" | "saving" | "offline" | "conflict" | "error";

export interface AutosaveJournalRecord {
  demoId: string;
  document: DemoDocument;
  revisionNumber: number;
  updatedAtIso: string;
}

export interface AutosaveOptions {
  demoId: string;
  workspaceId: string;
  debounceMs?: number;
  saveFn: (
    doc: DemoDocument,
    expectedRevisionNumber: number
  ) => Promise<{ revisionNumber: number }>;
  onStatusChange?: (status: AutosaveStatus, error?: string) => void;
}

const JOURNAL_PREFIX = "supademo_draft_journal_";

export class AutosaveManager {
  private status: AutosaveStatus = "saved";
  private currentDoc: DemoDocument | null = null;
  private currentRevisionNumber = 1;
  private debounceTimer: ReturnType<typeof setTimeout> | null = null;
  private isSaving = false;
  private hasPendingChanges = false;

  constructor(private readonly options: AutosaveOptions) {
    this.restoreLocalJournal();
  }

  getStatus(): AutosaveStatus {
    return this.status;
  }

  getCurrentRevisionNumber(): number {
    return this.currentRevisionNumber;
  }

  setRevisionNumber(num: number): void {
    this.currentRevisionNumber = num;
  }

  scheduleSave(doc: DemoDocument): void {
    this.currentDoc = doc;
    this.hasPendingChanges = true;
    this.saveToLocalJournal(doc);

    if (this.debounceTimer) {
      clearTimeout(this.debounceTimer);
    }

    const debounceMs = this.options.debounceMs ?? 1000;
    this.debounceTimer = setTimeout(() => {
      void this.flush();
    }, debounceMs);
  }

  async flush(): Promise<void> {
    if (this.debounceTimer) {
      clearTimeout(this.debounceTimer);
      this.debounceTimer = null;
    }

    if (!this.hasPendingChanges || !this.currentDoc || this.isSaving) {
      return;
    }

    this.isSaving = true;
    this.setStatus("saving");

    try {
      const result = await this.options.saveFn(this.currentDoc, this.currentRevisionNumber);
      this.currentRevisionNumber = result.revisionNumber;
      this.hasPendingChanges = false;
      this.clearLocalJournal();
      this.setStatus("saved");
    } catch (err: unknown) {
      const errorMessage = err instanceof Error ? err.message : String(err);

      if (errorMessage.includes("conflict") || errorMessage.includes("Revision conflict")) {
        this.setStatus("conflict", errorMessage);
      } else if (errorMessage.includes("offline") || errorMessage.includes("Failed to fetch")) {
        this.setStatus("offline", errorMessage);
      } else {
        this.setStatus("error", errorMessage);
      }
    } finally {
      this.isSaving = false;
      // If changes occurred during save operation, schedule another flush
      if (this.hasPendingChanges) {
        this.scheduleSave(this.currentDoc!);
      }
    }
  }

  private setStatus(status: AutosaveStatus, error?: string): void {
    this.status = status;
    if (this.options.onStatusChange) {
      this.options.onStatusChange(status, error);
    }
  }

  saveToLocalJournal(doc: DemoDocument): void {
    if (typeof localStorage === "undefined") return;
    try {
      const record: AutosaveJournalRecord = {
        demoId: this.options.demoId,
        document: doc,
        revisionNumber: this.currentRevisionNumber,
        updatedAtIso: new Date().toISOString()
      };
      localStorage.setItem(`${JOURNAL_PREFIX}${this.options.demoId}`, JSON.stringify(record));
    } catch {
      // Storage quota or disabled failure should not crash editor
    }
  }

  restoreLocalJournal(): AutosaveJournalRecord | null {
    if (typeof localStorage === "undefined") return null;
    try {
      const raw = localStorage.getItem(`${JOURNAL_PREFIX}${this.options.demoId}`);
      if (!raw) return null;
      return JSON.parse(raw) as AutosaveJournalRecord;
    } catch {
      return null;
    }
  }

  clearLocalJournal(): void {
    if (typeof localStorage === "undefined") return;
    try {
      localStorage.removeItem(`${JOURNAL_PREFIX}${this.options.demoId}`);
    } catch {
      // Ignore
    }
  }
}
