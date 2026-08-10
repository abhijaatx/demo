import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import { test } from "node:test";

const readWebFile = (path) => readFile(new URL("../apps/web/" + path, import.meta.url), "utf8");

test("Chrome extension captures can be validated and imported into the local editor", async () => {
  const [route, surface, extension, background, content, css] = await Promise.all([
    readWebFile("app/extension-import/page.tsx"),
    readWebFile("components/extension-import-workbench.tsx"),
    readFile(new URL("../apps/extension/popup.js", import.meta.url), "utf8"),
    readFile(new URL("../apps/extension/background.js", import.meta.url), "utf8"),
    readFile(new URL("../apps/extension/content.js", import.meta.url), "utf8"),
    readWebFile("app/globals.css")
  ]);

  assert.match(route, /ExtensionImportWorkbench/u);
  assert.match(surface, /MAX_JSON_BYTES = 8 \* 1024 \* 1024/u);
  assert.match(surface, /dataUrlToBlob/u);
  assert.match(surface, /kind: "screenshots"/u);
  assert.match(surface, /localCapture=/u);
  assert.match(surface, /safeSourceUrl/u);
  assert.match(extension, /CAPTURE_MANUAL/u);
  assert.match(extension, /extension-import/u);
  assert.match(background, /captureManual/u);
  assert.match(background, /SUPADEMO_MANUAL_CAPTURE/u);
  assert.match(content, /SUPADEMO_MANUAL_CAPTURE/u);
  assert.match(content, /mouseover/u);
  assert.match(css, /\.extension-import-dropzone/u);
  assert.doesNotMatch(
    surface + extension + background + content,
    /innerHTML|outerHTML|eval\(|new Function\(/u
  );
});
