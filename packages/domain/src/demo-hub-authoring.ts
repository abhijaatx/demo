/**
 * Demo Hub Authoring & Publication Engine — TASK-152
 */

import type { DemoHubConfig, DemoHubCategory } from "./demo-hub-schema.js";

export function addCategoryToHub(hub: DemoHubConfig, category: DemoHubCategory): DemoHubConfig {
  if (hub.categories.some((c) => c.categoryId === category.categoryId)) {
    throw new Error(`Category ID '${category.categoryId}' already exists in Hub.`);
  }

  return Object.freeze({
    ...hub,
    categories: Object.freeze([...hub.categories, category])
  });
}

export function publishDemoHub(hub: DemoHubConfig): DemoHubConfig {
  if (hub.categories.length === 0) {
    throw new Error("Cannot publish Demo Hub with zero categories.");
  }

  return Object.freeze({
    ...hub,
    isPublished: true
  });
}
