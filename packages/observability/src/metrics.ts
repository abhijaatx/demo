import type { MetricLabels, Metrics } from "./types.js";

export interface MetricsSnapshot {
  readonly counters: Readonly<Record<string, number>>;
  readonly observations: Readonly<
    Record<string, { readonly count: number; readonly sum: number; readonly max: number }>
  >;
}

export class InMemoryMetrics implements Metrics {
  private readonly counters = new Map<string, number>();
  private readonly observations = new Map<string, { count: number; sum: number; max: number }>();

  increment(name: string, value = 1, labels: MetricLabels = {}): void {
    const key = metricKey(name, labels);
    this.counters.set(key, (this.counters.get(key) ?? 0) + value);
  }

  observe(name: string, value: number, labels: MetricLabels = {}): void {
    if (!Number.isFinite(value)) {
      return;
    }
    const key = metricKey(name, labels);
    const current = this.observations.get(key) ?? {
      count: 0,
      sum: 0,
      max: Number.NEGATIVE_INFINITY
    };
    current.count += 1;
    current.sum += value;
    current.max = Math.max(current.max, value);
    this.observations.set(key, current);
  }

  snapshot(): MetricsSnapshot {
    return {
      counters: Object.fromEntries(this.counters),
      observations: Object.fromEntries(this.observations)
    };
  }
}

export const noopMetrics: Metrics = {
  increment: () => undefined,
  observe: () => undefined
};

export function protectMetrics(metrics: Metrics): Metrics {
  return {
    increment: (name, value, labels) => {
      try {
        metrics.increment(name, value, labels);
      } catch {
        // Metrics failures must not interrupt application work.
      }
    },
    observe: (name, value, labels) => {
      try {
        metrics.observe(name, value, labels);
      } catch {
        // Metrics failures must not interrupt application work.
      }
    }
  };
}

function metricKey(name: string, labels: MetricLabels): string {
  const safeName = /^[a-z][a-z0-9_.-]{0,127}$/u.test(name) ? name : "invalid_metric";
  const safeLabels = Object.entries(labels)
    .filter(([key, value]) => /^[a-z][a-z0-9_]{0,31}$/u.test(key) && value.length <= 64)
    .sort(([left], [right]) => left.localeCompare(right))
    .map(
      ([key, value]) =>
        `${key}=${/(?:email|user|ip|token|secret|password|cookie|authorization)/iu.test(key) ? "[REDACTED]" : value.replaceAll(/[|=]/gu, "_")}`
    )
    .join("|");
  return safeLabels.length === 0 ? safeName : `${safeName}|${safeLabels}`;
}
