/**
 * Editor Keyboard & Productivity Controls — TASK-059
 */

export type ShortcutAction =
  | "save"
  | "undo"
  | "redo"
  | "duplicate"
  | "delete"
  | "zoomIn"
  | "zoomOut"
  | "resetZoom"
  | "nextStep"
  | "prevStep"
  | "openPalette"
  | "toggleHelp";

export interface ShortcutDefinition {
  readonly action: ShortcutAction;
  readonly label: string;
  readonly category: "General" | "Editing" | "Navigation" | "Canvas";
  readonly key: string;
  readonly metaOrCtrl?: boolean;
  readonly shift?: boolean;
  readonly alt?: boolean;
  readonly allowInInput?: boolean;
}

export const SHORTCUT_REGISTRY: readonly ShortcutDefinition[] = Object.freeze([
  { action: "save", label: "Save draft", category: "General", key: "s", metaOrCtrl: true },
  { action: "undo", label: "Undo action", category: "Editing", key: "z", metaOrCtrl: true },
  {
    action: "redo",
    label: "Redo action",
    category: "Editing",
    key: "z",
    metaOrCtrl: true,
    shift: true
  },
  {
    action: "duplicate",
    label: "Duplicate step/element",
    category: "Editing",
    key: "d",
    metaOrCtrl: true
  },
  { action: "delete", label: "Delete selection", category: "Editing", key: "Backspace" },
  { action: "zoomIn", label: "Zoom in canvas", category: "Canvas", key: "=", metaOrCtrl: true },
  { action: "zoomOut", label: "Zoom out canvas", category: "Canvas", key: "-", metaOrCtrl: true },
  {
    action: "resetZoom",
    label: "Reset zoom (100%)",
    category: "Canvas",
    key: "0",
    metaOrCtrl: true
  },
  { action: "nextStep", label: "Next step", category: "Navigation", key: "ArrowDown" },
  { action: "prevStep", label: "Previous step", category: "Navigation", key: "ArrowUp" },
  {
    action: "openPalette",
    label: "Open command palette",
    category: "General",
    key: "k",
    metaOrCtrl: true
  },
  {
    action: "toggleHelp",
    label: "Toggle shortcut help",
    category: "General",
    key: "?",
    shift: true
  }
]);

export function shouldIgnoreShortcut(
  activeElementTag: string | null,
  isEditable: boolean,
  shortcut: ShortcutDefinition
): boolean {
  if (shortcut.allowInInput) return false;
  if (isEditable) return true;
  if (!activeElementTag) return false;
  const tag = activeElementTag.toLowerCase();
  return tag === "input" || tag === "textarea" || tag === "select";
}

export function matchShortcut(
  key: string,
  modifiers: { metaOrCtrl?: boolean; shift?: boolean; alt?: boolean }
): ShortcutAction | null {
  for (const def of SHORTCUT_REGISTRY) {
    const keyMatch = def.key.toLowerCase() === key.toLowerCase();
    const metaMatch = Boolean(def.metaOrCtrl) === Boolean(modifiers.metaOrCtrl);
    const shiftMatch = Boolean(def.shift) === Boolean(modifiers.shift);
    const altMatch = Boolean(def.alt) === Boolean(modifiers.alt);

    if (keyMatch && metaMatch && shiftMatch && altMatch) {
      return def.action;
    }
  }
  return null;
}
