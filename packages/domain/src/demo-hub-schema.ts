/**
 * In-App Demo Hub Domain Model & Categorization Schemas — TASK-151
 */

export interface DemoHubCategory {
  readonly categoryId: string;
  readonly title: string;
  readonly demoIds: readonly string[];
}

export interface DemoHubConfig {
  readonly hubId: string;
  readonly workspaceId: string;
  readonly title: string;
  readonly categories: readonly DemoHubCategory[];
  readonly isPublished: boolean;
}

export function createDemoHubConfig(
  hubId: string,
  workspaceId: string,
  title: string,
  categories: readonly DemoHubCategory[] = []
): DemoHubConfig {
  if (!hubId.trim() || !workspaceId.trim() || !title.trim()) {
    throw new Error("Hub ID, workspace ID, and title are required.");
  }

  return Object.freeze({
    hubId: hubId.trim(),
    workspaceId: workspaceId.trim(),
    title: title.trim(),
    categories: Object.freeze([...categories]),
    isPublished: false
  });
}
