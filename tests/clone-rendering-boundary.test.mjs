import assert from "node:assert/strict";
import { test } from "node:test";
import { createCloneRenderBoundaryConfig } from "@supademo/domain";

test("createCloneRenderBoundaryConfig produces restrictive CSP headers and isolated origin config", () => {
  const cfg = createCloneRenderBoundaryConfig("bundle-145");

  assert.equal(cfg.bundleId, "bundle-145");
  assert.equal(cfg.cloneOrigin, "https://clones.supademo.com");
  assert.equal(cfg.cspHeader.includes("default-src 'none'"), true);
  assert.equal(cfg.iframeSandbox, "allow-same-origin");
});
