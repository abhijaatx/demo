import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import test from "node:test";
import { createElement as h, Fragment } from "react";
import { renderToStaticMarkup } from "react-dom/server";
import {
  AlertDialog,
  Banner,
  Button,
  Dropdown,
  EmptyState,
  InlineAlert,
  Modal,
  Skeleton,
  Toast
} from "../packages/ui/dist/index.js";

const readOverlays = () =>
  readFile(new URL("../packages/ui/src/overlays.tsx", import.meta.url), "utf8");

function render(...children) {
  return renderToStaticMarkup(h(Fragment, null, ...children));
}

test("feedback primitives expose live regions and predictable loading/empty states", () => {
  const markup = render(
    h(Toast, { title: "Saved", children: "Your demo is ready.", variant: "success" }),
    h(Banner, {
      title: "Offline",
      children: "Changes will retry when connected.",
      variant: "warning"
    }),
    h(InlineAlert, { title: "Could not save", children: "Try again.", variant: "danger" }),
    h(Skeleton, { variant: "text", lines: 3 }),
    h(EmptyState, {
      title: "No demos yet",
      description: "Create your first demo.",
      action: h(Button, { children: "Create demo" })
    })
  );

  assert.match(markup, /role="status"[^>]*aria-live="polite"/u);
  assert.match(markup, /role="region"/u);
  assert.match(markup, /role="alert"/u);
  assert.equal((markup.match(/ui-skeleton ui-skeleton-text/gu) ?? []).length, 3);
  assert.match(markup, /<h2>No demos yet<\/h2>/u);
  assert.match(markup, /Create demo/u);
});

test("closed modal surfaces do not emit content during server rendering", () => {
  assert.equal(
    render(h(Modal, { open: false, onClose: () => {}, title: "Dialog", children: "Hidden" })),
    ""
  );
  assert.equal(
    render(
      h(AlertDialog, { open: false, onClose: () => {}, title: "Confirm", children: "Hidden" })
    ),
    ""
  );
});

test("dropdown trigger remains keyboard-addressable while its menu is closed", () => {
  const markup = render(
    h(Dropdown, {
      open: false,
      onOpenChange: () => {},
      trigger: h(Button, { children: "Actions" }),
      children: h("button", { role: "menuitem", children: "Rename" })
    })
  );

  assert.match(markup, /aria-haspopup="menu"/u);
  assert.match(markup, /aria-expanded="false"/u);
  assert.doesNotMatch(markup, /role="menu"/u);
});

test("overlay source keeps portal, focus, escape, outside-click, and nested-overlay guards", async () => {
  const source = await readOverlays();
  assert.match(source, /createPortal\(/u);
  assert.match(source, /event\.key === "Escape"/u);
  assert.match(source, /event\.key !== "Tab"/u);
  assert.match(source, /document\.addEventListener\("pointerdown"/u);
  assert.match(source, /data-ui-overlay-surface/u);
  assert.match(source, /aria-modal="true"/u);
  assert.doesNotMatch(source, /dangerouslySetInnerHTML|innerHTML|eval\(/u);
});
