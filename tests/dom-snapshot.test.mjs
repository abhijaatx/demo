import assert from "node:assert/strict";
import { test } from "node:test";
import { captureDomNode } from "@supademo/domain";

test("captureDomNode strips forbidden tags like <script> and event attributes like onclick", () => {
  const scriptNode = captureDomNode("script", {}, "alert('bad')");
  assert.equal(scriptNode, null);

  const buttonNode = captureDomNode(
    "button",
    { onclick: "doBad()", class: "btn-primary" },
    "Click Me"
  );
  assert.notEqual(buttonNode, null);
  assert.equal(buttonNode?.attributes["onclick"], undefined);
  assert.equal(buttonNode?.attributes["class"], "btn-primary");
});
