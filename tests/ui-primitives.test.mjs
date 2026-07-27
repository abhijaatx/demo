import assert from "node:assert/strict";
import test from "node:test";
import { createElement as h, Fragment } from "react";
import { renderToStaticMarkup } from "react-dom/server";
import {
  Avatar,
  Badge,
  Button,
  Checkbox,
  IconButton,
  Input,
  Link,
  Radio,
  Select,
  Separator,
  Spinner,
  Switch,
  Textarea,
  Tooltip
} from "../packages/ui/dist/index.js";

function render(...children) {
  return renderToStaticMarkup(h(Fragment, null, ...children));
}

test("core primitives render native, keyboard-operable elements with accessible state", () => {
  const markup = render(
    h(Button, { loading: true, loadingLabel: "Saving", children: "Save" }),
    h(IconButton, { "aria-label": "More actions", children: "…" }),
    h(Link, { href: "https://example.com", external: true, children: "Docs" }),
    h(Input, {
      id: "email",
      label: "Email",
      description: "Work address",
      error: "Enter a valid address",
      children: undefined
    }),
    h(Textarea, { id: "notes", label: "Notes", disabled: true }),
    h(Select, {
      id: "role",
      label: "Role",
      children: h("option", { value: "creator", children: "Creator" })
    }),
    h(Checkbox, { id: "terms", label: "Accept terms", required: true }),
    h(Radio, { id: "monthly", name: "plan", label: "Monthly" }),
    h(Switch, { id: "notifications", label: "Notifications", defaultChecked: true }),
    h(Badge, { variant: "success", children: "Published" }),
    h(Avatar, { name: "Ada Lovelace" }),
    h(Separator, {}),
    h(Spinner, { label: "Loading demos" })
  );

  assert.match(markup, /<button[^>]*disabled[^>]*aria-busy="true"/u);
  assert.match(markup, /aria-label="More actions"/u);
  assert.match(markup, /rel="noopener noreferrer"/u);
  assert.match(markup, /<label[^>]*for="email"[^>]*>Email<\/label>/u);
  assert.match(markup, /id="email-description"/u);
  assert.match(markup, /id="email-error"[^>]*role="alert"/u);
  assert.match(markup, /aria-invalid="true"/u);
  assert.match(markup, /<textarea[^>]*disabled/iu);
  assert.match(markup, /<select[^>]*id="role"/u);
  assert.match(markup, /id="terms"[^>]*type="checkbox"/u);
  assert.match(markup, /id="monthly"[^>]*type="radio"/u);
  assert.match(markup, /role="switch"/u);
  assert.match(markup, /aria-label="Ada Lovelace"/u);
  assert.match(markup, /role="separator"/u);
  assert.match(markup, /role="status"[^>]*aria-label="Loading demos"/u);
});

test("tooltip associates its message with the keyboard-focusable trigger", () => {
  const markup = render(
    h(Tooltip, {
      content: "Copy link",
      children: h(IconButton, { "aria-label": "Copy", children: "⧉" })
    })
  );

  const describedBy = markup.match(/aria-describedby="([^"]+)"/u)?.[1];
  assert.ok(describedBy);
  assert.match(markup, new RegExp(`id="${describedBy}"[^>]*role="tooltip"`, "u"));
});
