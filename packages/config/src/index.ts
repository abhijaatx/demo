export const packageName = "@supademo/config" as const;

export type RuntimeEnvironment = "local" | "test" | "staging" | "production";
export type ConfigSource = "env" | "aws";
export type IdentityProviderKind = "local" | "cognito";
export type LogLevel = "trace" | "debug" | "info" | "warn" | "error" | "fatal";

export interface AppConfig {
  readonly app: {
    readonly environment: RuntimeEnvironment;
    readonly source: ConfigSource;
    readonly host: string;
    readonly port: number;
    readonly logLevel: LogLevel;
    readonly allowedOrigins: readonly string[];
  };
  readonly aws: {
    readonly region: string;
    readonly accessKeyId: string | undefined;
    readonly secretAccessKey: string | undefined;
  };
  readonly database: {
    readonly url: string;
  };
  readonly redis: {
    readonly url: string;
  };
  readonly objectStorage: {
    readonly endpoint: string;
    readonly buckets: {
      readonly raw: string;
      readonly processed: string;
      readonly published: string;
      readonly exports: string;
    };
  };
  readonly queue: {
    readonly endpoint: string;
    readonly name: string;
    readonly deadLetterName: string;
    readonly visibilityTimeoutSeconds: number;
    readonly maxAttempts: number;
    readonly pollWaitSeconds: number;
  };
  readonly email: {
    readonly host: string;
    readonly port: number;
    readonly from: string;
  };
  readonly auth: {
    readonly provider: IdentityProviderKind;
    readonly issuer: string | undefined;
    readonly audience: string;
  };
}

export interface ConfigIssue {
  readonly path: string;
  readonly message: string;
}

export class ConfigurationError extends Error {
  readonly issues: readonly ConfigIssue[];

  constructor(issues: readonly ConfigIssue[]) {
    super(
      `Configuration validation failed: ${issues.map((issue) => `${issue.path} ${issue.message}`).join(" ")}`
    );
    this.name = "ConfigurationError";
    this.issues = Object.freeze([...issues]);
  }
}

export class ConfigProviderError extends Error {
  constructor(provider: string, key: string) {
    super(`${provider} lookup failed for ${key}.`);
    this.name = "ConfigProviderError";
  }
}

export interface EnvironmentVariables {
  readonly [key: string]: string | undefined;
}

export interface ConfigValueProvider {
  getSecret(key: string): Promise<string | undefined>;
  getParameter(key: string): Promise<string | undefined>;
}

export class EnvironmentConfigProvider implements ConfigValueProvider {
  constructor(private readonly environment: EnvironmentVariables) {}

  getSecret(key: string): Promise<string | undefined> {
    return Promise.resolve(this.environment[key]);
  }

  getParameter(key: string): Promise<string | undefined> {
    return Promise.resolve(this.environment[key]);
  }
}

export interface SecretsManagerClientLike {
  send(command: unknown): Promise<SecretsManagerResponse>;
}

export interface SecretsManagerResponse {
  readonly SecretString?: string;
  readonly SecretBinary?: string | Uint8Array | ArrayBuffer;
}

export interface ParameterStoreClientLike {
  send(command: unknown): Promise<ParameterStoreResponse>;
}

export interface ParameterStoreResponse {
  readonly Parameter?: {
    readonly Value?: string;
  };
}

export type GetSecretValueCommandFactory = (input: { SecretId: string }) => unknown;
export type GetParameterCommandFactory = (input: {
  Name: string;
  WithDecryption: boolean;
}) => unknown;

export class AwsSecretsManagerProvider {
  constructor(
    private readonly client: SecretsManagerClientLike,
    private readonly createCommand: GetSecretValueCommandFactory,
    private readonly prefix = ""
  ) {}

  async getSecret(key: string): Promise<string | undefined> {
    const secretId = prefixedKey(this.prefix, key);
    let response: SecretsManagerResponse;
    try {
      response = await this.client.send(this.createCommand({ SecretId: secretId }));
    } catch {
      throw new ConfigProviderError("AWS Secrets Manager", secretId);
    }

    if (typeof response.SecretString === "string") {
      return response.SecretString;
    }

    return decodeSecretBinary(response.SecretBinary);
  }
}

export class AwsParameterStoreProvider {
  constructor(
    private readonly client: ParameterStoreClientLike,
    private readonly createCommand: GetParameterCommandFactory,
    private readonly prefix = ""
  ) {}

  async getParameter(key: string): Promise<string | undefined> {
    const name = prefixedKey(this.prefix, key);
    let response: ParameterStoreResponse;
    try {
      response = await this.client.send(this.createCommand({ Name: name, WithDecryption: true }));
    } catch {
      throw new ConfigProviderError("AWS Systems Manager Parameter Store", name);
    }

    return response.Parameter?.Value;
  }
}

export class CompositeConfigProvider implements ConfigValueProvider {
  constructor(
    private readonly secrets: Pick<ConfigValueProvider, "getSecret">,
    private readonly parameters: Pick<ConfigValueProvider, "getParameter">
  ) {}

  getSecret(key: string): Promise<string | undefined> {
    return this.secrets.getSecret(key);
  }

  getParameter(key: string): Promise<string | undefined> {
    return this.parameters.getParameter(key);
  }
}

export interface LoadConfigOptions {
  readonly env?: EnvironmentVariables;
  readonly provider?: ConfigValueProvider;
}

const AWS_PARAMETER_KEYS = [
  "AUTH_PROVIDER",
  "AUTH_ISSUER",
  "AUTH_AUDIENCE",
  "CORS_ALLOWED_ORIGINS",
  "HOST",
  "PORT",
  "LOG_LEVEL",
  "S3_ENDPOINT",
  "S3_BUCKET_RAW",
  "S3_BUCKET_PROCESSED",
  "S3_BUCKET_PUBLISHED",
  "S3_BUCKET_EXPORTS",
  "SQS_ENDPOINT",
  "QUEUE_NAME",
  "QUEUE_DEAD_LETTER_NAME",
  "QUEUE_VISIBILITY_TIMEOUT_SECONDS",
  "QUEUE_MAX_ATTEMPTS",
  "QUEUE_POLL_WAIT_SECONDS",
  "SMTP_HOST",
  "SMTP_PORT",
  "SMTP_FROM"
] as const;

const AWS_SECRET_KEYS = ["DATABASE_URL", "REDIS_URL"] as const;

export async function loadConfig(options: LoadConfigOptions = {}): Promise<AppConfig> {
  const environment = options.env ?? process.env;
  const bootstrapIssues: ConfigIssue[] = [];
  const runtimeEnvironment = parseEnum(
    environment["APP_ENV"],
    "APP_ENV",
    ["local", "test", "staging", "production"],
    undefined,
    bootstrapIssues
  ) as RuntimeEnvironment | undefined;
  const source = parseEnum(
    environment["CONFIG_SOURCE"],
    "CONFIG_SOURCE",
    ["env", "aws"],
    undefined,
    bootstrapIssues
  ) as ConfigSource | undefined;

  if (runtimeEnvironment && source) {
    const sourceIsCompatible =
      runtimeEnvironment === "local" || runtimeEnvironment === "test"
        ? source === "env"
        : source === "aws";
    if (!sourceIsCompatible) {
      bootstrapIssues.push({
        path: "CONFIG_SOURCE",
        message: `must use ${runtimeEnvironment === "local" || runtimeEnvironment === "test" ? "env" : "aws"} for APP_ENV=${runtimeEnvironment}.`
      });
    }
  }

  if (bootstrapIssues.length > 0 || !runtimeEnvironment || !source) {
    throw new ConfigurationError(bootstrapIssues);
  }

  if (source === "env") {
    return parseEnvironmentConfig(environment, runtimeEnvironment, source);
  }

  if (!options.provider) {
    throw new ConfigurationError([
      {
        path: "CONFIG_SOURCE",
        message: "requires a Secrets Manager and Parameter Store provider."
      }
    ]);
  }

  const region = requiredValue(environment["AWS_REGION"], "AWS_REGION", []);
  if (!region.value) {
    throw new ConfigurationError(region.issues);
  }

  const resolved: Record<string, string | undefined> = {
    APP_ENV: runtimeEnvironment,
    CONFIG_SOURCE: source,
    AWS_REGION: region.value,
    AWS_SECRETS_PREFIX: environment["AWS_SECRETS_PREFIX"],
    AWS_PARAMETER_PREFIX: environment["AWS_PARAMETER_PREFIX"]
  };

  for (const key of AWS_PARAMETER_KEYS) {
    resolved[key] = await readProviderValue(options.provider, "parameter", key);
  }
  for (const key of AWS_SECRET_KEYS) {
    resolved[key] = await readProviderValue(options.provider, "secret", key);
  }

  return parseEnvironmentConfig(resolved, runtimeEnvironment, source);
}

export function redactConfig(config: AppConfig): Record<string, unknown> {
  return redactValue(config) as Record<string, unknown>;
}

function parseEnvironmentConfig(
  environment: EnvironmentVariables,
  runtimeEnvironment: RuntimeEnvironment,
  source: ConfigSource
): AppConfig {
  const issues: ConfigIssue[] = [];
  const useLocalDefaults = runtimeEnvironment === "local" || runtimeEnvironment === "test";
  const read = (key: string, fallback?: string, reportMissing = true) => {
    const raw = environment[key];
    if (raw === undefined && useLocalDefaults && fallback !== undefined) {
      return fallback;
    }
    if (raw === undefined && !reportMissing) {
      return undefined;
    }
    if (raw !== undefined && raw.trim().length === 0 && !reportMissing) {
      return raw.trim();
    }
    const result = requiredValue(raw, key, issues);
    return result.value;
  };
  const optional = (key: string) => {
    const raw = environment[key];
    if (raw === undefined) {
      return undefined;
    }
    if (raw.trim().length === 0) {
      issues.push({ path: key, message: "must not be empty." });
      return undefined;
    }
    return raw.trim();
  };

  const host = read("HOST", "127.0.0.1");
  const port = parsePort(read("PORT", "3001"), "PORT", issues);
  const logLevel = parseEnum(
    environment["LOG_LEVEL"],
    "LOG_LEVEL",
    ["trace", "debug", "info", "warn", "error", "fatal"],
    useLocalDefaults ? "info" : undefined,
    issues
  ) as LogLevel | undefined;
  const allowedOrigins = parseAllowedOrigins(
    read(
      "CORS_ALLOWED_ORIGINS",
      useLocalDefaults
        ? "http://localhost:3000,http://127.0.0.1:3000,http://10.2.13.175:3000"
        : undefined
    ),
    "CORS_ALLOWED_ORIGINS",
    issues
  );
  const region = parseRegion(
    read("AWS_REGION", useLocalDefaults ? "us-east-1" : undefined, false),
    "AWS_REGION",
    issues
  );
  const databaseUrl = parseUrl(
    read(
      "DATABASE_URL",
      useLocalDefaults
        ? "postgresql://supademo:supademo_local_postgres_change_me@127.0.0.1:5432/supademo_dev"
        : undefined,
      false
    ),
    "DATABASE_URL",
    ["postgres:", "postgresql:"],
    issues
  );
  const redisUrl = parseUrl(
    read(
      "REDIS_URL",
      useLocalDefaults ? "redis://:supademo_local_redis_change_me@127.0.0.1:6379" : undefined,
      false
    ),
    "REDIS_URL",
    ["redis:", "rediss:"],
    issues
  );
  const objectStorageEndpoint = parseUrl(
    read("S3_ENDPOINT", useLocalDefaults ? "http://127.0.0.1:9000" : undefined, false),
    "S3_ENDPOINT",
    ["http:", "https:"],
    issues
  );
  const queueEndpoint = parseUrl(
    read("SQS_ENDPOINT", useLocalDefaults ? "http://127.0.0.1:9324" : undefined, false),
    "SQS_ENDPOINT",
    ["http:", "https:"],
    issues
  );
  const queueName = parseQueueName(read("QUEUE_NAME", "demo-jobs", false), "QUEUE_NAME", issues);
  const deadLetterName = parseQueueName(
    read("QUEUE_DEAD_LETTER_NAME", "dead-letter", false),
    "QUEUE_DEAD_LETTER_NAME",
    issues
  );
  const visibilityTimeoutSeconds = parseInteger(
    read("QUEUE_VISIBILITY_TIMEOUT_SECONDS", "30", false),
    "QUEUE_VISIBILITY_TIMEOUT_SECONDS",
    1,
    43_200,
    issues
  );
  const maxAttempts = parseInteger(
    read("QUEUE_MAX_ATTEMPTS", "3", false),
    "QUEUE_MAX_ATTEMPTS",
    1,
    10,
    issues
  );
  const pollWaitSeconds = parseInteger(
    read("QUEUE_POLL_WAIT_SECONDS", "5", false),
    "QUEUE_POLL_WAIT_SECONDS",
    0,
    20,
    issues
  );
  const smtpHost = read("SMTP_HOST", "127.0.0.1");
  const smtpPort = parsePort(read("SMTP_PORT", "1025", false), "SMTP_PORT", issues, 1);
  const smtpFrom = parseEmail(
    read("SMTP_FROM", "no-reply@supademo.local", false),
    "SMTP_FROM",
    issues
  );
  const authProvider = parseEnum(
    environment["AUTH_PROVIDER"],
    "AUTH_PROVIDER",
    ["local", "cognito"],
    useLocalDefaults ? "local" : "cognito",
    issues
  ) as IdentityProviderKind | undefined;
  if (authProvider === "local" && !useLocalDefaults) {
    issues.push({
      path: "AUTH_PROVIDER",
      message: "must be cognito outside local and test environments."
    });
  }
  const authIssuer =
    authProvider === "cognito"
      ? parseUrl(read("AUTH_ISSUER", undefined), "AUTH_ISSUER", ["https:"], issues)
      : optional("AUTH_ISSUER");
  const authAudience = read("AUTH_AUDIENCE", useLocalDefaults ? "local-dev" : undefined);
  const buckets = {
    raw: parseBucket(read("S3_BUCKET_RAW", "supademo-raw", false), "S3_BUCKET_RAW", issues),
    processed: parseBucket(
      read("S3_BUCKET_PROCESSED", "supademo-processed", false),
      "S3_BUCKET_PROCESSED",
      issues
    ),
    published: parseBucket(
      read("S3_BUCKET_PUBLISHED", "supademo-published", false),
      "S3_BUCKET_PUBLISHED",
      issues
    ),
    exports: parseBucket(
      read("S3_BUCKET_EXPORTS", "supademo-exports", false),
      "S3_BUCKET_EXPORTS",
      issues
    )
  };
  const accessKeyId =
    source === "env"
      ? read("AWS_ACCESS_KEY_ID", useLocalDefaults ? "supademo-local" : undefined)
      : optional("AWS_ACCESS_KEY_ID");
  const secretAccessKey =
    source === "env"
      ? read("AWS_SECRET_ACCESS_KEY", useLocalDefaults ? "supademo-local-secret" : undefined)
      : optional("AWS_SECRET_ACCESS_KEY");

  if (issues.length > 0) {
    throw new ConfigurationError(issues);
  }

  return freezeConfig({
    app: {
      environment: runtimeEnvironment,
      source,
      host: host ?? "",
      port: port ?? 0,
      logLevel: logLevel ?? "info",
      allowedOrigins
    },
    aws: {
      region: region ?? "",
      accessKeyId,
      secretAccessKey
    },
    database: { url: databaseUrl ?? "" },
    redis: { url: redisUrl ?? "" },
    objectStorage: {
      endpoint: objectStorageEndpoint ?? "",
      buckets
    },
    queue: {
      endpoint: queueEndpoint ?? "",
      name: queueName,
      deadLetterName,
      visibilityTimeoutSeconds: visibilityTimeoutSeconds ?? 0,
      maxAttempts: maxAttempts ?? 0,
      pollWaitSeconds: pollWaitSeconds ?? 0
    },
    email: {
      host: smtpHost ?? "",
      port: smtpPort ?? 0,
      from: smtpFrom ?? ""
    },
    auth: {
      provider: authProvider ?? "local",
      issuer: authIssuer,
      audience: authAudience ?? ""
    }
  });
}

function requiredValue(
  value: string | undefined,
  path: string,
  issues: ConfigIssue[]
): { readonly value: string | undefined; readonly issues: readonly ConfigIssue[] } {
  if (value === undefined) {
    const issue = { path, message: "is required." };
    issues.push(issue);
    return { value: undefined, issues: [issue] };
  }
  if (value.trim().length === 0) {
    const issue = { path, message: "must not be empty." };
    issues.push(issue);
    return { value: undefined, issues: [issue] };
  }
  return { value: value.trim(), issues: [] };
}

function parseEnum(
  value: string | undefined,
  path: string,
  allowed: readonly string[],
  fallback: string | undefined,
  issues: ConfigIssue[]
): string | undefined {
  const raw = value ?? fallback;
  if (raw === undefined || raw.trim().length === 0) {
    issues.push({ path, message: "is required." });
    return undefined;
  }
  const normalized = raw.trim();
  if (!allowed.includes(normalized)) {
    issues.push({ path, message: `must be one of ${allowed.join(", ")}.` });
    return undefined;
  }
  return normalized;
}

function parsePort(
  value: string | undefined,
  path: string,
  issues: ConfigIssue[],
  minimum = 1024
): number | undefined {
  if (value === undefined) {
    issues.push({ path, message: "is required." });
    return undefined;
  }
  if (!/^\d+$/.test(value)) {
    issues.push({ path, message: "must be an integer." });
    return undefined;
  }
  const port = Number(value);
  if (!Number.isSafeInteger(port) || port < minimum || port > 65535) {
    issues.push({ path, message: `must be between ${minimum} and 65535.` });
    return undefined;
  }
  return port;
}

function parseInteger(
  value: string | undefined,
  path: string,
  minimum: number,
  maximum: number,
  issues: ConfigIssue[]
): number | undefined {
  if (value === undefined || !/^\d+$/u.test(value)) {
    issues.push({ path, message: "must be an integer." });
    return undefined;
  }
  const parsed = Number(value);
  if (!Number.isSafeInteger(parsed) || parsed < minimum || parsed > maximum) {
    issues.push({ path, message: `must be between ${minimum} and ${maximum}.` });
    return undefined;
  }
  return parsed;
}

function parseQueueName(value: string | undefined, path: string, issues: ConfigIssue[]): string {
  if (value === undefined || !/^[A-Za-z0-9][A-Za-z0-9_-]{0,79}$/u.test(value)) {
    issues.push({
      path,
      message:
        "must contain 1-80 letters, numbers, hyphens, or underscores and start with a letter or number."
    });
    return "";
  }
  return value;
}

function parseUrl(
  value: string | undefined,
  path: string,
  protocols: readonly string[],
  issues: ConfigIssue[]
): string | undefined {
  if (value === undefined) {
    issues.push({ path, message: "is required." });
    return undefined;
  }
  try {
    const parsed = new URL(value);
    if (!protocols.includes(parsed.protocol)) {
      issues.push({ path, message: `must use ${protocols.join(" or ")} protocol.` });
      return undefined;
    }
    if (!parsed.hostname) {
      issues.push({ path, message: "must include a hostname." });
      return undefined;
    }
    return value;
  } catch {
    issues.push({ path, message: "must be a valid URL." });
    return undefined;
  }
}

function parseAllowedOrigins(
  value: string | undefined,
  path: string,
  issues: ConfigIssue[]
): readonly string[] {
  if (value === undefined) {
    issues.push({ path, message: "is required." });
    return [];
  }
  const origins = value
    .split(",")
    .map((origin) => origin.trim())
    .filter(Boolean);
  if (origins.length === 0 || origins.length > 20 || new Set(origins).size !== origins.length) {
    issues.push({ path, message: "must contain 1-20 unique exact origins." });
    return [];
  }
  for (const origin of origins) {
    try {
      const parsed = new URL(origin);
      if (
        parsed.origin !== origin ||
        (parsed.protocol !== "https:" && parsed.protocol !== "http:") ||
        !parsed.hostname
      ) {
        throw new Error("invalid origin");
      }
    } catch {
      issues.push({
        path,
        message: "must contain exact HTTP(S) origins without wildcards or paths."
      });
      return [];
    }
  }
  return Object.freeze(origins);
}

function parseRegion(
  value: string | undefined,
  path: string,
  issues: ConfigIssue[]
): string | undefined {
  if (value === undefined) {
    issues.push({ path, message: "is required." });
    return undefined;
  }
  if (!/^[A-Za-z0-9-]{1,64}$/.test(value)) {
    issues.push({ path, message: "must be a valid AWS region name." });
    return undefined;
  }
  return value;
}

function parseBucket(value: string | undefined, path: string, issues: ConfigIssue[]): string {
  if (value === undefined) {
    issues.push({ path, message: "is required." });
    return "";
  }
  if (!/^[a-z0-9][a-z0-9.-]{1,61}[a-z0-9]$/.test(value)) {
    issues.push({ path, message: "must be a valid S3 bucket name." });
    return "";
  }
  return value;
}

function parseEmail(value: string | undefined, path: string, issues: ConfigIssue[]): string {
  if (value === undefined) {
    issues.push({ path, message: "is required." });
    return "";
  }
  if (/[\r\n]/.test(value) || !/^[^@\s]+@[^@\s]+$/.test(value)) {
    issues.push({ path, message: "must be a valid email address without control characters." });
    return "";
  }
  return value;
}

async function readProviderValue(
  provider: ConfigValueProvider,
  kind: "secret" | "parameter",
  key: string
): Promise<string | undefined> {
  try {
    return kind === "secret" ? await provider.getSecret(key) : await provider.getParameter(key);
  } catch {
    throw new ConfigurationError([
      {
        path: `${kind}.${key}`,
        message: "could not be loaded from the configured provider."
      }
    ]);
  }
}

function prefixedKey(prefix: string, key: string): string {
  if (prefix.length === 0) {
    return key;
  }
  return `${prefix.replace(/\/+$/, "")}/${key.replace(/^\/+/, "")}`;
}

function decodeSecretBinary(
  value: string | Uint8Array | ArrayBuffer | undefined
): string | undefined {
  if (typeof value === "string") {
    return value;
  }
  if (value instanceof Uint8Array) {
    return new TextDecoder().decode(value);
  }
  if (value instanceof ArrayBuffer) {
    return new TextDecoder().decode(new Uint8Array(value));
  }
  return undefined;
}

function redactValue(value: unknown, key = ""): unknown {
  if (isSensitiveKey(key)) {
    return "[REDACTED]";
  }
  if (Array.isArray(value)) {
    return value.map((entry) => redactValue(entry));
  }
  if (value && typeof value === "object") {
    return Object.fromEntries(
      Object.entries(value).map(([entryKey, entryValue]) => [
        entryKey,
        redactValue(entryValue, entryKey)
      ])
    );
  }
  return value;
}

function isSensitiveKey(key: string): boolean {
  return /(?:password|secret|token|authorization|cookie|accesskey|api[-_]?key|database\.url|redis\.url|^url$)/iu.test(
    key
  );
}

function freezeConfig(config: AppConfig): AppConfig {
  Object.freeze(config.app);
  Object.freeze(config.aws);
  Object.freeze(config.database);
  Object.freeze(config.redis);
  Object.freeze(config.objectStorage.buckets);
  Object.freeze(config.objectStorage);
  Object.freeze(config.queue);
  Object.freeze(config.email);
  return Object.freeze(config);
}
