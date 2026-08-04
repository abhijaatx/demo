/**
 * Monthly Event Partitioning & SQL Table Generators — TASK-114
 */

export function getPartitionNameForTimestamp(timestampMs: number): string {
  const d = new Date(timestampMs);
  const yyyy = d.getUTCFullYear();
  const mm = String(d.getUTCMonth() + 1).padStart(2, "0");
  return `analytics_events_${yyyy}_${mm}`;
}

export function generatePartitionCreationSql(year: number, month: number): string {
  const mm = String(month).padStart(2, "0");
  const partitionName = `analytics_events_${year}_${mm}`;

  const nextYear = month === 12 ? year + 1 : year;
  const nextMonth = month === 12 ? 1 : month + 1;
  const nextMm = String(nextMonth).padStart(2, "0");

  const startDate = `${year}-${mm}-01 00:00:00+00`;
  const endDate = `${nextYear}-${nextMm}-01 00:00:00+00`;

  return `CREATE TABLE IF NOT EXISTS ${partitionName} PARTITION OF analytics_events FOR VALUES FROM ('${startDate}') TO ('${endDate}');`;
}
