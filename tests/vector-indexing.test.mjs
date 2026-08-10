import assert from "node:assert/strict";
import { test } from "node:test";
import { createVectorEmbeddingChunk } from "@supademo/domain";

test("createVectorEmbeddingChunk builds tenant-scoped vector chunks", () => {
  const vec = [0.1, 0.2, 0.3];
  const chunk = createVectorEmbeddingChunk("chk-1", "src-1", "ws-1", "ag-1", vec);

  assert.equal(chunk.chunkId, "chk-1");
  assert.equal(chunk.workspaceId, "ws-1");
  assert.equal(chunk.embeddingVector.length, 3);
});
