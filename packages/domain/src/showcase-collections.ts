/**
 * Showcase Collections Model & Operations — TASK-087
 */

export interface DemoShowcaseCollection {
  readonly id: string;
  readonly title: string;
  readonly description: string | null;
  readonly coverImageUrl: string | null;
  readonly demoIds: readonly string[];
  readonly isPublished: boolean;
}

export function parseDemoShowcase(input: unknown): DemoShowcaseCollection {
  if (!input || typeof input !== "object") {
    throw new Error("Showcase input must be an object.");
  }

  const raw = input as Record<string, unknown>;

  const id =
    typeof raw["id"] === "string" && raw["id"].trim() ? raw["id"].trim() : `showcase-${Date.now()}`;
  const title =
    typeof raw["title"] === "string" && raw["title"].trim()
      ? raw["title"].trim()
      : "Untitled Showcase";
  const description = typeof raw["description"] === "string" ? raw["description"] : null;
  const coverImageUrl = typeof raw["coverImageUrl"] === "string" ? raw["coverImageUrl"] : null;

  const rawDemoIds = Array.isArray(raw["demoIds"]) ? raw["demoIds"] : [];
  const demoIds = rawDemoIds.filter(
    (id): id is string => typeof id === "string" && Boolean(id.trim())
  );

  const isPublished = Boolean(raw["isPublished"]);

  return Object.freeze({
    id,
    title,
    description,
    coverImageUrl,
    demoIds: Object.freeze(demoIds),
    isPublished
  });
}

export function addDemoToShowcase(
  showcase: DemoShowcaseCollection,
  demoId: string
): DemoShowcaseCollection {
  if (showcase.demoIds.includes(demoId)) return showcase;
  return Object.freeze({
    ...showcase,
    demoIds: Object.freeze([...showcase.demoIds, demoId])
  });
}

export function removeDemoFromShowcase(
  showcase: DemoShowcaseCollection,
  demoId: string
): DemoShowcaseCollection {
  return Object.freeze({
    ...showcase,
    demoIds: Object.freeze(showcase.demoIds.filter((id) => id !== demoId))
  });
}

export function reorderShowcaseDemos(
  showcase: DemoShowcaseCollection,
  fromIndex: number,
  toIndex: number
): DemoShowcaseCollection {
  if (
    fromIndex < 0 ||
    fromIndex >= showcase.demoIds.length ||
    toIndex < 0 ||
    toIndex >= showcase.demoIds.length ||
    fromIndex === toIndex
  ) {
    return showcase;
  }

  const copy = [...showcase.demoIds];
  const [moved] = copy.splice(fromIndex, 1);
  if (!moved) return showcase;
  copy.splice(toIndex, 0, moved);

  return Object.freeze({
    ...showcase,
    demoIds: Object.freeze(copy)
  });
}
