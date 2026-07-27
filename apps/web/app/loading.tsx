export default function Loading() {
  return (
    <main className="loading-screen" aria-busy="true" aria-label="Loading workspace">
      <span className="loading-mark" aria-hidden="true">
        S
      </span>
      <span className="loading-line" />
      <span className="loading-line short" />
    </main>
  );
}
