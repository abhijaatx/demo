# Layout and navigation primitives

TASK-014 provides responsive composition primitives without introducing a new product information architecture.

## Layout

- `Stack` provides row/column flow with tokenized spacing, alignment, justification, and wrapping.
- `Grid` provides bounded column layouts or auto-fit minimum item widths.
- `Container` constrains content to narrow, content, or wide reading widths.
- `SplitPane` creates a sidebar/canvas relationship and collapses to one column at tablet widths.
- `Sidebar` renders an `aside` with a labeled `nav` and optional footer.
- `Header` renders a labeled page `header` with content and actions.

All layout primitives set `min-width: 0` at shrink boundaries. Grid and split panes collapse at 800px; containers, headers, and pagination reduce their horizontal footprint at 520px. Breadcrumbs and tab rails scroll locally instead of creating page-wide horizontal overflow.

## Navigation

`Breadcrumb` accepts an ordered list of labels and optional links. The final/current item is exposed with `aria-current="page"` and is not rendered as a link.

`Tabs` accepts typed items with `value`, `label`, `panel`, and optional `disabled`. It renders the WAI-ARIA tab pattern:

- `role="tablist"` with an accessible label.
- `role="tab"`, `aria-selected`, `aria-controls`, roving `tabIndex`, and native disabled behavior.
- `role="tabpanel"`, `aria-labelledby`, and `hidden` for inactive panels.
- Arrow-key navigation plus Home/End. Automatic activation is the default; manual activation waits for Enter or Space.

`Pagination` bounds the requested page range, renders only the surrounding page window plus first/last pages, uses an explicit ellipsis for gaps, and exposes current/previous/next state to assistive technology.

```tsx
<Tabs
  items={[
    { value: "link", label: "Link", panel: <LinkSettings /> },
    { value: "embed", label: "Embed", panel: <EmbedSettings /> }
  ]}
/>
```

Navigation components do not authorize data access or mutate routes themselves. Callers must validate destinations and enforce permissions at the application/API boundary.
