import { MarketingHeader } from "./marketing-chrome";

const supportOptions = [
  ["▤", "Read the docs", "https://docs.supademo.com/"],
  ["↻", "View product changelog", "/blog/product-updates"],
  ["△", "Suggest a feature or report bug", "https://feedback.supademo.com/"],
  ["▥", "Check Supademo system status", "https://status.supademo.com/"]
] as const;

function HelpTourArt() {
  return (
    <div className="help-tour-art" role="img" aria-label="Supademo interactive product tour">
      <div className="help-tour-frame">
        <a
          className="help-tour-image-link"
          href="https://app.supademo.com/demo/cmex8c9qm8ribv9kqgbyjrqob?preview=true"
        >
          <img
            src="https://supademo.com/showcase/X649gsmCFcTEx39uuz.avif"
            alt="Supademo interactive product tour"
            loading="eager"
            referrerPolicy="no-referrer"
          />
          <span className="sr-only">View interactive product tour</span>
        </a>
        <a
          className="help-tour-cta"
          href="https://app.supademo.com/demo/cmex8c9qm8ribv9kqgbyjrqob?preview=true"
        >
          View interactive product tour <span aria-hidden="true">→</span>
        </a>
      </div>
    </div>
  );
}

export function MarketingHelp() {
  return (
    <main className="help-page" id="main">
      <MarketingHeader />
      <section className="help-hero" aria-labelledby="help-title">
        <article className="help-copy">
          <h1 id="help-title">We&apos;re here to help</h1>
          <p>Reach out to us with your preferred method, and we&apos;ll get back to you quickly.</p>
          <div className="help-option-list" aria-label="Supademo support options">
            {supportOptions.map(([icon, label, href]) => (
              <a href={href} key={label}>
                <span aria-hidden="true">{icon}</span>
                <strong>{label}</strong>
                <i aria-hidden="true">→</i>
              </a>
            ))}
          </div>
        </article>
        <HelpTourArt />
      </section>
    </main>
  );
}
