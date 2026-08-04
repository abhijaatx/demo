import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import test from "node:test";
import { createApiAuthenticationMiddleware } from "../apps/api/dist/auth-middleware.js";
import { LocalAuthProvider } from "../apps/api/dist/local-auth-provider.js";
import {
  AuthConfigurationError,
  AuthenticationError,
  AuthProviderOperationError,
  AuthRateLimitError,
  AuthWorkflowError,
  CognitoIdentityProvider,
  AuthWorkflowService,
  InMemoryAuthRateLimiter,
  InMemoryAuthSessionStore,
  LocalIdentityProvider,
  createAuthSession,
  createAuthenticationMiddleware,
  createSessionCookiePolicy,
  isAuthSessionActive
} from "../packages/auth/dist/index.js";

const now = 1_700_000_000;
const localIdentity = {
  subject: "user-local-1",
  issuer: "local",
  audience: "local-dev",
  expiresAt: now + 3_600,
  issuedAt: now,
  tokenUse: "access"
};

function localProvider() {
  return new LocalIdentityProvider({
    environment: "test",
    clock: () => now,
    fixtures: [{ token: "local-fixture-token", identity: localIdentity }]
  });
}

function cognitoProvider(claims) {
  return new CognitoIdentityProvider({
    environment: "production",
    issuer: "https://cognito-idp.us-east-1.amazonaws.com/us-east-1_example",
    audience: "example-client-id",
    clock: () => now,
    verifySignature: async () => claims
  });
}

test("local identity is fixture-backed and cannot be constructed in production", async () => {
  assert.throws(
    () =>
      new LocalIdentityProvider({
        environment: "production",
        fixtures: []
      }),
    (error) => error instanceof AuthConfigurationError
  );

  const identity = await localProvider().verifyAccessToken("local-fixture-token");
  assert.equal(identity.subject, "user-local-1");
  assert.equal(identity.provider, "local");
  await assert.rejects(localProvider().verifyAccessToken("wrong-token"), /Invalid access token/u);
});

test("local account provider supports account creation and login without exposing passwords", async () => {
  const provider = new LocalAuthProvider();
  const created = await provider.signUp({
    email: "creator@example.com",
    password: "local-password-123"
  });
  assert.deepEqual(created, { verificationRequired: false });

  await assert.rejects(
    provider.signIn({ email: "creator@example.com", password: "wrong-password" }),
    (error) => error instanceof AuthProviderOperationError && error.code === "invalid_credentials"
  );
  const signedIn = await provider.signIn({
    email: "creator@example.com",
    password: "local-password-123"
  });
  assert.equal(signedIn.identity.email, "creator@example.com");
  assert.equal("password" in signedIn.identity, false);
  await assert.rejects(
    provider.signUp({ email: "creator@example.com", password: "another-password" }),
    (error) => error instanceof AuthProviderOperationError && error.code === "already_exists"
  );
});

test("Cognito adapter delegates signature verification and validates issuer, audience, use, and expiry", async () => {
  const validClaims = {
    sub: "cognito-user-1",
    iss: "https://cognito-idp.us-east-1.amazonaws.com/us-east-1_example",
    aud: "example-client-id",
    exp: now + 3_600,
    iat: now,
    token_use: "access"
  };
  const identity = await cognitoProvider(validClaims).verifyAccessToken("signed-token");
  assert.deepEqual(identity, {
    subject: "cognito-user-1",
    issuer: validClaims.iss,
    audience: "example-client-id",
    expiresAt: now + 3_600,
    issuedAt: now,
    tokenUse: "access",
    provider: "cognito"
  });

  for (const claims of [
    { ...validClaims, iss: "https://attacker.example" },
    { ...validClaims, aud: "wrong-client-id" },
    { ...validClaims, exp: now - 1 },
    { ...validClaims, token_use: "id" },
    { ...validClaims, sub: "" },
    { ...validClaims, exp: "not-a-number" }
  ]) {
    await assert.rejects(
      cognitoProvider(claims).verifyAccessToken("signed-token"),
      /Invalid access token/u
    );
  }

  const signatureFailure = new CognitoIdentityProvider({
    environment: "production",
    issuer: validClaims.iss,
    audience: "example-client-id",
    clock: () => now,
    verifySignature: async () => {
      throw new Error("private JWKS failure detail");
    }
  });
  await assert.rejects(signatureFailure.verifyAccessToken("signed-token"), (error) => {
    assert.match(error.message, /Invalid access token/u);
    assert.doesNotMatch(error.message, /private JWKS failure detail/u);
    return true;
  });
});

test("authenticated middleware handles bearer parsing and normalizes provider failures", async () => {
  const middleware = createAuthenticationMiddleware(localProvider(), { clock: () => now });
  await assert.rejects(middleware({}), (error) => {
    assert.equal(error instanceof AuthenticationError, true);
    assert.equal(error.code, "missing_token");
    assert.equal(error.statusCode, 401);
    return true;
  });
  await assert.rejects(middleware({ authorization: "Basic abc" }), /Authentication is required/u);
  await assert.rejects(
    middleware({ authorization: ["Bearer local-fixture-token", "Bearer other"] }),
    /Authentication is required/u
  );

  const context = await middleware({ authorization: "Bearer local-fixture-token" });
  assert.equal(context.identity.subject, "user-local-1");

  const failingMiddleware = createAuthenticationMiddleware({
    kind: "cognito",
    verifyAccessToken: async () => {
      throw new Error("provider secret detail");
    }
  });
  await assert.rejects(failingMiddleware({ authorization: "Bearer opaque-token" }), (error) => {
    assert.equal(error.code, "invalid_token");
    assert.equal(error.statusCode, 401);
    assert.equal(error.message, "The access token is invalid.");
    assert.doesNotMatch(error.message, /provider secret detail/u);
    return true;
  });
});

test("API middleware adapts Node requests and session model remains bounded and expiring", async () => {
  const apiMiddleware = createApiAuthenticationMiddleware(localProvider(), { clock: () => now });
  const context = await apiMiddleware({ headers: { authorization: "Bearer local-fixture-token" } });
  const session = createAuthSession(context.identity, "opaque-session-id", now);

  assert.equal(session.subject, "user-local-1");
  assert.equal(session.provider, "local");
  assert.equal(Object.isFrozen(session), true);
  assert.equal(isAuthSessionActive(session, now + 100), true);
  assert.equal(isAuthSessionActive(session, now + 3_600), false);
  assert.throws(() => createAuthSession(context.identity, " ", now), AuthConfigurationError);
});

test("workflow service keeps public responses enumeration-resistant and maps provider failures safely", async () => {
  const provider = {
    signUp: async () => {
      throw new AuthProviderOperationError("already_exists");
    },
    confirmEmail: async () => {
      throw new AuthProviderOperationError("expired_code");
    },
    signIn: async () => {
      throw new AuthProviderOperationError("invalid_credentials");
    },
    signOut: async () => {},
    requestPasswordReset: async () => {
      throw new AuthProviderOperationError("unavailable");
    },
    resetPassword: async () => {},
    refreshSession: async () => ({ identity: { ...localIdentity, provider: "local" } })
  };
  const service = new AuthWorkflowService({
    provider,
    rateLimiter: new InMemoryAuthRateLimiter({ clock: () => now })
  });

  const signUp = await service.signUp(
    { email: " User@Example.com ", password: "password-123" },
    "ip:signup"
  );
  assert.equal(signUp.message, "Check your email to continue.");
  assert.equal(signUp.verificationRequired, true);
  const reset = await service.requestPasswordReset({ email: "unknown@example.com" }, "ip:reset");
  assert.equal(reset.message, "If an account matches, we’ll send a reset email.");
  await assert.rejects(
    service.confirmEmail({ email: "user@example.com", code: "123456" }, "ip:verify"),
    (error) => error instanceof AuthWorkflowError && error.code === "expired_code"
  );
  await assert.rejects(
    service.signIn({ email: "user@example.com", password: "password-123" }, "ip:signin"),
    (error) => error instanceof AuthWorkflowError && error.code === "invalid_credentials"
  );

  const limitedProvider = {
    ...provider,
    signIn: async () => ({ identity: { ...localIdentity, provider: "local" } })
  };
  const limitedService = new AuthWorkflowService({
    provider: limitedProvider,
    rateLimiter: {
      check: async () => ({ allowed: false, retryAfterSeconds: 30 })
    }
  });
  await assert.rejects(
    limitedService.signIn({ email: "user@example.com", password: "password-123" }, "ip:signin"),
    (error) => error instanceof AuthRateLimitError && error.retryAfterSeconds === 30
  );
});

test("auth validation and cookie policy keep production defaults explicit", () => {
  const production = createSessionCookiePolicy("production");
  const local = createSessionCookiePolicy("local");
  assert.deepEqual(
    {
      name: production.name,
      httpOnly: production.httpOnly,
      secure: production.secure,
      sameSite: production.sameSite,
      path: production.path
    },
    { name: "__Host-supademo_session", httpOnly: true, secure: true, sameSite: "lax", path: "/" }
  );
  assert.equal(local.name, "supademo_session");
  assert.equal(local.secure, false);
});

test("server-side sessions expire and revoke without retaining browser-accessible identity", async () => {
  const store = new InMemoryAuthSessionStore({ clock: () => now });
  const session = createAuthSession(
    { ...localIdentity, provider: "local" },
    "opaque-session-id",
    now,
    "csrf-token-value-123456"
  );
  await store.create(session);
  assert.equal((await store.getActive("opaque-session-id"))?.identity.email, undefined);
  await store.revokeSubject("user-local-1");
  assert.equal(await store.getActive("opaque-session-id"), undefined);
});

test("auth source and configuration docs avoid custom crypto and unsafe execution paths", async () => {
  const [source, middleware, docs] = await Promise.all([
    readFile(new URL("../packages/auth/src/index.ts", import.meta.url), "utf8"),
    readFile(new URL("../apps/api/src/auth-middleware.ts", import.meta.url), "utf8"),
    readFile(new URL("../docs/authentication.md", import.meta.url), "utf8")
  ]);

  assert.match(source, /verifySignature/u);
  assert.match(source, /timingSafeEqual/u);
  assert.match(source, /expiresAt/u);
  assert.doesNotMatch(
    `${source}\n${middleware}`,
    /dangerouslySetInnerHTML|innerHTML|eval\(|new Function/u
  );
  assert.match(docs, /refuses construction in staging or production/iu);
  assert.match(docs, /Cognito/u);
});
