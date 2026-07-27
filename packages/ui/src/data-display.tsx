"use client";

import { useCallback, useMemo, useState } from "react";
import type { CSSProperties, ReactNode } from "react";

type ClassNameProps = { className?: string | undefined };
export type RowId = string | number;

function cx(...values: Array<string | false | null | undefined>): string | undefined {
  const result = values.filter(Boolean).join(" ");
  return result || undefined;
}

function clampInteger(value: number, min: number, max: number): number {
  if (!Number.isFinite(value)) return min;
  return Math.min(max, Math.max(min, Math.floor(value)));
}

export type SortDirection = "ascending" | "descending";

export type SortState<TKey extends string = string> = {
  key: TKey;
  direction: SortDirection;
};

export function useTableSort<TKey extends string>(initial?: SortState<TKey> | undefined) {
  const [sort, setSort] = useState<SortState<TKey> | undefined>(initial);
  const toggleSort = useCallback((key: TKey): void => {
    setSort((current) => ({
      key,
      direction:
        current?.key === key && current.direction === "ascending" ? "descending" : "ascending"
    }));
  }, []);
  return { sort, setSort, toggleSort };
}

export function useSelection<TId extends RowId>(initial: readonly TId[] = []) {
  const [selectedIds, setSelectedIds] = useState<ReadonlySet<TId>>(() => new Set(initial));

  const toggle = useCallback((id: TId): void => {
    setSelectedIds((current) => {
      const next = new Set(current);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  }, []);

  const toggleAll = useCallback((ids: readonly TId[]): void => {
    setSelectedIds((current) => {
      const allSelected = ids.length > 0 && ids.every((id) => current.has(id));
      if (allSelected) return new Set([...current].filter((id) => !ids.includes(id)));
      return new Set([...current, ...ids]);
    });
  }, []);

  const clear = useCallback((): void => setSelectedIds(new Set()), []);
  return {
    selectedIds,
    isSelected: (id: TId) => selectedIds.has(id),
    allSelected: (ids: readonly TId[]) => ids.length > 0 && ids.every((id) => selectedIds.has(id)),
    toggle,
    toggleAll,
    clear
  };
}

export type TableColumn<TRow extends object> = {
  key: string;
  header: ReactNode;
  render: (row: TRow) => ReactNode;
  sortable?: boolean | undefined;
};

export type TableProps<TRow extends object> = ClassNameProps & {
  caption: ReactNode;
  rows: readonly TRow[];
  columns: readonly TableColumn<TRow>[];
  getRowId: (row: TRow) => RowId;
  sort?: SortState | undefined;
  onSortChange?: ((sort: SortState) => void) | undefined;
  selectable?: boolean | undefined;
  selectedRowIds?: ReadonlySet<RowId> | undefined;
  onRowSelectionChange?: ((id: RowId) => void) | undefined;
  onSelectAll?: ((ids: readonly RowId[]) => void) | undefined;
  loading?: boolean | undefined;
  error?: ReactNode;
  emptyState?: ReactNode;
};

export function Table<TRow extends object>({
  caption,
  rows,
  columns,
  getRowId,
  sort,
  onSortChange,
  selectable = false,
  selectedRowIds = new Set<RowId>(),
  onRowSelectionChange,
  onSelectAll,
  loading = false,
  error,
  emptyState = "No results found.",
  className
}: TableProps<TRow>) {
  const rowIds = rows.map(getRowId);
  const allSelected = rowIds.length > 0 && rowIds.every((id) => selectedRowIds.has(id));
  const someSelected = !allSelected && rowIds.some((id) => selectedRowIds.has(id));
  const colSpan = columns.length + (selectable ? 1 : 0);

  return (
    <div className={cx("ui-table-wrap", className)} aria-busy={loading || undefined}>
      <table className="ui-table">
        <caption>{caption}</caption>
        <thead>
          <tr>
            {selectable ? (
              <th scope="col" className="ui-table-selection-cell">
                <input
                  type="checkbox"
                  aria-label="Select all rows"
                  checked={allSelected}
                  aria-checked={someSelected ? "mixed" : allSelected}
                  onChange={() => onSelectAll?.(rowIds)}
                />
              </th>
            ) : null}
            {columns.map((column) => {
              const active = sort?.key === column.key;
              return (
                <th
                  scope="col"
                  key={column.key}
                  aria-sort={column.sortable ? (active ? sort.direction : "none") : undefined}
                >
                  {column.sortable && onSortChange ? (
                    <button
                      type="button"
                      onClick={() =>
                        onSortChange({
                          key: column.key,
                          direction:
                            active && sort.direction === "ascending" ? "descending" : "ascending"
                        })
                      }
                    >
                      {column.header}
                      <span aria-hidden="true">
                        {active ? (sort.direction === "ascending" ? " ↑" : " ↓") : ""}
                      </span>
                    </button>
                  ) : (
                    column.header
                  )}
                </th>
              );
            })}
          </tr>
        </thead>
        <tbody>
          {loading ? (
            <tr>
              <td colSpan={colSpan}>Loading results…</td>
            </tr>
          ) : error ? (
            <tr>
              <td colSpan={colSpan} role="alert">
                {error}
              </td>
            </tr>
          ) : rows.length === 0 ? (
            <tr>
              <td colSpan={colSpan}>{emptyState}</td>
            </tr>
          ) : (
            rows.map((row) => {
              const rowId = getRowId(row);
              return (
                <tr
                  key={String(rowId)}
                  aria-selected={selectable ? selectedRowIds.has(rowId) : undefined}
                >
                  {selectable ? (
                    <td className="ui-table-selection-cell" data-label="Select">
                      <input
                        type="checkbox"
                        aria-label={`Select row ${String(rowId)}`}
                        checked={selectedRowIds.has(rowId)}
                        onChange={() => onRowSelectionChange?.(rowId)}
                      />
                    </td>
                  ) : null}
                  {columns.map((column) => (
                    <td
                      key={column.key}
                      data-label={typeof column.header === "string" ? column.header : column.key}
                    >
                      {column.render(row)}
                    </td>
                  ))}
                </tr>
              );
            })
          )}
        </tbody>
      </table>
    </div>
  );
}

export type ListProps<TItem> = ClassNameProps & {
  items: readonly TItem[];
  getItemKey: (item: TItem) => RowId;
  renderItem: (item: TItem) => ReactNode;
  label?: string;
  loading?: boolean | undefined;
  error?: ReactNode;
  emptyState?: ReactNode;
};

export function List<TItem>({
  items,
  getItemKey,
  renderItem,
  label = "List",
  loading = false,
  error,
  emptyState = "No items found.",
  className
}: ListProps<TItem>) {
  return (
    <div className={cx("ui-list", className)} aria-busy={loading || undefined}>
      <ul aria-label={label}>
        {loading ? (
          <li className="ui-list-state">Loading items…</li>
        ) : error ? (
          <li className="ui-list-state" role="alert">
            {error}
          </li>
        ) : items.length === 0 ? (
          <li className="ui-list-state">{emptyState}</li>
        ) : (
          items.map((item) => <li key={String(getItemKey(item))}>{renderItem(item)}</li>)
        )}
      </ul>
    </div>
  );
}

export type CardProps = ClassNameProps & {
  title?: ReactNode;
  description?: ReactNode;
  actions?: ReactNode;
  children: ReactNode;
};

export function Card({ title, description, actions, children, className }: CardProps) {
  return (
    <article className={cx("ui-card", className)}>
      {title || description || actions ? (
        <header className="ui-card-header">
          {title || description ? (
            <div>
              <h2>{title}</h2>
              {description ? <p>{description}</p> : null}
            </div>
          ) : null}
          {actions ? <div className="ui-card-actions">{actions}</div> : null}
        </header>
      ) : null}
      <div className="ui-card-body">{children}</div>
    </article>
  );
}

export type StatProps = ClassNameProps & {
  label: ReactNode;
  value: ReactNode;
  supporting?: ReactNode;
  trend?: "up" | "down" | "neutral";
};

export function Stat({ label, value, supporting, trend = "neutral", className }: StatProps) {
  return (
    <dl className={cx("ui-stat", className)}>
      <dt>{label}</dt>
      <dd>{value}</dd>
      {supporting ? (
        <div className={cx("ui-stat-supporting", `ui-stat-${trend}`)}>{supporting}</div>
      ) : null}
    </dl>
  );
}

export type TimelineItem = {
  id: RowId;
  title: ReactNode;
  description?: ReactNode;
  date?: ReactNode;
  status?: "complete" | "current" | "upcoming";
};

export type TimelineProps = ClassNameProps & {
  items: readonly TimelineItem[];
  label?: string;
};

export function Timeline({ items, label = "Timeline", className }: TimelineProps) {
  return (
    <ol className={cx("ui-timeline", className)} aria-label={label}>
      {items.map((item) => (
        <li key={String(item.id)} className={`ui-timeline-${item.status ?? "upcoming"}`}>
          <span className="ui-timeline-marker" aria-hidden="true" />
          <div className="ui-timeline-content">
            <div className="ui-timeline-heading">
              <strong>{item.title}</strong>
              {item.date ? <time>{item.date}</time> : null}
            </div>
            {item.description ? <p>{item.description}</p> : null}
          </div>
        </li>
      ))}
    </ol>
  );
}

export type ProgressProps = ClassNameProps & {
  value?: number | undefined;
  max?: number;
  label: string;
};

export function Progress({ value, max = 100, label, className }: ProgressProps) {
  const safeMax = Math.max(1, Number.isFinite(max) ? max : 100);
  const safeValue =
    value === undefined
      ? undefined
      : Math.min(safeMax, Math.max(0, Number.isFinite(value) ? value : 0));
  const percentage = safeValue === undefined ? 0 : (safeValue / safeMax) * 100;
  return (
    <div
      className={cx(
        "ui-progress",
        safeValue === undefined && "ui-progress-indeterminate",
        className
      )}
    >
      <div className="ui-progress-label">
        <span>{label}</span>
        {safeValue === undefined ? null : <span>{Math.round(percentage)}%</span>}
      </div>
      <div
        className="ui-progress-track"
        role="progressbar"
        aria-label={label}
        aria-valuemin={0}
        aria-valuemax={safeMax}
        aria-valuenow={safeValue}
      >
        <span className="ui-progress-value" style={{ width: `${percentage}%` }} />
      </div>
    </div>
  );
}

export type VirtualRange = { start: number; end: number };

export function calculateVirtualRange(
  itemCount: number,
  itemHeight: number,
  viewportHeight: number,
  scrollTop: number,
  overscan = 4
): VirtualRange {
  const count = clampInteger(itemCount, 0, 1_000_000);
  const safeItemHeight = clampInteger(itemHeight, 1, 2000);
  const safeViewportHeight = clampInteger(viewportHeight, 1, 10_000);
  const safeScrollTop = Math.max(0, Number.isFinite(scrollTop) ? scrollTop : 0);
  const safeOverscan = clampInteger(overscan, 0, 50);
  const start = Math.max(0, Math.floor(safeScrollTop / safeItemHeight) - safeOverscan);
  const visibleCount = Math.ceil(safeViewportHeight / safeItemHeight) + safeOverscan * 2;
  return { start: Math.min(start, count), end: Math.min(count, start + visibleCount) };
}

export type VirtualizedCollectionProps<TItem> = ClassNameProps & {
  items: readonly TItem[];
  getItemKey: (item: TItem) => RowId;
  renderItem: (item: TItem, index: number) => ReactNode;
  itemHeight: number;
  height: number;
  overscan?: number;
  label?: string;
};

export function VirtualizedCollection<TItem>({
  items,
  getItemKey,
  renderItem,
  itemHeight,
  height,
  overscan = 4,
  label = "Collection",
  className
}: VirtualizedCollectionProps<TItem>) {
  const safeItemHeight = clampInteger(itemHeight, 1, 2000);
  const safeHeight = clampInteger(height, 120, 1200);
  const [scrollTop, setScrollTop] = useState(0);
  const range = calculateVirtualRange(
    items.length,
    safeItemHeight,
    safeHeight,
    scrollTop,
    overscan
  );
  const visibleItems = useMemo(
    () => items.slice(range.start, range.end),
    [items, range.end, range.start]
  );
  const offsetStyle: CSSProperties = { transform: `translateY(${range.start * safeItemHeight}px)` };

  return (
    <div
      className={cx("ui-virtualized-collection", className)}
      style={{ height: safeHeight }}
      aria-label={label}
      role="list"
      onScroll={(event) => setScrollTop(event.currentTarget.scrollTop)}
    >
      <div className="ui-virtualized-track" style={{ height: items.length * safeItemHeight }}>
        <div className="ui-virtualized-window" style={offsetStyle}>
          {visibleItems.map((item, index) => (
            <div
              role="listitem"
              key={String(getItemKey(item))}
              style={{ minHeight: safeItemHeight }}
            >
              {renderItem(item, range.start + index)}
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
