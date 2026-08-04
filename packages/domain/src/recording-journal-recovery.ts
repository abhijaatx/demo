/**
 * Local Recording Journal Persistence & Service-Worker Recovery — TASK-098
 */

import type { RecordingSessionState } from "./recording-session.js";

const JOURNAL_PREFIX = "supademo_rec_journal_";

export function saveRecordingJournalDraft(session: RecordingSessionState): void {
  if (typeof localStorage === "undefined") return;
  try {
    localStorage.setItem(`${JOURNAL_PREFIX}${session.id}`, JSON.stringify(session));
  } catch {
    // Ignore storage quota errors
  }
}

export function loadRecordingJournalDraft(sessionId: string): RecordingSessionState | null {
  if (typeof localStorage === "undefined") return null;
  try {
    const raw = localStorage.getItem(`${JOURNAL_PREFIX}${sessionId}`);
    if (!raw) return null;
    return JSON.parse(raw);
  } catch {
    return null;
  }
}

export function clearRecordingJournalDraft(sessionId: string): void {
  if (typeof localStorage === "undefined") return;
  try {
    localStorage.removeItem(`${JOURNAL_PREFIX}${sessionId}`);
  } catch {
    // Ignore
  }
}
