"use client";

import type { Comment, CommentTargetType } from "@supademo/domain";
import * as React from "react";
import { createCommentClient, type CommentClient } from "../src/lib/comment-client";

export interface CommentsPanelProps {
  readonly workspaceId: string;
  readonly targetType: CommentTargetType;
  readonly targetId: string;
  readonly isOpen: boolean;
  readonly onClose: () => void;
  readonly client?: CommentClient;
}

const EMOJI_PICKER = ["👍", "❤️", "🎉", "🚀", "👀"] as const;

export function CommentsPanel({
  workspaceId,
  targetType,
  targetId,
  isOpen,
  onClose,
  client: providedClient
}: CommentsPanelProps) {
  const client = React.useMemo(() => providedClient ?? createCommentClient(), [providedClient]);

  const [comments, setComments] = React.useState<readonly Comment[]>([]);
  const [filter, setFilter] = React.useState<"all" | "unresolved">("unresolved");
  const [newContent, setNewContent] = React.useState("");
  const [replyParentId, setReplyParentId] = React.useState<string | null>(null);
  const [editingId, setEditingId] = React.useState<string | null>(null);
  const [editContent, setEditContent] = React.useState("");
  const [statusMessage, setStatusMessage] = React.useState<string | null>(null);
  const [loading, setLoading] = React.useState(false);

  const loadComments = React.useCallback(async () => {
    if (!isOpen || !workspaceId || !targetId) return;
    setLoading(true);
    try {
      const data = await client.list(workspaceId, targetType, targetId);
      setComments(data);
    } catch (err) {
      setStatusMessage(err instanceof Error ? err.message : "Failed to load comments.");
    } finally {
      setLoading(false);
    }
  }, [client, isOpen, workspaceId, targetType, targetId]);

  React.useEffect(() => {
    void loadComments();
  }, [loadComments]);

  if (!isOpen) return null;

  const rootComments = comments.filter((c) => c.parentId === null);
  const filteredRoots = rootComments.filter((c) =>
    filter === "unresolved" ? !c.isResolved : true
  );

  const handleCreate = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newContent.trim()) return;
    try {
      const created = await client.create(workspaceId, {
        targetType,
        targetId,
        content: newContent.trim(),
        parentId: replyParentId
      });
      setComments((prev) => [...prev, created]);
      setNewContent("");
      setReplyParentId(null);
      setStatusMessage("Comment posted.");
    } catch (err) {
      setStatusMessage(err instanceof Error ? err.message : "Failed to post comment.");
    }
  };

  const handleUpdate = async (commentId: string) => {
    if (!editContent.trim()) return;
    try {
      const updated = await client.update(workspaceId, commentId, { content: editContent.trim() });
      setComments((prev) => prev.map((c) => (c.id === commentId ? updated : c)));
      setEditingId(null);
      setEditContent("");
      setStatusMessage("Comment updated.");
    } catch (err) {
      setStatusMessage(err instanceof Error ? err.message : "Failed to update comment.");
    }
  };

  const handleDelete = async (commentId: string) => {
    try {
      await client.delete(workspaceId, commentId);
      setComments((prev) => prev.filter((c) => c.id !== commentId));
      setStatusMessage("Comment deleted.");
    } catch (err) {
      setStatusMessage(err instanceof Error ? err.message : "Failed to delete comment.");
    }
  };

  const handleToggleResolve = async (commentId: string, current: boolean) => {
    try {
      const updated = await client.toggleResolve(workspaceId, commentId, !current);
      setComments((prev) => prev.map((c) => (c.id === commentId ? updated : c)));
      setStatusMessage(updated.isResolved ? "Thread resolved." : "Thread reopened.");
    } catch (err) {
      setStatusMessage(err instanceof Error ? err.message : "Failed to change resolution state.");
    }
  };

  const handleToggleReaction = async (commentId: string, emoji: string) => {
    try {
      const updated = await client.toggleReaction(workspaceId, commentId, emoji);
      setComments((prev) => prev.map((c) => (c.id === commentId ? updated : c)));
    } catch (err) {
      setStatusMessage(err instanceof Error ? err.message : "Failed to toggle reaction.");
    }
  };

  return (
    <aside
      role="complementary"
      aria-label="Comments panel"
      className="fixed inset-y-0 right-0 z-50 w-full max-w-md bg-background border-l border-border shadow-xl flex flex-col"
    >
      <header className="flex items-center justify-between p-4 border-b border-border">
        <h2 className="text-lg font-semibold">Comments</h2>
        <button
          type="button"
          onClick={onClose}
          aria-label="Close comments panel"
          className="p-1 rounded hover:bg-accent focus:outline-none focus:ring-2 focus:ring-ring"
        >
          ✕
        </button>
      </header>

      <div className="flex border-b border-border bg-muted/40 p-2 gap-2">
        <button
          type="button"
          onClick={() => setFilter("unresolved")}
          className={`px-3 py-1 text-xs rounded-md font-medium transition-colors ${
            filter === "unresolved"
              ? "bg-background text-foreground shadow"
              : "text-muted-foreground"
          }`}
        >
          Unresolved
        </button>
        <button
          type="button"
          onClick={() => setFilter("all")}
          className={`px-3 py-1 text-xs rounded-md font-medium transition-colors ${
            filter === "all" ? "bg-background text-foreground shadow" : "text-muted-foreground"
          }`}
        >
          All
        </button>
      </div>

      <div role="status" aria-live="polite" className="sr-only">
        {statusMessage}
      </div>

      <div className="flex-1 overflow-y-auto p-4 space-y-4">
        {loading && <p className="text-sm text-muted-foreground">Loading comments...</p>}
        {!loading && filteredRoots.length === 0 && (
          <p className="text-sm text-muted-foreground italic text-center py-8">
            No comments found.
          </p>
        )}

        {filteredRoots.map((comment) => {
          const replies = comments.filter((c) => c.parentId === comment.id);
          return (
            <article
              key={comment.id}
              id={`comment-${comment.id}`}
              className={`p-3 rounded-lg border text-sm space-y-2 ${
                comment.isResolved
                  ? "bg-muted/30 border-border/50"
                  : "bg-card border-border shadow-sm"
              }`}
            >
              <div className="flex items-center justify-between text-xs text-muted-foreground">
                <span className="font-medium text-foreground">
                  Author ({comment.authorUserId.slice(0, 8)})
                </span>
                <span>{new Date(comment.createdAt).toLocaleDateString()}</span>
              </div>

              {editingId === comment.id ? (
                <div className="space-y-2">
                  <textarea
                    value={editContent}
                    onChange={(e) => setEditContent(e.target.value)}
                    className="w-full p-2 border rounded text-xs bg-background"
                    rows={3}
                  />
                  <div className="flex gap-2 justify-end">
                    <button
                      type="button"
                      onClick={() => setEditingId(null)}
                      className="px-2 py-1 text-xs rounded border"
                    >
                      Cancel
                    </button>
                    <button
                      type="button"
                      onClick={() => handleUpdate(comment.id)}
                      className="px-2 py-1 text-xs rounded bg-primary text-primary-foreground"
                    >
                      Save
                    </button>
                  </div>
                </div>
              ) : (
                <p className="text-foreground whitespace-pre-wrap">{comment.content}</p>
              )}

              <div className="flex flex-wrap items-center gap-1 pt-1">
                {EMOJI_PICKER.map((emoji) => {
                  const r = comment.reactions.find((rx) => rx.emoji === emoji);
                  const count = r?.userIds.length ?? 0;
                  return (
                    <button
                      key={emoji}
                      type="button"
                      onClick={() => handleToggleReaction(comment.id, emoji)}
                      className={`px-1.5 py-0.5 text-xs rounded border transition-colors ${
                        count > 0
                          ? "bg-accent border-primary/50 text-foreground"
                          : "bg-background border-border text-muted-foreground"
                      }`}
                    >
                      {emoji} {count > 0 && count}
                    </button>
                  );
                })}
              </div>

              <div className="flex items-center gap-3 pt-2 text-xs border-t border-border/40 text-muted-foreground">
                <button
                  type="button"
                  onClick={() => handleToggleResolve(comment.id, comment.isResolved)}
                  className="hover:underline text-primary"
                >
                  {comment.isResolved ? "Reopen" : "Resolve"}
                </button>
                <button
                  type="button"
                  onClick={() => setReplyParentId(replyParentId === comment.id ? null : comment.id)}
                  className="hover:underline"
                >
                  Reply
                </button>
                <button
                  type="button"
                  onClick={() => {
                    setEditingId(comment.id);
                    setEditContent(comment.content);
                  }}
                  className="hover:underline"
                >
                  Edit
                </button>
                <button
                  type="button"
                  onClick={() => handleDelete(comment.id)}
                  className="hover:underline text-destructive"
                >
                  Delete
                </button>
              </div>

              {/* Nested replies */}
              {replies.length > 0 && (
                <div className="pl-4 border-l-2 border-border space-y-2 mt-2">
                  {replies.map((reply) => (
                    <div
                      key={reply.id}
                      id={`comment-${reply.id}`}
                      className="text-xs space-y-1 py-1"
                    >
                      <div className="flex justify-between text-muted-foreground">
                        <span className="font-medium text-foreground">
                          {reply.authorUserId.slice(0, 8)}
                        </span>
                        <span>{new Date(reply.createdAt).toLocaleDateString()}</span>
                      </div>
                      <p className="whitespace-pre-wrap">{reply.content}</p>
                    </div>
                  ))}
                </div>
              )}
            </article>
          );
        })}
      </div>

      <form onSubmit={handleCreate} className="p-4 border-t border-border bg-background space-y-2">
        {replyParentId && (
          <div className="flex items-center justify-between text-xs text-muted-foreground bg-muted p-1.5 rounded">
            <span>Replying to thread</span>
            <button
              type="button"
              onClick={() => setReplyParentId(null)}
              className="hover:underline"
            >
              Cancel
            </button>
          </div>
        )}
        <textarea
          value={newContent}
          onChange={(e) => setNewContent(e.target.value)}
          placeholder="Add a comment..."
          aria-label="New comment text"
          rows={3}
          className="w-full p-2 border border-input rounded bg-background text-sm focus:outline-none focus:ring-2 focus:ring-ring"
        />
        <button
          type="submit"
          disabled={!newContent.trim()}
          className="w-full py-2 bg-primary text-primary-foreground rounded text-sm font-medium disabled:opacity-50"
        >
          Post Comment
        </button>
      </form>
    </aside>
  );
}
