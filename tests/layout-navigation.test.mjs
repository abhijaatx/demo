import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import test from "node:test";
import { createElement as h, Fragment } from "react";
import { renderToStaticMarkup } from "react-dom/server";
import {
  Breadcrumb,
  Container,
  Grid,
  Header,
  Pagination,
  Sidebar,
  SplitPane,
  Stack,
  Tabs
} from "../packages/ui/dist/index.js";

const readLayout = () =>
  readFile(new URL("../packages/ui/src/layout.tsx", import.meta.url), "utf8");
const readCss = () => readFile(new URL("../apps/web/app/globals.css", import.meta.url), "utf8");

function render(...children) {
  return renderToStaticMarkup(h(Fragment, null, ...children));
}

test("layout primitives expose landmarks and bounded responsive structure", () => {
  const markup = render(
    h(Container, {
      width: "content",
      children: h(Stack, { direction: "row", gap: "3", children: "Content" })
    }),
    h(Grid, { columns: 3, gap: "4", children: h("div", { children: "Card" }) }),
    h(SplitPane, { sidebar: "Steps", children: "Canvas" }),
    h(Sidebar, { children: h("a", { href: "/demos", children: "Demos" }), footer: "Account" }),
    h(Header, { actions: h("button", { children: "Share" }), children: "Demo title" }),
    h(Breadcrumb, {
      items: [
        { label: "Home", href: "/" },
        { label: "Demos", current: true }
      ]
    })
  );

  assert.match(markup, /class="ui-container ui-container-content"/u);
  assert.match(markup, /data-direction="row" data-gap="3"/u);
  assert.match(markup, /data-columns="3" data-gap="4"/u);
  assert.match(markup, /<aside class="ui-split-pane-sidebar">/u);
  assert.match(markup, /<main class="ui-split-pane-main">Canvas<\/main>/u);
  assert.match(markup, /<aside class="ui-sidebar"[^>]*aria-label="Workspace navigation"/u);
  assert.match(markup, /<header class="ui-header"[^>]*aria-label="Page header"/u);
  assert.match(markup, /<nav class="ui-breadcrumb"[^>]*aria-label="Breadcrumb"/u);
  assert.match(markup, /aria-current="page"/u);
});

test("tabs expose selected, disabled, panel, and keyboard-navigation semantics", () => {
  const markup = render(
    h(Tabs, {
      label: "Demo settings",
      defaultValue: "details",
      activation: "manual",
      items: [
        { value: "details", label: "Details", panel: h("p", { children: "Details panel" }) },
        {
          value: "advanced",
          label: "Advanced",
          panel: h("p", { children: "Advanced panel" }),
          disabled: true
        }
      ]
    })
  );

  assert.match(markup, /role="tablist"[^>]*aria-label="Demo settings"/u);
  assert.match(markup, /role="tab"[^>]*aria-selected="true"[^>]*aria-controls=/u);
  assert.match(markup, /role="tab"[^>]*disabled=""/u);
  assert.match(markup, /role="tabpanel"[^>]*aria-labelledby=/u);
  assert.match(markup, /Details panel/u);
});

test("pagination exposes current page and bounded navigation controls", () => {
  const markup = render(
    h(Pagination, { currentPage: 3, totalPages: 10, onPageChange: () => {}, siblingCount: 1 }),
    h(Pagination, { currentPage: 5, totalPages: 5, onPageChange: () => {} })
  );

  assert.match(markup, /aria-label="Pagination"/u);
  assert.match(markup, /aria-current="page"/u);
  assert.match(markup, /aria-label="Previous page"/u);
  assert.match(markup, /aria-label="Next page"/u);
  assert.match(markup, /disabled=""/u);
  assert.match(markup, /aria-hidden="true">…<\/li>/u);
});

test("responsive CSS keeps narrow layouts contained and scrolls only local navigation rails", async () => {
  const [layout, css] = await Promise.all([readLayout(), readCss()]);
  assert.match(layout, /ArrowRight|ArrowLeft|ArrowDown|ArrowUp/u);
  assert.match(layout, /event\.key === "Home"|event\.key === "End"/u);
  assert.match(css, /\.ui-container \{[^}]*min-width: 0/iu);
  assert.match(css, /\.ui-split-pane \{[^}]*overflow: hidden/iu);
  assert.match(css, /\.ui-tabs-tablist \{[^}]*overflow-x: auto/iu);
  assert.match(css, /@media \(max-width: 520px\)/u);
  assert.match(css, /\.ui-pagination \{[^}]*flex-wrap: wrap/iu);
});
