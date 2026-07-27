import assert from "node:assert/strict";
import test from "node:test";
import { calculateDemoContentHealth } from "../packages/domain/dist/index.js";

test("content health score calculation is deterministic and accounts for freshness, steps, and activity", () => {
  const now = "2026-07-12T00:00:00.000Z";

  // Healthy demo (fresh, has description, 5 steps, cover asset)
  const healthy = calculateDemoContentHealth(
    {
      title: "Product Onboarding",
      description: "Step-by-step walkthrough",
      updatedAt: "2026-07-10T00:00:00.000Z"
    },
    5,
    true,
    0,
    now
  );
  assert.equal(healthy.score, 100);
  assert.equal(healthy.status, "healthy");
  assert.equal(healthy.reasons.length, 0);

  // Needs review (35 days old, missing cover media)
  const needsReview = calculateDemoContentHealth(
    {
      title: "Feature Overview",
      description: "Detailed feature tour",
      updatedAt: "2026-06-01T00:00:00.000Z"
    },
    4,
    false,
    2,
    now
  );
  assert.equal(needsReview.score, 70);
  assert.equal(needsReview.status, "needs_review");
  assert.ok(needsReview.reasons.includes("Demo has not been updated in over 30 days."));
  assert.ok(needsReview.reasons.includes("Missing cover media asset."));

  // Stale demo (> 90 days old, missing description, 1 step)
  const stale = calculateDemoContentHealth(
    { title: "Old Demo", description: "", updatedAt: "2026-01-01T00:00:00.000Z" },
    1,
    false,
    0,
    now
  );
  assert.equal(stale.score, 10);
  assert.equal(stale.status, "stale");
  assert.ok(stale.reasons.includes("Demo has not been updated in over 90 days."));
  assert.ok(stale.reasons.includes("Missing description."));
});

test("dashboard filtering and content health scoring remains under 50ms for 5,000 items", () => {
  const items = Array.from({ length: 5000 }, (_, i) => ({
    id: `018f0f7e-9b7d-7c4b-8c1b-1c0f2e6e${i.toString(16).padStart(4, "0")}`,
    title: `Demo Workspace Item ${i}`,
    description: i % 2 === 0 ? "Automated demo item description" : "",
    updatedAt: new Date(Date.now() - (i % 120) * 86_400_000).toISOString(),
    isTemplate: i % 10 === 0
  }));

  const start = performance.now();
  const scored = items.map((item) => ({
    ...item,
    health: calculateDemoContentHealth(
      item,
      (item.title.length % 5) + 1,
      item.description.length > 0,
      0
    )
  }));
  const filtered = scored.filter((item) => item.health.status === "stale");
  const elapsed = performance.now() - start;

  assert.ok(scored.length === 5000);
  assert.ok(filtered.length > 0);
  assert.ok(elapsed < 50, `Filtering 5,000 items took ${elapsed}ms, expected < 50ms`);
});
