import assert from "node:assert/strict";
import { test } from "node:test";
import { createAgentSession, appendAgentMessage } from "@supademo/domain";

test("createAgentSession and appendAgentMessage sanitize inputs and manage message thread", () => {
  let session = createAgentSession("sess-164", "ag-1", "ws-1");
  assert.equal(session.messages.length, 0);

  session = appendAgentMessage(session, "user", "<script>alert(1)</script> Hello!");
  assert.equal(session.messages.length, 1);
  assert.equal(session.messages[0]?.text.includes("&lt;script&gt;"), true);
  assert.equal(session.messages[0]?.text.includes("<script>"), false);
});
