"use client";

import { useCallback, useEffect, useState } from "react";
import { fetchApiHealth, type ApiClientState } from "../src/lib/api-client";

export function ApiStatusCard() {
  const [state, setState] = useState<ApiClientState>({ status: "checking" });

  const checkApi = useCallback(async () => {
    setState({ status: "checking" });
    try {
      const health = await fetchApiHealth();
      setState({ status: "online", service: health.service, checkedAt: new Date() });
    } catch {
      setState({ status: navigator.onLine ? "offline" : "no-network", checkedAt: new Date() });
    }
  }, []);

  useEffect(() => {
    void checkApi();
  }, [checkApi]);

  const isOnline = state.status === "online";
  const isChecking = state.status === "checking";
  return (
    <section className="panel api-panel" aria-labelledby="api-heading">
      <div className="panel-heading">
        <div>
          <p className="eyebrow">Connection</p>
          <h2 id="api-heading">Workspace services</h2>
        </div>
        <span className={`connection-icon ${isOnline ? "online" : ""}`} aria-hidden="true" />
      </div>
      <div
        className={`api-status ${isOnline ? "online" : isChecking ? "checking" : "offline"}`}
        aria-live="polite"
      >
        <span className="api-status-dot" />
        <span>
          {isChecking
            ? "Checking API…"
            : isOnline
              ? "API is ready"
              : state.status === "no-network"
                ? "You appear to be offline"
                : "API is unavailable"}
        </span>
      </div>
      <p className="api-description">
        {isOnline
          ? "Your workspace is ready for the next step."
          : isChecking
            ? "Checking local services and connection."
            : "You can keep exploring. We’ll retry when you ask."}
      </p>
      {!isOnline && (
        <button
          className="retry-button"
          type="button"
          onClick={() => void checkApi()}
          disabled={isChecking}
        >
          {isChecking ? "Checking…" : "Retry connection"}
        </button>
      )}
      {isOnline && <span className="api-meta">Connected to {state.service}</span>}
    </section>
  );
}
