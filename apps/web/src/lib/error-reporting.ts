export interface FrontendErrorContext {
  readonly component?: string;
  readonly digest?: string;
  readonly route?: string;
}

export interface FrontendErrorEvent {
  readonly name: string;
  readonly message: string;
  readonly component?: string;
  readonly digest?: string;
  readonly route?: string;
}

export type FrontendErrorSink = (event: FrontendErrorEvent) => void;

export interface FrontendErrorReporter {
  report(error: unknown, context?: FrontendErrorContext): void;
}

let activeReporter: FrontendErrorReporter = createFrontendErrorReporter();

export function createFrontendErrorReporter(sink?: FrontendErrorSink): FrontendErrorReporter {
  return {
    report: (error, context = {}) => {
      if (sink === undefined) {
        return;
      }
      try {
        sink(createErrorEvent(error, context));
      } catch {
        // Error reporting must never replace the application error boundary.
      }
    }
  };
}

export function configureFrontendErrorReporter(reporter: FrontendErrorReporter): void {
  activeReporter = reporter;
}

export function reportFrontendError(error: unknown, context?: FrontendErrorContext): void {
  try {
    activeReporter.report(error, context);
  } catch {
    // Error reporting must never break recovery UI.
  }
}

function createErrorEvent(error: unknown, context: FrontendErrorContext): FrontendErrorEvent {
  const source = error instanceof Error ? error : new Error("Unknown frontend error.");
  const event: FrontendErrorEvent = {
    name: source.name.slice(0, 100),
    message: redactMessage(source.message),
    ...(context.component === undefined ? {} : { component: context.component.slice(0, 100) }),
    ...(context.digest === undefined ? {} : { digest: redactMessage(context.digest, 128) }),
    ...(context.route === undefined ? {} : { route: sanitizeRoute(context.route) })
  };
  return event;
}

function redactMessage(value: string, maximumLength = 500): string {
  return value
    .replace(
      /((?:password|secret|token|authorization|cookie|api[-_]?key)=)[^\s&]+/giu,
      "$1[REDACTED]"
    )
    .slice(0, maximumLength);
}

function sanitizeRoute(value: string): string {
  try {
    return new URL(value, window.location.origin).pathname.slice(0, 500);
  } catch {
    return "/unknown";
  }
}
