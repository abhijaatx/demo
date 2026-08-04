/**
 * Isolated Clone Rendering Boundary & Content-Security-Policy (CSP) Config — TASK-145
 */

export interface CloneRenderBoundaryConfig {
  readonly bundleId: string;
  readonly cloneOrigin: string;
  readonly cspHeader: string;
  readonly iframeSandbox: string;
}

export function createCloneRenderBoundaryConfig(bundleId: string): CloneRenderBoundaryConfig {
  return Object.freeze({
    bundleId,
    cloneOrigin: "https://clones.supademo.com",
    cspHeader:
      "default-src 'none'; style-src 'unsafe-inline' https://cdn.supademo.com; img-src data: https://cdn.supademo.com; sandbox allow-same-origin;",
    iframeSandbox: "allow-same-origin"
  });
}
