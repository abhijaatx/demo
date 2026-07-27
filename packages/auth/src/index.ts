import { timingSafeEqual } from "node:crypto";

export const packageName = "@supademo/auth" as const;

export type AuthRuntimeEnvironment = "local" | "test" | "staging" | "production";
export type AuthProviderKind = "local" | "cognito";
export type AuthClock = () => number;

export type IdentityClaims = Readonly<{
  subject: string;
  email?: string;
  issuer: string;
  audience: string;
  expiresAt: number;
  issuedAt?: number;
  tokenUse: "access";
  provider: AuthProviderKind;
}>;

export interface IdentityProvider {
  readonly kind: AuthProviderKind;
  verifyAccessToken(token: string): Promise<IdentityClaims>;
}

export interface AuthSession {
  readonly sessionId: string;
  readonly subject: string;
  readonly provider: AuthProviderKind;
  /** The verified identity is retained only in the server-side session store. */
  readonly identity: IdentityClaims;
  /** A per-session CSRF secret. It must never be placed in an HttpOnly cookie. */
  readonly csrfToken?: string;
  readonly issuedAt: number;
  readonly authenticatedAt: number;
  readonly expiresAt: number;
}

export class AuthConfigurationError extends Error {
  constructor(message: string) {
    super(message);
    this.name = "AuthConfigurationError";
  }
}

export type AuthenticationErrorCode = "missing_token" | "invalid_token";

export class AuthenticationError extends Error {
  readonly code: AuthenticationErrorCode;
  readonly statusCode = 401 as const;

  constructor(code: AuthenticationErrorCode) {
    super(
      code === "missing_token" ? "Authentication is required." : "The access token is invalid."
    );
    this.name = "AuthenticationError";
    this.code = code;
  }
}

class InvalidAccessTokenError extends Error {
  constructor() {
    super("Invalid access token.");
    this.name = "InvalidAccessTokenError";
  }
}

const defaultClock: AuthClock = () => Math.floor(Date.now() / 1000);
const MAX_TOKEN_LENGTH = 8_192;
const MAX_SUBJECT_LENGTH = 256;
const MAX_ISSUER_LENGTH = 2_048;
const MAX_AUDIENCE_LENGTH = 512;

export interface LocalIdentityFixture {
  readonly token: string;
  readonly identity: Omit<IdentityClaims, "provider">;
}

export interface LocalIdentityProviderOptions {
  readonly environment: AuthRuntimeEnvironment;
  readonly fixtures: readonly LocalIdentityFixture[];
  readonly clock?: AuthClock;
}

export class LocalIdentityProvider implements IdentityProvider {
  readonly kind = "local" as const;
  private readonly fixtures: readonly LocalIdentityFixture[];
  private readonly clock: AuthClock;

  constructor(options: LocalIdentityProviderOptions) {
    if (options.environment !== "local" && options.environment !== "test") {
      throw new AuthConfigurationError(
        "The local identity provider is only available in local or test environments."
      );
    }
    if (options.fixtures.length > 100) {
      throw new AuthConfigurationError("The local identity fixture limit is 100.");
    }
    const seenTokens = new Set<string>();
    for (const fixture of options.fixtures) {
      if (!isBoundedToken(fixture.token) || seenTokens.has(fixture.token)) {
        throw new AuthConfigurationError("Local identity fixtures must use unique bounded tokens.");
      }
      seenTokens.add(fixture.token);
    }
    this.fixtures = Object.freeze([...options.fixtures]);
    this.clock = options.clock ?? defaultClock;
  }

  async verifyAccessToken(token: string): Promise<IdentityClaims> {
    if (!isBoundedToken(token)) throw new InvalidAccessTokenError();
    const fixture = this.fixtures.find((candidate) => constantTimeEqual(candidate.token, token));
    if (!fixture) throw new InvalidAccessTokenError();
    return validateIdentityClaims({ ...fixture.identity, provider: "local" }, this.clock());
  }
}

export type CognitoSignatureVerifier = (token: string) => Promise<unknown>;

export interface CognitoIdentityProviderOptions {
  readonly environment: Extract<AuthRuntimeEnvironment, "staging" | "production">;
  readonly issuer: string;
  readonly audience: string;
  /** Implemented by the deployment adapter using Cognito JWKS signature verification. */
  readonly verifySignature: CognitoSignatureVerifier;
  readonly clock?: AuthClock;
  readonly clockSkewSeconds?: number;
}

export class CognitoIdentityProvider implements IdentityProvider {
  readonly kind = "cognito" as const;
  private readonly issuer: string;
  private readonly audience: string;
  private readonly verifySignature: CognitoSignatureVerifier;
  private readonly clock: AuthClock;
  private readonly clockSkewSeconds: number;

  constructor(options: CognitoIdentityProviderOptions) {
    if (!isHttpsUrl(options.issuer)) {
      throw new AuthConfigurationError("The Cognito issuer must be an HTTPS URL.");
    }
    if (!isBoundedString(options.audience, 1, MAX_AUDIENCE_LENGTH)) {
      throw new AuthConfigurationError("The Cognito audience must be a bounded value.");
    }
    const clockSkewSeconds = options.clockSkewSeconds ?? 0;
    if (!Number.isInteger(clockSkewSeconds) || clockSkewSeconds < 0 || clockSkewSeconds > 300) {
      throw new AuthConfigurationError(
        "Cognito clock skew must be an integer from 0 to 300 seconds."
      );
    }
    this.issuer = options.issuer;
    this.audience = options.audience;
    this.verifySignature = options.verifySignature;
    this.clock = options.clock ?? defaultClock;
    this.clockSkewSeconds = clockSkewSeconds;
  }

  async verifyAccessToken(token: string): Promise<IdentityClaims> {
    if (!isBoundedToken(token)) throw new InvalidAccessTokenError();
    let rawClaims: unknown;
    try {
      rawClaims = await this.verifySignature(token);
    } catch {
      throw new InvalidAccessTokenError();
    }
    try {
      return parseCognitoClaims(
        rawClaims,
        this.issuer,
        this.audience,
        this.clock(),
        this.clockSkewSeconds
      );
    } catch {
      throw new InvalidAccessTokenError();
    }
  }
}

export type RequestHeaders = Readonly<{
  readonly authorization?: string | readonly string[] | undefined;
}>;

export function extractBearerToken(headers: RequestHeaders): string | undefined {
  const authorization = headers.authorization;
  if (typeof authorization !== "string") return undefined;
  const match = /^Bearer ([^\s]+)$/u.exec(authorization);
  const token = match?.[1];
  return token && isBoundedToken(token) ? token : undefined;
}

export interface AuthenticatedRequestContext {
  readonly identity: IdentityClaims;
}

export interface AuthenticationMiddlewareOptions {
  readonly clock?: AuthClock;
}

export function createAuthenticationMiddleware(
  provider: IdentityProvider,
  options: AuthenticationMiddlewareOptions = {}
): (headers: RequestHeaders) => Promise<AuthenticatedRequestContext> {
  const clock = options.clock ?? defaultClock;
  return async (headers: RequestHeaders): Promise<AuthenticatedRequestContext> => {
    const token = extractBearerToken(headers);
    if (!token) throw new AuthenticationError("missing_token");
    try {
      const identity = validateIdentityClaims(await provider.verifyAccessToken(token), clock());
      return { identity };
    } catch (error) {
      if (error instanceof AuthenticationError) throw error;
      throw new AuthenticationError("invalid_token");
    }
  };
}

export function validateIdentityClaims(value: unknown, now = defaultClock()): IdentityClaims {
  const record = asRecord(value);
  const subject = boundedClaimString(record, "subject", "sub", MAX_SUBJECT_LENGTH);
  const issuer = boundedClaimString(record, "issuer", "iss", MAX_ISSUER_LENGTH);
  const audience = boundedClaimString(record, "audience", "aud", MAX_AUDIENCE_LENGTH);
  const expiresAt = boundedClaimNumber(record, "expiresAt", "exp");
  const issuedAt = readOptionalNumber(record, "issuedAt", "iat");
  const email = readOptionalEmailClaim(record);
  const provider = record["provider"];
  const tokenUse = record["tokenUse"];
  if (provider !== "local" && provider !== "cognito") throw new InvalidAccessTokenError();
  if (tokenUse !== "access") throw new InvalidAccessTokenError();
  if (expiresAt <= now) throw new InvalidAccessTokenError();
  if (issuedAt !== undefined && issuedAt > now + 300) throw new InvalidAccessTokenError();
  const identity: IdentityClaims = {
    subject,
    issuer,
    audience,
    expiresAt,
    tokenUse,
    provider
  };
  return {
    ...identity,
    ...(email === undefined ? {} : { email }),
    ...(issuedAt === undefined ? {} : { issuedAt })
  };
}

export function createAuthSession(
  identity: IdentityClaims,
  sessionId: string,
  now = defaultClock(),
  csrfToken?: string
): AuthSession {
  const validIdentity = validateIdentityClaims(identity, now);
  if (!isBoundedString(sessionId, 1, 256)) {
    throw new AuthConfigurationError("The session identifier must be a bounded opaque value.");
  }
  if (csrfToken !== undefined && !isBoundedString(csrfToken, 16, 256)) {
    throw new AuthConfigurationError("The CSRF token must be a bounded opaque value.");
  }
  return Object.freeze({
    sessionId,
    subject: validIdentity.subject,
    provider: validIdentity.provider,
    identity: validIdentity,
    issuedAt: now,
    authenticatedAt: now,
    expiresAt: validIdentity.expiresAt,
    ...(csrfToken === undefined ? {} : { csrfToken })
  });
}

export function isAuthSessionActive(session: AuthSession, now = defaultClock()): boolean {
  return (
    isBoundedString(session.sessionId, 1, 256) &&
    isBoundedString(session.subject, 1, MAX_SUBJECT_LENGTH) &&
    session.expiresAt > now
  );
}

export interface AuthSessionStore {
  create(session: AuthSession): Promise<void>;
  getActive(sessionId: string): Promise<AuthSession | undefined>;
  revoke(sessionId: string): Promise<void>;
  revokeSubject(subject: string): Promise<void>;
}

/**
 * A bounded local/test implementation. Production adapters must use a shared,
 * durable store so revocations apply across all API instances.
 */
export class InMemoryAuthSessionStore implements AuthSessionStore {
  private readonly sessions = new Map<string, AuthSession>();
  private readonly clock: AuthClock;
  private readonly maxEntries: number;

  constructor(options: { readonly clock?: AuthClock; readonly maxEntries?: number } = {}) {
    this.clock = options.clock ?? defaultClock;
    this.maxEntries = Math.min(100_000, Math.max(100, Math.floor(options.maxEntries ?? 10_000)));
  }

  async create(session: AuthSession): Promise<void> {
    if (!isAuthSessionActive(session, this.clock())) {
      throw new AuthConfigurationError("An expired or invalid session cannot be stored.");
    }
    this.pruneExpired();
    if (!this.sessions.has(session.sessionId) && this.sessions.size >= this.maxEntries) {
      const oldest = this.sessions.keys().next().value;
      if (typeof oldest === "string") this.sessions.delete(oldest);
    }
    this.sessions.set(session.sessionId, session);
  }

  async getActive(sessionId: string): Promise<AuthSession | undefined> {
    if (!isBoundedString(sessionId, 1, 256)) return undefined;
    const session = this.sessions.get(sessionId);
    if (!session) return undefined;
    if (!isAuthSessionActive(session, this.clock())) {
      this.sessions.delete(sessionId);
      return undefined;
    }
    return session;
  }

  async revoke(sessionId: string): Promise<void> {
    if (isBoundedString(sessionId, 1, 256)) this.sessions.delete(sessionId);
  }

  async revokeSubject(subject: string): Promise<void> {
    if (!isBoundedString(subject, 1, MAX_SUBJECT_LENGTH)) return;
    for (const [sessionId, session] of this.sessions) {
      if (session.subject === subject) this.sessions.delete(sessionId);
    }
  }

  private pruneExpired(): void {
    for (const [sessionId, session] of this.sessions) {
      if (!isAuthSessionActive(session, this.clock())) this.sessions.delete(sessionId);
    }
  }
}

export function hasRecentAuthentication(
  session: AuthSession,
  maxAgeSeconds: number,
  now = defaultClock()
): boolean {
  return (
    isAuthSessionActive(session, now) &&
    Number.isInteger(maxAgeSeconds) &&
    maxAgeSeconds >= 60 &&
    maxAgeSeconds <= 86_400 &&
    now - session.authenticatedAt <= maxAgeSeconds
  );
}

export type AuthProviderOperationErrorCode =
  "already_exists" | "invalid_credentials" | "invalid_code" | "expired_code" | "unavailable";

export class AuthProviderOperationError extends Error {
  readonly code: AuthProviderOperationErrorCode;

  constructor(code: AuthProviderOperationErrorCode) {
    super("The identity provider could not complete the requested operation.");
    this.name = "AuthProviderOperationError";
    this.code = code;
  }
}

export type AuthWorkflowErrorCode =
  "invalid_input" | "invalid_credentials" | "invalid_code" | "expired_code" | "service_unavailable";

export class AuthWorkflowError extends Error {
  readonly code: AuthWorkflowErrorCode;
  readonly statusCode: 400 | 401 | 503;

  constructor(code: AuthWorkflowErrorCode) {
    const messageByCode: Record<AuthWorkflowErrorCode, string> = {
      invalid_input: "Enter the requested information in the expected format.",
      invalid_credentials: "The email or password is incorrect.",
      invalid_code: "That code is not valid.",
      expired_code: "That code has expired. Request a new one.",
      service_unavailable: "Authentication is temporarily unavailable. Try again later."
    };
    super(messageByCode[code]);
    this.name = "AuthWorkflowError";
    this.code = code;
    this.statusCode =
      code === "invalid_credentials" ? 401 : code === "service_unavailable" ? 503 : 400;
  }
}

export interface AuthWorkflowProvider {
  signUp(input: { readonly email: string; readonly password: string }): Promise<void>;
  confirmEmail(input: { readonly email: string; readonly code: string }): Promise<void>;
  signIn(input: { readonly email: string; readonly password: string }): Promise<{
    readonly identity: IdentityClaims;
  }>;
  signOut(): Promise<void>;
  requestPasswordReset(input: { readonly email: string }): Promise<void>;
  resetPassword(input: {
    readonly email: string;
    readonly code: string;
    readonly password: string;
  }): Promise<void>;
  refreshSession(): Promise<{ readonly identity: IdentityClaims }>;
}

export type AuthRateLimitPolicy = Readonly<{
  maxAttempts: number;
  windowSeconds: number;
}>;

export type AuthRateLimitResult = Readonly<{
  allowed: boolean;
  retryAfterSeconds: number;
}>;

export interface AuthRateLimiter {
  check(key: string, policy: AuthRateLimitPolicy): Promise<AuthRateLimitResult>;
}

export class AuthRateLimitError extends Error {
  readonly statusCode = 429 as const;
  readonly retryAfterSeconds: number;

  constructor(retryAfterSeconds: number) {
    super("Too many authentication attempts. Try again later.");
    this.name = "AuthRateLimitError";
    this.retryAfterSeconds = retryAfterSeconds;
  }
}

export const authRateLimitPolicies = Object.freeze({
  signUp: { maxAttempts: 5, windowSeconds: 900 },
  signIn: { maxAttempts: 10, windowSeconds: 300 },
  emailVerification: { maxAttempts: 10, windowSeconds: 900 },
  passwordReset: { maxAttempts: 5, windowSeconds: 900 },
  sessionRefresh: { maxAttempts: 30, windowSeconds: 300 }
} satisfies Record<string, AuthRateLimitPolicy>);

export class InMemoryAuthRateLimiter implements AuthRateLimiter {
  private readonly buckets = new Map<string, { startedAt: number; attempts: number }>();
  private readonly clock: AuthClock;
  private readonly maxEntries: number;

  constructor(options: { readonly clock?: AuthClock; readonly maxEntries?: number } = {}) {
    this.clock = options.clock ?? defaultClock;
    this.maxEntries = Math.min(10_000, Math.max(100, Math.floor(options.maxEntries ?? 10_000)));
  }

  async check(key: string, policy: AuthRateLimitPolicy): Promise<AuthRateLimitResult> {
    if (!isBoundedString(key, 1, 256))
      throw new AuthConfigurationError("The rate-limit key is invalid.");
    if (
      !Number.isInteger(policy.maxAttempts) ||
      policy.maxAttempts < 1 ||
      policy.maxAttempts > 1_000
    ) {
      throw new AuthConfigurationError("The rate-limit policy is invalid.");
    }
    if (
      !Number.isInteger(policy.windowSeconds) ||
      policy.windowSeconds < 1 ||
      policy.windowSeconds > 86_400
    ) {
      throw new AuthConfigurationError("The rate-limit policy window is invalid.");
    }
    const now = this.clock();
    const current = this.buckets.get(key);
    if (!current || now - current.startedAt >= policy.windowSeconds) {
      this.ensureCapacity(key);
      this.buckets.set(key, { startedAt: now, attempts: 1 });
      return { allowed: true, retryAfterSeconds: 0 };
    }
    if (current.attempts >= policy.maxAttempts) {
      return {
        allowed: false,
        retryAfterSeconds: Math.max(1, policy.windowSeconds - (now - current.startedAt))
      };
    }
    current.attempts += 1;
    return { allowed: true, retryAfterSeconds: 0 };
  }

  private ensureCapacity(key: string): void {
    if (this.buckets.has(key) || this.buckets.size < this.maxEntries) return;
    const firstKey = this.buckets.keys().next().value;
    if (typeof firstKey === "string") this.buckets.delete(firstKey);
  }
}

export type AuthWorkflowResult = Readonly<{
  message: string;
  verificationRequired?: boolean;
  /** Internal server-only result used to establish an opaque browser session. */
  identity?: IdentityClaims;
}>;

export class AuthWorkflowService {
  private readonly provider: AuthWorkflowProvider;
  private readonly rateLimiter: AuthRateLimiter;

  constructor(options: {
    readonly provider: AuthWorkflowProvider;
    readonly rateLimiter: AuthRateLimiter;
  }) {
    this.provider = options.provider;
    this.rateLimiter = options.rateLimiter;
  }

  async signUp(
    input: { readonly email: string; readonly password: string },
    rateKey: string
  ): Promise<AuthWorkflowResult> {
    await this.enforceRateLimit("signUp", rateKey);
    const email = normalizeAuthEmail(input.email);
    const password = validateAuthPassword(input.password);
    try {
      await this.provider.signUp({ email, password });
    } catch (error) {
      if (!(error instanceof AuthProviderOperationError) || error.code !== "already_exists") {
        throw mapProviderError(error);
      }
    }
    return { message: "Check your email to continue.", verificationRequired: true };
  }

  async confirmEmail(
    input: { readonly email: string; readonly code: string },
    rateKey: string
  ): Promise<AuthWorkflowResult> {
    await this.enforceRateLimit("emailVerification", rateKey);
    const email = normalizeAuthEmail(input.email);
    const code = normalizeVerificationCode(input.code);
    try {
      await this.provider.confirmEmail({ email, code });
    } catch (error) {
      throw mapProviderError(error);
    }
    return { message: "Email verified. You can sign in." };
  }

  async signIn(
    input: { readonly email: string; readonly password: string },
    rateKey: string
  ): Promise<AuthWorkflowResult> {
    await this.enforceRateLimit("signIn", rateKey);
    const email = normalizeAuthEmail(input.email);
    const password = validateAuthPassword(input.password);
    try {
      const { identity } = await this.provider.signIn({ email, password });
      return { message: "Signed in.", identity: validateIdentityClaims(identity) };
    } catch (error) {
      throw mapProviderError(error);
    }
  }

  async signOut(): Promise<AuthWorkflowResult> {
    try {
      await this.provider.signOut();
    } catch (error) {
      throw mapProviderError(error);
    }
    return { message: "Signed out." };
  }

  async requestPasswordReset(
    input: { readonly email: string },
    rateKey: string
  ): Promise<AuthWorkflowResult> {
    await this.enforceRateLimit("passwordReset", rateKey);
    const email = normalizeAuthEmail(input.email);
    try {
      await this.provider.requestPasswordReset({ email });
    } catch {
      // Deliberately return the same response for known and unknown accounts.
    }
    return { message: "If an account matches, we’ll send a reset email." };
  }

  async resetPassword(
    input: { readonly email: string; readonly code: string; readonly password: string },
    rateKey: string
  ): Promise<AuthWorkflowResult> {
    await this.enforceRateLimit("passwordReset", rateKey);
    const email = normalizeAuthEmail(input.email);
    const code = normalizeVerificationCode(input.code);
    const password = validateAuthPassword(input.password);
    try {
      await this.provider.resetPassword({ email, code, password });
    } catch (error) {
      throw mapProviderError(error);
    }
    return { message: "Your password was updated. You can sign in." };
  }

  async refreshSession(rateKey: string): Promise<AuthWorkflowResult> {
    await this.enforceRateLimit("sessionRefresh", rateKey);
    try {
      const { identity } = await this.provider.refreshSession();
      return { message: "Session refreshed.", identity: validateIdentityClaims(identity) };
    } catch (error) {
      throw mapProviderError(error);
    }
  }

  private async enforceRateLimit(
    operation: keyof typeof authRateLimitPolicies,
    rateKey: string
  ): Promise<void> {
    const result = await this.rateLimiter.check(rateKey, authRateLimitPolicies[operation]);
    if (!result.allowed) throw new AuthRateLimitError(result.retryAfterSeconds);
  }
}

export function normalizeAuthEmail(value: string): string {
  if (typeof value !== "string") throw new AuthWorkflowError("invalid_input");
  const email = value.trim().toLowerCase();
  if (email.length > 254 || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/u.test(email)) {
    throw new AuthWorkflowError("invalid_input");
  }
  return email;
}

export function validateAuthPassword(value: string): string {
  if (
    typeof value !== "string" ||
    value.length < 8 ||
    value.length > 128 ||
    /[\r\n]/u.test(value)
  ) {
    throw new AuthWorkflowError("invalid_input");
  }
  return value;
}

export function normalizeVerificationCode(value: string): string {
  if (typeof value !== "string" || !/^\d{4,12}$/u.test(value.trim())) {
    throw new AuthWorkflowError("invalid_code");
  }
  return value.trim();
}

export interface SessionCookiePolicy {
  readonly name: string;
  readonly httpOnly: true;
  readonly secure: boolean;
  readonly sameSite: "lax";
  readonly path: "/";
  readonly maxAgeSeconds: number;
}

export function createSessionCookiePolicy(
  environment: AuthRuntimeEnvironment,
  maxAgeSeconds = 3_600
): SessionCookiePolicy {
  if (!Number.isInteger(maxAgeSeconds) || maxAgeSeconds < 60 || maxAgeSeconds > 86_400) {
    throw new AuthConfigurationError("Session cookie lifetime is invalid.");
  }
  const secure = environment === "staging" || environment === "production";
  return Object.freeze({
    name: secure ? "__Host-supademo_session" : "supademo_session",
    httpOnly: true,
    secure,
    sameSite: "lax",
    path: "/",
    maxAgeSeconds
  });
}

function mapProviderError(error: unknown): AuthWorkflowError {
  if (error instanceof AuthProviderOperationError) {
    if (error.code === "invalid_credentials") return new AuthWorkflowError("invalid_credentials");
    if (error.code === "invalid_code") return new AuthWorkflowError("invalid_code");
    if (error.code === "expired_code") return new AuthWorkflowError("expired_code");
  }
  return new AuthWorkflowError("service_unavailable");
}

function parseCognitoClaims(
  value: unknown,
  expectedIssuer: string,
  expectedAudience: string,
  now: number,
  clockSkewSeconds: number
): IdentityClaims {
  const record = asRecord(value);
  const issuer = readString(record["iss"]);
  if (issuer !== expectedIssuer) throw new InvalidAccessTokenError();
  const audiences = readStringArray(record["aud"]);
  const clientId = readOptionalString(record["client_id"]);
  if (!audiences.includes(expectedAudience) && clientId !== expectedAudience) {
    throw new InvalidAccessTokenError();
  }
  if (record["token_use"] !== "access") throw new InvalidAccessTokenError();
  const subject = readString(record["sub"]);
  const expiresAt = readNumber(record["exp"]);
  const issuedAt = readOptionalNumber(record, "iat");
  const email = readOptionalEmailClaim(record);
  if (!isBoundedString(subject, 1, MAX_SUBJECT_LENGTH)) throw new InvalidAccessTokenError();
  if (!Number.isInteger(expiresAt) || expiresAt <= now - clockSkewSeconds) {
    throw new InvalidAccessTokenError();
  }
  if (
    issuedAt !== undefined &&
    (!Number.isInteger(issuedAt) || issuedAt > now + clockSkewSeconds)
  ) {
    throw new InvalidAccessTokenError();
  }
  const identity: IdentityClaims = {
    subject,
    issuer,
    audience: expectedAudience,
    expiresAt,
    tokenUse: "access",
    provider: "cognito"
  };
  return {
    ...identity,
    ...(email === undefined ? {} : { email }),
    ...(issuedAt === undefined ? {} : { issuedAt })
  };
}

function asRecord(value: unknown): Record<string, unknown> {
  if (typeof value !== "object" || value === null || Array.isArray(value)) {
    throw new InvalidAccessTokenError();
  }
  return value as Record<string, unknown>;
}

function boundedClaimString(
  record: Record<string, unknown>,
  normalizedKey: string,
  rawKey: string,
  maximum: number
): string {
  const value = readString(record[normalizedKey] ?? record[rawKey]);
  if (!isBoundedString(value, 1, maximum)) throw new InvalidAccessTokenError();
  return value;
}

function readOptionalEmailClaim(record: Record<string, unknown>): string | undefined {
  const value = readOptionalString(record["email"]);
  if (value === undefined) return undefined;
  if (
    !isBoundedString(value, 3, 320) ||
    hasControlCharacters(value) ||
    !/^[^\s@]+@[^\s@]+\.[^\s@]+$/u.test(value)
  ) {
    throw new InvalidAccessTokenError();
  }
  return value.trim().toLowerCase();
}

function boundedClaimNumber(
  record: Record<string, unknown>,
  normalizedKey: string,
  rawKey: string
): number {
  const value = readNumber(record[normalizedKey] ?? record[rawKey]);
  if (!Number.isInteger(value) || value <= 0) throw new InvalidAccessTokenError();
  return value;
}

function readOptionalNumber(
  record: Record<string, unknown>,
  normalizedKey: string,
  rawKey = normalizedKey
): number | undefined {
  const value = record[normalizedKey] ?? record[rawKey];
  if (value === undefined) return undefined;
  return readNumber(value);
}

function readString(value: unknown): string {
  if (typeof value !== "string") throw new InvalidAccessTokenError();
  return value;
}

function readOptionalString(value: unknown): string | undefined {
  if (value === undefined) return undefined;
  return readString(value);
}

function hasControlCharacters(value: string): boolean {
  return Array.from(value).some((character) => {
    const code = character.charCodeAt(0);
    return code <= 31 || code === 127;
  });
}

function readNumber(value: unknown): number {
  if (typeof value !== "number" || !Number.isFinite(value)) throw new InvalidAccessTokenError();
  return value;
}

function readStringArray(value: unknown): readonly string[] {
  if (typeof value === "string") return [value];
  if (!Array.isArray(value) || value.some((item) => typeof item !== "string")) {
    return [];
  }
  return value;
}

function isBoundedToken(value: string): boolean {
  return isBoundedString(value, 1, MAX_TOKEN_LENGTH) && !/\s/u.test(value);
}

function isBoundedString(value: string, minimum: number, maximum: number): boolean {
  return value.trim() === value && value.length >= minimum && value.length <= maximum;
}

function isHttpsUrl(value: string): boolean {
  if (!isBoundedString(value, 1, MAX_ISSUER_LENGTH)) return false;
  try {
    const url = new URL(value);
    return url.protocol === "https:" && url.username === "" && url.password === "";
  } catch {
    return false;
  }
}

function constantTimeEqual(left: string, right: string): boolean {
  const leftBuffer = Buffer.from(left);
  const rightBuffer = Buffer.from(right);
  if (leftBuffer.length !== rightBuffer.length) return false;
  return timingSafeEqual(leftBuffer, rightBuffer);
}
