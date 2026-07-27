export type ContentHealthStatus = "healthy" | "needs_review" | "stale";

export type ContentHealthScore = Readonly<{
  score: number;
  status: ContentHealthStatus;
  reasons: readonly string[];
}>;

export function calculateDemoContentHealth(
  demo: Readonly<{
    title: string;
    description?: string | null;
    updatedAt: string;
    isTemplate?: boolean;
  }>,
  stepCount = 1,
  hasCoverAsset = false,
  commentCount = 0,
  nowIso?: string
): ContentHealthScore {
  let score = 100;
  const reasons: string[] = [];

  const now = nowIso ? new Date(nowIso) : new Date();
  const updated = new Date(demo.updatedAt);
  const ageInDays = Math.max(0, (now.getTime() - updated.getTime()) / (1000 * 60 * 60 * 24));

  if (ageInDays > 90) {
    score -= 35;
    reasons.push("Demo has not been updated in over 90 days.");
  } else if (ageInDays > 30) {
    score -= 15;
    reasons.push("Demo has not been updated in over 30 days.");
  }

  if (!demo.description || demo.description.trim().length === 0) {
    score -= 20;
    reasons.push("Missing description.");
  }

  if (stepCount < 3) {
    score -= 20;
    reasons.push("Contains fewer than 3 interactive steps.");
  }

  if (!hasCoverAsset) {
    score -= 15;
    reasons.push("Missing cover media asset.");
  }

  if (commentCount > 5) {
    score -= 10;
    reasons.push("Has unresolved discussion volume requiring review.");
  }

  const finalScore = Math.max(0, Math.min(100, Math.round(score)));
  let status: ContentHealthStatus = "healthy";
  if (finalScore < 60) {
    status = "stale";
  } else if (finalScore < 85) {
    status = "needs_review";
  }

  return Object.freeze({
    score: finalScore,
    status,
    reasons: Object.freeze(reasons)
  });
}
