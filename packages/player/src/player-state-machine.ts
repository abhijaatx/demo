/**
 * Shared Framework-Independent Player State Machine — TASK-075
 */

import type { DemoDocument } from "@supademo/domain";

export type PlayerState = "idle" | "loading" | "playing" | "paused" | "completed" | "error";

export interface PlayerMachineContext {
  readonly state: PlayerState;
  readonly document: DemoDocument | null;
  readonly currentStepIndex: number;
  readonly history: readonly number[];
  readonly errorMessage: string | null;
}

export class PlayerStateMachine {
  private ctx: PlayerMachineContext;
  private listeners: Array<(ctx: PlayerMachineContext) => void> = [];

  constructor(initialDocument: DemoDocument | null = null) {
    this.ctx = Object.freeze({
      state: initialDocument ? "playing" : "idle",
      document: initialDocument,
      currentStepIndex: 0,
      history: [0],
      errorMessage: null
    });
  }

  getContext(): PlayerMachineContext {
    return this.ctx;
  }

  subscribe(listener: (ctx: PlayerMachineContext) => void): () => void {
    this.listeners.push(listener);
    return () => {
      this.listeners = this.listeners.filter((l) => l !== listener);
    };
  }

  loadDocument(document: DemoDocument): void {
    if (!document || !Array.isArray(document.steps) || document.steps.length === 0) {
      this.transition({
        state: "error",
        document: null,
        currentStepIndex: 0,
        history: [],
        errorMessage: "Demo document is empty or malformed."
      });
      return;
    }

    this.transition({
      state: "playing",
      document,
      currentStepIndex: 0,
      history: [0],
      errorMessage: null
    });
  }

  nextStep(): void {
    if (!this.ctx.document || this.ctx.state === "completed" || this.ctx.state === "error") {
      return;
    }

    const total = this.ctx.document.steps.length;
    const nextIdx = this.ctx.currentStepIndex + 1;

    if (nextIdx >= total) {
      this.transition({
        ...this.ctx,
        state: "completed"
      });
    } else {
      this.transition({
        ...this.ctx,
        state: "playing",
        currentStepIndex: nextIdx,
        history: Object.freeze([...this.ctx.history, nextIdx])
      });
    }
  }

  prevStep(): void {
    if (!this.ctx.document || this.ctx.history.length <= 1) {
      return;
    }

    const prevHistory = [...this.ctx.history];
    prevHistory.pop();
    const prevIdx = prevHistory[prevHistory.length - 1] ?? 0;

    this.transition({
      ...this.ctx,
      state: "playing",
      currentStepIndex: prevIdx,
      history: Object.freeze(prevHistory)
    });
  }

  gotoStep(stepIndex: number): void {
    if (!this.ctx.document || stepIndex < 0 || stepIndex >= this.ctx.document.steps.length) {
      return;
    }

    this.transition({
      ...this.ctx,
      state: "playing",
      currentStepIndex: stepIndex,
      history: Object.freeze([...this.ctx.history, stepIndex])
    });
  }

  pause(): void {
    if (this.ctx.state === "playing") {
      this.transition({ ...this.ctx, state: "paused" });
    }
  }

  resume(): void {
    if (this.ctx.state === "paused") {
      this.transition({ ...this.ctx, state: "playing" });
    }
  }

  restart(): void {
    if (!this.ctx.document) return;
    this.transition({
      ...this.ctx,
      state: "playing",
      currentStepIndex: 0,
      history: Object.freeze([0])
    });
  }

  private transition(nextCtx: PlayerMachineContext): void {
    this.ctx = Object.freeze(nextCtx);
    this.listeners.forEach((l) => l(this.ctx));
  }
}
