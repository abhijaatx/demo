export default function NotFound() {
  return (
    <main className="state-screen">
      <span className="state-kicker">Page not found</span>
      <h1>That demo page isn’t here.</h1>
      <p>It may have moved, or the link may be out of date.</p>
      <a className="button button-primary" href="/">
        Return home <span aria-hidden="true">→</span>
      </a>
    </main>
  );
}
