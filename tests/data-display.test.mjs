import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import test from "node:test";
import { createElement as h } from "react";
import { renderToStaticMarkup } from "react-dom/server";
import {
  Card,
  List,
  Progress,
  Stat,
  Table,
  Timeline,
  VirtualizedCollection,
  calculateVirtualRange
} from "../packages/ui/dist/index.js";

const readDataDisplay = () =>
  readFile(new URL("../packages/ui/src/data-display.tsx", import.meta.url), "utf8");
const readCss = () => readFile(new URL("../apps/web/app/globals.css", import.meta.url), "utf8");

function render(...children) {
  return renderToStaticMarkup(h("div", null, ...children));
}

const columns = [
  { key: "name", header: "Name", sortable: true, render: (row) => row.name },
  { key: "status", header: "Status", render: (row) => row.status }
];
const rows = [{ id: "demo-1", name: "Product tour", status: "Published" }];

test("table preserves semantics and exposes sorting and selection state", () => {
  const selected = new Set(["demo-1"]);
  const markup = render(
    h(Table, {
      caption: "Recent demos",
      rows,
      columns,
      getRowId: (row) => row.id,
      sort: { key: "name", direction: "ascending" },
      onSortChange: () => {},
      selectable: true,
      selectedRowIds: selected,
      onRowSelectionChange: () => {},
      onSelectAll: () => {}
    })
  );

  assert.match(markup, /<table class="ui-table">/u);
  assert.match(markup, /<caption>Recent demos<\/caption>/u);
  assert.match(markup, /scope="col"[^>]*aria-sort="ascending"/u);
  assert.match(markup, /aria-label="Select all rows"/u);
  assert.match(markup, /aria-selected="true"/u);
  assert.match(markup, /data-label="Name"/u);
});

test("data-display states are explicit and accessible", () => {
  const markup = render(
    h(Table, { caption: "Loading", rows: [], columns, getRowId: (row) => row.id, loading: true }),
    h(Table, {
      caption: "Error",
      rows: [],
      columns,
      getRowId: (row) => row.id,
      error: "Could not load demos"
    }),
    h(List, {
      items: [],
      getItemKey: (item) => item.id,
      renderItem: (item) => item.name,
      loading: false
    }),
    h(List, {
      items: [],
      getItemKey: (item) => item.id,
      renderItem: (item) => item.name,
      error: "Unavailable"
    })
  );

  assert.match(markup, /Loading results…/u);
  assert.match(markup, /role="alert">Could not load demos<\/td>/u);
  assert.match(markup, /No items found\./u);
  assert.match(markup, /role="alert">Unavailable<\/li>/u);
});

test("card, stat, timeline, progress, and virtualized collection render bounded content", () => {
  const items = Array.from({ length: 1000 }, (_, index) => ({ id: index, label: `Item ${index}` }));
  const markup = render(
    h(Card, { title: "Summary", description: "Overview", children: "Card body" }),
    h(Stat, { label: "Views", value: "1,200", supporting: "+12%", trend: "up" }),
    h(Timeline, { items: [{ id: 1, title: "Created", status: "complete", date: "Today" }] }),
    h(Progress, { label: "Upload", value: 40 }),
    h(VirtualizedCollection, {
      items,
      getItemKey: (item) => item.id,
      renderItem: (item) => item.label,
      itemHeight: 40,
      height: 200
    })
  );

  assert.match(markup, /<article class="ui-card">/u);
  assert.match(markup, /<dt>Views<\/dt><dd>1,200<\/dd>/u);
  assert.match(markup, /aria-label="Timeline"/u);
  assert.match(markup, /role="progressbar"[^>]*aria-valuenow="40"/u);
  assert.match(markup, /role="list"/u);
  assert.ok((markup.match(/role="listitem"/gu) ?? []).length < 1000);
});

test("virtualized range clamps unsafe inputs and stays bounded", () => {
  assert.deepEqual(calculateVirtualRange(1000, 40, 200, 400, 4), { start: 6, end: 19 });
  assert.deepEqual(calculateVirtualRange(10, -5, 100, Number.NaN, 999), { start: 0, end: 10 });
});

test("data-display source and CSS keep responsive semantics and avoid unsafe HTML", async () => {
  const [source, css] = await Promise.all([readDataDisplay(), readCss()]);
  assert.match(source, /useTableSort/u);
  assert.match(source, /useSelection/u);
  assert.match(source, /scope="col"/u);
  assert.match(source, /aria-selected/u);
  assert.match(source, /calculateVirtualRange/u);
  assert.doesNotMatch(source, /dangerouslySetInnerHTML|innerHTML|eval\(/u);
  assert.match(css, /\.ui-table-wrap \{[^}]*overflow-x: auto/iu);
  assert.match(css, /\.ui-table thead \{[^}]*position: absolute/iu);
  assert.match(css, /\.ui-virtualized-collection \{[^}]*overflow: auto/iu);
});
