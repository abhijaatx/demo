import assert from "node:assert/strict";
import { test } from "node:test";
import { createVectorEmbeddingChunk, queryPermissionAwareRetrieval } from "@supademo/domain";

test("queryPermissionAwareRetrieval enforces tenant isolation and returns valid citations", () => {
  const c1 = createVectorEmbeddingChunk("c1", "s1", "ws-A", "ag-1", [0.1]);
  const c2 = createVectorEmbeddingChunk("c2", "s2", "ws-B", "ag-1", [0.2]); // Other tenant

  const resultA = queryPermissionAwareRetrieval([c1, c2], "ws-A", "ag-1");
  assert.equal(resultA.hasMatch, true);
  assert.equal(resultA.citations.length, 1);
  assert.equal(resultA.citations[0]?.chunkId, "c1");

  const resultC = queryPermissionAwareRetrieval([c1, c2], "ws-C", "ag-1");
  assert.equal(resultC.hasMatch, false);
  assert.equal(resultC.citations.length, 0);
});
