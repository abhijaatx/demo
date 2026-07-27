# Data-display primitives

TASK-017 adds reusable data-display building blocks for dashboards, workspaces, analytics, and editor side panels.

## Components

- `Table<TRow>` renders native table markup with caption, scoped headers, sortable columns, optional row selection, and explicit loading/error/empty rows. On narrow screens it becomes a labeled card-like row layout while preserving the data-label for each cell.
- `List<TItem>` renders a labeled semantic list with explicit loading/error/empty states.
- `Card` provides a neutral surface with optional title, description, actions, and body.
- `Stat` renders a definition-list KPI with supporting/trend text.
- `Timeline` renders an ordered event list with complete/current/upcoming states.
- `Progress` exposes a native progressbar contract and supports determinate or indeterminate work.
- `VirtualizedCollection<TItem>` renders only the visible overscanned range inside a bounded scroll container. Item count, item height, viewport height, and overscan are clamped.

## Sorting and selection hooks

`useTableSort` provides controlled sort state and a direction toggle. `useSelection` provides a `Set`-based selection model with row toggle, select-all, clear, and membership helpers. These hooks hold UI state only; server sorting, pagination, authorization, and tenant filtering remain API responsibilities.

```tsx
const selection = useSelection(demoIds);
const sorting = useTableSort({ key: "updatedAt", direction: "descending" });

<Table
  caption="Recent demos"
  rows={demos}
  columns={columns}
  getRowId={(demo) => demo.id}
  selectedRowIds={selection.selectedIds}
  onRowSelectionChange={selection.toggle}
  sort={sorting.sort}
  onSortChange={sorting.setSort}
/>;
```

Large collections should use `VirtualizedCollection` only when row height is stable or intentionally constrained. For variable-height content, use pagination or a purpose-built measurement strategy rather than assuming offsets are accurate.
