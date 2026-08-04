"use client";

import { useMemo, useState } from "react";

type MetricKey = "monthlyVisits" | "bookingRate" | "winRate" | "acv" | "conversionLift";

type Metrics = Record<MetricKey, string>;

const metricBounds: Record<MetricKey, readonly [number, number]> = {
  monthlyVisits: [0, 1_000_000],
  bookingRate: [0, 100],
  winRate: [0, 100],
  acv: [0, 1_000_000],
  conversionLift: [0, 100]
};

const confidenceMultipliers = {
  conservative: 0.7,
  expected: 1,
  aggressive: 1.3
} as const;

const defaultMetrics: Metrics = {
  monthlyVisits: "5000",
  bookingRate: "3",
  winRate: "25",
  acv: "15000",
  conversionLift: "15"
};

const clampNumber = (value: string, min: number, max: number) => {
  const parsed = Number(value);
  if (!Number.isFinite(parsed)) return min;
  return Math.min(max, Math.max(min, parsed));
};

const formatCompactCurrency = (value: number) => {
  if (value >= 1_000_000) return `$${(value / 1_000_000).toFixed(1)}M`;
  if (value >= 1_000) return `$${Math.round(value / 1_000)}K`;
  return `$${Math.round(value).toLocaleString("en-US")}`;
};

const formatInteger = (value: number) => Math.round(value).toLocaleString("en-US");

export function RouteHubCalculator() {
  const [activeTab, setActiveTab] = useState("Sales");
  const [confidence, setConfidence] = useState<keyof typeof confidenceMultipliers>("expected");
  const [metrics, setMetrics] = useState<Metrics>(defaultMetrics);
  const [copyStatus, setCopyStatus] = useState("Copy link");

  const result = useMemo(() => {
    const visits = clampNumber(metrics.monthlyVisits, ...metricBounds.monthlyVisits);
    const bookingRate = clampNumber(metrics.bookingRate, ...metricBounds.bookingRate);
    const winRate = clampNumber(metrics.winRate, ...metricBounds.winRate);
    const acv = clampNumber(metrics.acv, ...metricBounds.acv);
    const conversionLift =
      clampNumber(metrics.conversionLift, ...metricBounds.conversionLift) *
      confidenceMultipliers[confidence];
    const incrementalOpps = Math.round(visits * 12 * (bookingRate / 100) * (conversionLift / 100));
    const incrementalDeals = Math.round(incrementalOpps * (winRate / 100));
    const arr = incrementalDeals * acv;

    return { arr, incrementalDeals, incrementalOpps, bookingRate, winRate, acv, conversionLift };
  }, [confidence, metrics]);

  const updateMetric = (key: MetricKey, value: string) => {
    setMetrics((current) => ({ ...current, [key]: value.slice(0, 12) }));
  };

  const normalizeMetric = (key: MetricKey) => {
    const [min, max] = metricBounds[key];
    setMetrics((current) => ({
      ...current,
      [key]: String(clampNumber(current[key], min, max))
    }));
  };

  const copyLink = async () => {
    try {
      await navigator.clipboard?.writeText(window.location.href);
      setCopyStatus("Copied");
      window.setTimeout(() => setCopyStatus("Copy link"), 1600);
    } catch {
      setCopyStatus("Copy unavailable");
      window.setTimeout(() => setCopyStatus("Copy link"), 1600);
    }
  };

  return (
    <div className="route-hub-calculator">
      <div
        className="route-hub-calculator-tabs"
        role="tablist"
        aria-label="Route Hub calculator use case"
      >
        {["Sales", "Onboarding", "Product Marketing", "Training"].map((tab) => (
          <button
            className={activeTab === tab ? "is-active" : undefined}
            key={tab}
            type="button"
            role="tab"
            aria-selected={activeTab === tab}
            onClick={() => setActiveTab(tab)}
          >
            {tab}
          </button>
        ))}
      </div>
      <p className="route-hub-calculator-context" aria-live="polite">
        Showing the potential impact of RouteHub for <strong>{activeTab.toLowerCase()}</strong>.
      </p>

      <div className="route-hub-calculator-grid">
        <section className="route-hub-metrics-card" aria-labelledby="route-hub-metrics-title">
          <div className="route-hub-card-heading">
            <div>
              <h3 id="route-hub-metrics-title">Add your metrics</h3>
            </div>
          </div>
          <div className="route-hub-confidence-block">
            <span>Confidence mode</span>
            <div className="route-hub-confidence" role="group" aria-label="Confidence level">
              {(
                Object.keys(confidenceMultipliers) as Array<keyof typeof confidenceMultipliers>
              ).map((level) => (
                <button
                  className={confidence === level ? "is-active" : undefined}
                  key={level}
                  type="button"
                  aria-pressed={confidence === level}
                  onClick={() => setConfidence(level)}
                >
                  {level}
                </button>
              ))}
            </div>
          </div>
          <div className="route-hub-metrics-fields">
            <label>
              <span>Monthly visits</span>
              <input
                inputMode="numeric"
                min="0"
                max="1000000"
                type="number"
                value={metrics.monthlyVisits}
                onBlur={() => normalizeMetric("monthlyVisits")}
                onChange={(event) => updateMetric("monthlyVisits", event.target.value)}
              />
            </label>
            <label>
              <span>Demo booking rate</span>
              <div className="route-hub-input-with-suffix">
                <input
                  inputMode="decimal"
                  min="0"
                  max="100"
                  step="0.1"
                  type="number"
                  value={metrics.bookingRate}
                  onBlur={() => normalizeMetric("bookingRate")}
                  onChange={(event) => updateMetric("bookingRate", event.target.value)}
                />
                <span aria-hidden="true">%</span>
              </div>
            </label>
            <label>
              <span>Win rate</span>
              <div className="route-hub-input-with-suffix">
                <input
                  inputMode="decimal"
                  min="0"
                  max="100"
                  step="0.1"
                  type="number"
                  value={metrics.winRate}
                  onBlur={() => normalizeMetric("winRate")}
                  onChange={(event) => updateMetric("winRate", event.target.value)}
                />
                <span aria-hidden="true">%</span>
              </div>
            </label>
            <label>
              <span>ACV</span>
              <div className="route-hub-input-with-suffix">
                <span aria-hidden="true">$</span>
                <input
                  inputMode="numeric"
                  min="0"
                  max="1000000"
                  type="number"
                  value={metrics.acv}
                  onBlur={() => normalizeMetric("acv")}
                  onChange={(event) => updateMetric("acv", event.target.value)}
                />
              </div>
            </label>
            <label className="route-hub-metric-wide">
              <span>Conversion lift with RouteHub</span>
              <div className="route-hub-input-with-suffix">
                <input
                  inputMode="decimal"
                  min="0"
                  max="100"
                  step="0.1"
                  type="number"
                  value={metrics.conversionLift}
                  onBlur={() => normalizeMetric("conversionLift")}
                  onChange={(event) => updateMetric("conversionLift", event.target.value)}
                />
                <span aria-hidden="true">%</span>
              </div>
            </label>
          </div>
          <details className="route-hub-advanced-assumptions">
            <summary>Advanced assumptions</summary>
            <p>
              Estimates use annualized visits and treat conversion lift as incremental opportunity
              creation. Change the inputs above to model your own scenario.
            </p>
          </details>
        </section>

        <section className="route-hub-result-card" aria-labelledby="route-hub-result-title">
          <div className="route-hub-card-heading">
            <div>
              <p className="route-hub-card-kicker">Estimated outcome</p>
              <h3 id="route-hub-result-title">RouteHub ROI</h3>
            </div>
            <span className="route-hub-result-badge">{confidence}</span>
          </div>
          <div className="route-hub-arr-block">
            <span>Incremental ARR / year</span>
            <strong>{formatCompactCurrency(result.arr)}</strong>
          </div>
          <div className="route-hub-result-stats">
            <div>
              <strong>{formatInteger(result.incrementalDeals)}</strong>
              <span>Incremental deals / year</span>
            </div>
            <div>
              <strong>{formatInteger(result.incrementalOpps)}</strong>
              <span>Incremental opps / year</span>
            </div>
          </div>
          <div className="route-hub-drivers">
            <h4>What drove this ROI?</h4>
            <ul>
              <li>
                +{Math.round(result.conversionLift)}% more opps from better routing + lower drop-off
              </li>
              <li>Win rate held constant at {Math.round(result.winRate)}%</li>
              <li>ACV assumed {formatCompactCurrency(result.acv)}</li>
            </ul>
          </div>
          <button className="route-hub-copy-link" type="button" onClick={copyLink}>
            <span aria-hidden="true">↗</span> {copyStatus}
          </button>
          <p className="route-hub-disclaimer">Estimates only. Actual results may vary.</p>
        </section>
      </div>
    </div>
  );
}
