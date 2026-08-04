/**
 * Analytics CSV Exporter & Formula Injection Protection — TASK-119
 */

import type { AnalyticsEvent } from "./analytics-contract.js";

export function sanitizeCsvCell(cellValue: string): string {
  if (typeof cellValue !== "string") return String(cellValue);
  const trimmed = cellValue.trim();
  // Prevent CSV formula injection in Excel/Google Sheets (=, +, -, @, \t, \r)
  if (/^[=+\-@\t\r]/.test(trimmed)) {
    return `'${trimmed}`;
  }
  return trimmed;
}

export function generateAnalyticsCsvExport(events: readonly AnalyticsEvent[]): string {
  const headers = ["Event ID", "Demo ID", "Event Kind", "Timestamp ISO", "Metadata"];
  const rows = [headers.join(",")];

  events.forEach((evt) => {
    const eventId = sanitizeCsvCell(evt.eventId);
    const demoId = sanitizeCsvCell(evt.demoId);
    const kind = sanitizeCsvCell(evt.kind);
    const timestampIso = sanitizeCsvCell(new Date(evt.timestampMs).toISOString());
    const metadataJson = sanitizeCsvCell(JSON.stringify(evt.metadata));

    rows.push(
      `"${eventId}","${demoId}","${kind}","${timestampIso}","${metadataJson.replace(/"/g, '""')}"`
    );
  });

  return rows.join("\n");
}
