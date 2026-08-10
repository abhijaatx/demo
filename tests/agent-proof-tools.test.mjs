import assert from "node:assert/strict";
import { test } from "node:test";
import { executeAgentProofTool } from "@supademo/domain";

test("executeAgentProofTool enforces workspace permission check", () => {
  const toolCall = {
    toolId: "t1",
    toolKind: "open_demo",
    targetIdOrUrl: "demo-123",
    workspaceId: "ws-1"
  };

  const res = executeAgentProofTool(toolCall, "ws-1");
  assert.equal(res.isSuccess, true);

  assert.throws(
    () => executeAgentProofTool(toolCall, "ws-2"),
    /Unauthorized tool execution across workspace boundaries/
  );
});
