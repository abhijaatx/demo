import type {
  Comment,
  CommentTargetType,
  CreateCommentInput,
  UpdateCommentInput
} from "@supademo/domain";

export interface CommentClient {
  list(
    workspaceId: string,
    targetType: CommentTargetType,
    targetId: string
  ): Promise<readonly Comment[]>;
  create(workspaceId: string, input: CreateCommentInput): Promise<Comment>;
  update(workspaceId: string, commentId: string, input: UpdateCommentInput): Promise<Comment>;
  delete(workspaceId: string, commentId: string): Promise<{ readonly success: boolean }>;
  toggleResolve(workspaceId: string, commentId: string, isResolved: boolean): Promise<Comment>;
  toggleReaction(workspaceId: string, commentId: string, emoji: string): Promise<Comment>;
}

export function createCommentClient(
  fetcher: typeof fetch = globalThis.fetch,
  baseUrl = "/api/v1"
): CommentClient {
  async function request<T>(path: string, options: RequestInit = {}): Promise<T> {
    const headers = new Headers(options.headers);
    if (!headers.has("Accept")) headers.set("Accept", "application/json");

    const response = await fetcher(`${baseUrl}${path}`, {
      ...options,
      headers,
      credentials: "include",
      cache: "no-store"
    });

    if (!response.ok) {
      let message = "Comment operation failed.";
      try {
        const errorData = (await response.json()) as { error?: { message?: string } };
        if (errorData.error?.message) message = errorData.error.message;
      } catch {
        // use default message
      }
      throw new Error(message);
    }

    return (await response.json()) as T;
  }

  return {
    async list(workspaceId, targetType, targetId) {
      const query = new URLSearchParams({ targetType, targetId }).toString();
      return request<readonly Comment[]>(
        `/workspaces/${encodeURIComponent(workspaceId)}/comments?${query}`
      );
    },

    async create(workspaceId, input) {
      return request<Comment>(`/workspaces/${encodeURIComponent(workspaceId)}/comments`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "Idempotency-Key": globalThis.crypto?.randomUUID?.() ?? `${Date.now()}`
        },
        body: JSON.stringify(input)
      });
    },

    async update(workspaceId, commentId, input) {
      return request<Comment>(
        `/workspaces/${encodeURIComponent(workspaceId)}/comments/${encodeURIComponent(commentId)}`,
        {
          method: "PATCH",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(input)
        }
      );
    },

    async delete(workspaceId, commentId) {
      return request<{ readonly success: boolean }>(
        `/workspaces/${encodeURIComponent(workspaceId)}/comments/${encodeURIComponent(commentId)}`,
        { method: "DELETE" }
      );
    },

    async toggleResolve(workspaceId, commentId, isResolved) {
      return request<Comment>(
        `/workspaces/${encodeURIComponent(workspaceId)}/comments/${encodeURIComponent(commentId)}/resolve`,
        {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ isResolved })
        }
      );
    },

    async toggleReaction(workspaceId, commentId, emoji) {
      return request<Comment>(
        `/workspaces/${encodeURIComponent(workspaceId)}/comments/${encodeURIComponent(commentId)}/reactions`,
        {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ emoji })
        }
      );
    }
  };
}
