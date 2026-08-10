import assert from "node:assert/strict";
import { test } from "node:test";
import { qualify1000UserPerformanceBenchmark } from "@supademo/domain";

test("qualify1000UserPerformanceBenchmark verifies p95/p99 latency and error rate targets", () => {
  const bench = qualify1000UserPerformanceBenchmark();

  assert.equal(bench.isPassed, true);
  assert.equal(bench.p95LatencyMs < 200, true);
  assert.equal(bench.p99LatencyMs < 500, true);
  assert.equal(bench.errorRatePercent < 0.1, true);
});
