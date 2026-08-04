import { MarketingFooter, MarketingHeader } from "./marketing-chrome";

export function MarketingNotFoundPage() {
  return (
    <main className="marketing-not-found-page" id="main">
      <MarketingHeader />
      <section className="marketing-not-found-hero" aria-labelledby="marketing-not-found-title">
        <div className="marketing-not-found-inner">
          <div className="marketing-not-found-copy">
            <div className="marketing-not-found-code" aria-hidden="true">
              <h1>404</h1>
              <div />
            </div>
            <h2 id="marketing-not-found-title">Page Not Found</h2>
            <p>
              Sorry, we couldn&apos;t find the page you&apos;re looking for. The page may have been
              moved, deleted, or never existed.
            </p>
            <div className="marketing-not-found-actions">
              <a className="marketing-button" href="/">
                Go to Homepage
              </a>
              <a className="marketing-button marketing-button-outline" href="/help">
                Contact Support
              </a>
            </div>
            <div className="marketing-not-found-links">
              <p>You might be looking for:</p>
              <div>
                <a href="/features">Features</a>
                <span aria-hidden="true">•</span>
                <a href="/pricing">Pricing</a>
                <span aria-hidden="true">•</span>
                <a href="/use-cases">Use Cases</a>
                <span aria-hidden="true">•</span>
                <a href="https://docs.supademo.com">Documentation</a>
                <span aria-hidden="true">•</span>
                <a href="/signup">Sign Up</a>
              </div>
            </div>
          </div>
        </div>
      </section>
      <MarketingFooter />
    </main>
  );
}
