import type { DemoDocument, DemoHotspot } from "./demo-document.js";
import { reorderSteps } from "./demo-step-operations.js";

export interface EditorCommand {
  readonly name: string;
  execute(document: DemoDocument): DemoDocument;
  undo(document: DemoDocument): DemoDocument;
}

export const MAX_COMMAND_HISTORY_SIZE = 100;

export class CommandHistory {
  private undoStack: EditorCommand[] = [];
  private redoStack: EditorCommand[] = [];

  constructor(
    private currentDocument: DemoDocument,
    private readonly maxHistory = MAX_COMMAND_HISTORY_SIZE
  ) {}

  getDocument(): DemoDocument {
    return this.currentDocument;
  }

  canUndo(): boolean {
    return this.undoStack.length > 0;
  }

  canRedo(): boolean {
    return this.redoStack.length > 0;
  }

  executeCommand(command: EditorCommand): DemoDocument {
    const nextDoc = command.execute(this.currentDocument);
    this.currentDocument = nextDoc;
    this.undoStack.push(command);
    this.redoStack = []; // Clear redo stack on new command

    if (this.undoStack.length > this.maxHistory) {
      this.undoStack.shift(); // Evict oldest
    }

    return this.currentDocument;
  }

  undo(): DemoDocument {
    if (!this.canUndo()) return this.currentDocument;
    const command = this.undoStack.pop()!;
    const prevDoc = command.undo(this.currentDocument);
    this.currentDocument = prevDoc;
    this.redoStack.push(command);
    return this.currentDocument;
  }

  redo(): DemoDocument {
    if (!this.canRedo()) return this.currentDocument;
    const command = this.redoStack.pop()!;
    const nextDoc = command.execute(this.currentDocument);
    this.currentDocument = nextDoc;
    this.undoStack.push(command);
    return this.currentDocument;
  }

  clear(): void {
    this.undoStack = [];
    this.redoStack = [];
  }
}

// ── Command Implementations ────────────────────────────────────────────────

export class UpdateStepTitleCommand implements EditorCommand {
  readonly name = "Update Step Title";

  constructor(
    private readonly stepId: string,
    private readonly oldTitle: string,
    private readonly newTitle: string
  ) {}

  execute(document: DemoDocument): DemoDocument {
    const updatedSteps = document.steps.map((s) =>
      s.id === this.stepId ? Object.freeze({ ...s, title: this.newTitle }) : s
    );
    return Object.freeze({ ...document, steps: Object.freeze(updatedSteps) });
  }

  undo(document: DemoDocument): DemoDocument {
    const updatedSteps = document.steps.map((s) =>
      s.id === this.stepId ? Object.freeze({ ...s, title: this.oldTitle }) : s
    );
    return Object.freeze({ ...document, steps: Object.freeze(updatedSteps) });
  }
}

export class AddHotspotCommand implements EditorCommand {
  readonly name = "Add Hotspot";

  constructor(
    private readonly stepId: string,
    private readonly hotspot: DemoHotspot
  ) {}

  execute(document: DemoDocument): DemoDocument {
    const updatedSteps = document.steps.map((s) =>
      s.id === this.stepId
        ? Object.freeze({ ...s, hotspots: Object.freeze([...s.hotspots, this.hotspot]) })
        : s
    );
    return Object.freeze({ ...document, steps: Object.freeze(updatedSteps) });
  }

  undo(document: DemoDocument): DemoDocument {
    const updatedSteps = document.steps.map((s) =>
      s.id === this.stepId
        ? Object.freeze({
            ...s,
            hotspots: Object.freeze(s.hotspots.filter((h) => h.id !== this.hotspot.id))
          })
        : s
    );
    return Object.freeze({ ...document, steps: Object.freeze(updatedSteps) });
  }
}

export class ReorderStepsCommand implements EditorCommand {
  readonly name = "Reorder Steps";

  constructor(
    private readonly fromIndex: number,
    private readonly toIndex: number
  ) {}

  execute(document: DemoDocument): DemoDocument {
    const reordered = reorderSteps(document.steps, this.fromIndex, this.toIndex);
    return Object.freeze({ ...document, steps: reordered });
  }

  undo(document: DemoDocument): DemoDocument {
    const restored = reorderSteps(document.steps, this.toIndex, this.fromIndex);
    return Object.freeze({ ...document, steps: restored });
  }
}
