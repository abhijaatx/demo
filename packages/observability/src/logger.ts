import { getCorrelationContext } from "./context.js";
import { redactLogFields } from "./redaction.js";
import type { LogFields, LogLevel, Logger } from "./types.js";

export interface LogSink {
  write(line: string): void;
}

export interface JsonLoggerOptions {
  readonly service: string;
  readonly sink?: LogSink;
  readonly now?: () => string;
}

export function createJsonLogger(options: JsonLoggerOptions): Logger {
  const sink = options.sink ?? { write: (line: string) => process.stdout.write(line) };
  const now = options.now ?? (() => new Date().toISOString());
  return {
    debug: (message, fields) => writeLog(sink, now, options.service, "debug", message, fields),
    info: (message, fields) => writeLog(sink, now, options.service, "info", message, fields),
    warn: (message, fields) => writeLog(sink, now, options.service, "warn", message, fields),
    error: (message, fields) => writeLog(sink, now, options.service, "error", message, fields)
  };
}

export const noopLogger: Logger = {
  debug: () => undefined,
  info: () => undefined,
  warn: () => undefined,
  error: () => undefined
};

export function protectLogger(logger: Logger): Logger {
  return {
    debug: (message, fields) => protect(() => logger.debug(message, fields)),
    info: (message, fields) => protect(() => logger.info(message, fields)),
    warn: (message, fields) => protect(() => logger.warn(message, fields)),
    error: (message, fields) => protect(() => logger.error(message, fields))
  };
}

function writeLog(
  sink: LogSink,
  now: () => string,
  service: string,
  level: LogLevel,
  message: string,
  fields: LogFields | undefined
): void {
  try {
    const context = getCorrelationContext();
    const record = {
      timestamp: now(),
      level,
      service,
      message: message.slice(0, 200),
      ...(context === undefined ? {} : redactLogFields(context as unknown as LogFields)),
      ...(fields === undefined ? {} : redactLogFields(fields))
    };
    sink.write(`${JSON.stringify(record)}\n`);
  } catch {
    // Logging must never interrupt request or job execution.
  }
}

function protect(operation: () => void): void {
  try {
    operation();
  } catch {
    // A telemetry backend outage must not become an application outage.
  }
}
