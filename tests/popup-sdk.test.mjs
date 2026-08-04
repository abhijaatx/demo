import assert from "node:assert/strict";
import { test } from "node:test";
import { SupaDemoSDK } from "@supademo/player";

test("SupaDemoSDK manages modal creation and destruction cleanly", () => {
  const sdk = new SupaDemoSDK();
  let opened = false;

  // In Node environment without window/document, open degrades gracefully
  sdk.open("demo-sdk-1", {
    onOpen: () => {
      opened = true;
    }
  });
  sdk.close();
  sdk.destroy();

  assert.equal(opened, true);
  assert.ok(sdk);
});
