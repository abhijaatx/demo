"use client";

import type {
  Comment,
  CommentTargetType,
  CreateCommentInput,
  UpdateCommentInput
} from "@supademo/domain";
import { useMemo, useRef, useState, type MutableRefObject } from "react";
import type { CommentClient } from "../src/lib/comment-client";
import { CommentsPanel } from "./comments-panel";

type ReviewScope = "internal" | "external";

function makeId(): string {
  return (
    globalThis.crypto?.randomUUID?.() ??
    `00000000-0000-7000-8000-${Date.now().toString().padStart(12, "0").slice(-12)}`
  );
}

function createComment(
  workspaceId: string,
  input: CreateCommentInput,
  authorUserId: string,
  parentId: string | null = null
): Comment {
  const id = makeId();
  const now = new Date().toISOString();
  return {
    id,
    workspaceId,
    targetType: input.targetType,
    targetId: input.targetId,
    threadId: parentId ?? id,
    parentId,
    authorUserId,
    content: input.content.slice(0, 2_000),
    mentions: input.mentions ?? [],
    reactions: [],
    isResolved: false,
    resolvedByUserId: null,
    resolvedAt: null,
    createdAt: now,
    updatedAt: now,
    deletedAt: null
  };
}

function createLocalReviewClient(store: MutableRefObject<Map<string, Comment[]>>): CommentClient {
  const keyFor = (workspaceId: string, targetType: CommentTargetType, targetId: string) =>
    `${workspaceId}:${targetType}:${targetId}`;
  const find = (commentId: string): { comments: Comment[]; index: number } | null => {
    for (const comments of store.current.values()) {
      const index = comments.findIndex((comment) => comment.id === commentId);
      if (index >= 0) return { comments, index };
    }
    return null;
  };
  return {
    async list(workspaceId, targetType, targetId) {
      return [...(store.current.get(keyFor(workspaceId, targetType, targetId)) ?? [])];
    },
    async create(workspaceId, input) {
      const key = keyFor(workspaceId, input.targetType, input.targetId);
      const comments = store.current.get(key) ?? [];
      const comment = createComment(workspaceId, input, "local-reviewer", input.parentId ?? null);
      comments.push(comment);
      store.current.set(key, comments);
      return comment;
    },
    async update(_workspaceId, commentId, input: UpdateCommentInput) {
      const found = find(commentId);
      if (!found) throw new Error("Comment not found in this local review.");
      const updated = {
        ...found.comments[found.index]!,
        content: input.content.slice(0, 2_000),
        updatedAt: new Date().toISOString()
      };
      found.comments[found.index] = updated;
      return updated;
    },
    async delete(_workspaceId, commentId) {
      const found = find(commentId);
      if (!found) throw new Error("Comment not found in this local review.");
      found.comments.splice(found.index, 1);
      return { success: true };
    },
    async toggleResolve(_workspaceId, commentId, isResolved) {
      const found = find(commentId);
      if (!found) throw new Error("Comment not found in this local review.");
      const updated = {
        ...found.comments[found.index]!,
        isResolved,
        resolvedByUserId: isResolved ? "local-reviewer" : null,
        resolvedAt: isResolved ? new Date().toISOString() : null,
        updatedAt: new Date().toISOString()
      };
      found.comments[found.index] = updated;
      return updated;
    },
    async toggleReaction(_workspaceId, commentId, emoji) {
      const found = find(commentId);
      if (!found) throw new Error("Comment not found in this local review.");
      const current = found.comments[found.index]!;
      const reactions: Array<{ emoji: string; userIds: string[] }> = current.reactions.map(
        (reaction) => ({
          emoji: reaction.emoji,
          userIds: [...reaction.userIds]
        })
      );
      const reaction = reactions.find((entry) => entry.emoji === emoji);
      if (reaction) {
        reaction.userIds = reaction.userIds.includes("local-reviewer")
          ? reaction.userIds.filter((id) => id !== "local-reviewer")
          : [...reaction.userIds, "local-reviewer"];
      } else {
        reactions.push({ emoji, userIds: ["local-reviewer"] });
      }
      const updated = { ...current, reactions, updatedAt: new Date().toISOString() };
      found.comments[found.index] = updated;
      return updated;
    }
  };
}

export function ReviewCommentsWorkbench() {
  const workspaceId = "local-review-workspace";
  const store = useRef<Map<string, Comment[]>>(new Map());
  const client = useMemo(() => createLocalReviewClient(store), []);
  const [scope, setScope] = useState<ReviewScope>("internal");
  const [open, setOpen] = useState(true);
  const targetId = scope === "internal" ? "local-internal-review" : "local-external-review";

  if (!store.current.has(`${workspaceId}:demo:${targetId}`)) {
    const seeded = createComment(
      workspaceId,
      {
        targetType: "demo",
        targetId,
        content:
          scope === "internal"
            ? "Tighten the first step copy before publishing."
            : "Could you show where I should click next?"
      },
      scope === "internal" ? "teammate-ana" : "viewer-sam"
    );
    store.current.set(
      `${workspaceId}:demo:${targetId}`,
      scope === "external"
        ? [
            {
              ...seeded,
              isResolved: true,
              resolvedByUserId: "teammate-ana",
              resolvedAt: new Date().toISOString()
            }
          ]
        : [seeded]
    );
  }

  return (
    <main className="review-comments-page">
      <header className="review-comments-header">
        <a className="review-comments-back" href="/demos">
          ← Back to demos
        </a>
        <p className="eyebrow">Collaborate · Comments</p>
        <h1>Keep feedback attached to the demo</h1>
        <p>
          Use private threads with teammates or collect viewer feedback without leaving the demo
          review flow.
        </p>
      </header>

      <section className="review-comments-mode" aria-label="Comment audience">
        <div>
          <p className="eyebrow">Review audience</p>
          <h2>{scope === "internal" ? "Internal comments" : "External comments"}</h2>
          <p>
            {scope === "internal"
              ? "Only workspace members can see these threads."
              : "Share feedback with viewers who are reviewing the demo."}
          </p>
        </div>
        <div className="review-comments-tabs" role="tablist" aria-label="Comment audience tabs">
          <button
            type="button"
            role="tab"
            aria-selected={scope === "internal"}
            className={scope === "internal" ? "is-active" : ""}
            onClick={() => {
              setScope("internal");
              setOpen(true);
            }}
          >
            Internal comments
          </button>
          <button
            type="button"
            role="tab"
            aria-selected={scope === "external"}
            className={scope === "external" ? "is-active" : ""}
            onClick={() => {
              setScope("external");
              setOpen(true);
            }}
          >
            External comments
          </button>
        </div>
      </section>

      <section className="review-comments-stage" aria-label="Comment review stage">
        <div className="review-comments-demo-preview">
          <div className="review-comments-demo-toolbar">
            <span className="review-comments-logo">S</span>
            <strong>Demo review</strong>
            <span>Step 01 · Workspace overview</span>
          </div>
          <div className="review-comments-demo-screen">
            <span className="review-comments-demo-badge">Step 01</span>
            <h2>Show the first useful action</h2>
            <p>
              Every comment stays anchored to the demo context your team or viewer is reviewing.
            </p>
            <button type="button" className="review-comments-demo-cta">
              Next step →
            </button>
          </div>
          <div className="review-comments-demo-footer">
            <span>Draft preview</span>
            <span>Comments are visible in the review panel</span>
          </div>
        </div>
        <div className="review-comments-panel-host">
          {!open ? (
            <button type="button" className="review-comments-open" onClick={() => setOpen(true)}>
              Open {scope} comments
            </button>
          ) : null}
          <CommentsPanel
            workspaceId={workspaceId}
            targetType="demo"
            targetId={targetId}
            isOpen={open}
            onClose={() => setOpen(false)}
            client={client}
          />
        </div>
      </section>
      <p className="review-comments-note" role="note">
        This route uses an in-browser review store so you can exercise every interaction without a
        network request. The authenticated editor client uses the same bounded API contract for
        production workspaces.
      </p>
    </main>
  );
}
