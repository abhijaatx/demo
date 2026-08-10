/**
 * Tenant-Isolated Vector Indexing & pgvector Chunks — TASK-162
 */

export interface VectorEmbeddingChunk {
  readonly chunkId: string;
  readonly sourceId: string;
  readonly workspaceId: string;
  readonly agentId: string;
  readonly embeddingVector: readonly number[];
}

export function createVectorEmbeddingChunk(
  chunkId: string,
  sourceId: string,
  workspaceId: string,
  agentId: string,
  embeddingVector: readonly number[]
): VectorEmbeddingChunk {
  if (!chunkId.trim() || !sourceId.trim() || !workspaceId.trim() || !agentId.trim()) {
    throw new Error("Chunk ID, source ID, workspace ID, and agent ID are required.");
  }
  if (embeddingVector.length === 0) {
    throw new Error("Embedding vector cannot be empty.");
  }

  return Object.freeze({
    chunkId: chunkId.trim(),
    sourceId: sourceId.trim(),
    workspaceId: workspaceId.trim(),
    agentId: agentId.trim(),
    embeddingVector: Object.freeze([...embeddingVector])
  });
}
