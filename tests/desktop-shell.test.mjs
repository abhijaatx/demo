import assert from "node:assert/strict";
import { test } from "node:test";
import { createDesktopShellConfig } from "@supademo/domain";

test("createDesktopShellConfig enforces secure renderer isolation", () => {
  const config = createDesktopShellConfig("tauri");

  assert.equal(config.framework, "tauri");
  assert.equal(config.enableContextIsolation, true);
  assert.equal(config.enableNodeIntegration, false);
  assert.equal(config.allowlistCommands.includes("start_capture"), true);
});
