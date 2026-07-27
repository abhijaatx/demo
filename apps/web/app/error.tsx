"use client";

import { useEffect } from "react";
import { reportFrontendError } from "../src/lib/error-reporting";

export default function Error({
  error,
  reset
}: {
  readonly error: Error & { digest?: string };
  readonly reset: () => void;
}) {
  useEffect(() => {
    reportFrontendError(error, {
      component: "app-error-boundary",
      ...(error.digest === undefined ? {} : { digest: error.digest })
    });
  }, [error]);

  return (
    <main className="state-screen">
      <span className="state-kicker">Something went wrong</span>
      <h1>We couldn’t load this workspace.</h1>
      <p>Your work is safe. Try again, or return to the home page.</p>
      <div className="hero-actions">
        <button className="button button-primary" type="button" onClick={reset}>
          Try again
        </button>
        <a className="button button-secondary" href="/">
          Go home
        </a>
      </div>
    </main>
  );
}
