import assert from "node:assert/strict";
import { once } from "node:events";
import test from "node:test";
import { createApiServer } from "../apps/api/dist/app.js";
import {
  AuthProviderOperationError,
  AuthWorkflowService,
  InMemoryAuthRateLimiter,
  InMemoryAuthSessionStore,
  createAuthSession
} from "../packages/auth/dist/index.js";
import { AuthorizationDeniedError } from "../packages/domain/dist/index.js";

const demoActorId = "018f0f7e-9b7d-7c4b-8c1b-1c0f2e6e0001";
const demoWorkspaceId = "018f0f7e-9b7d-7c4b-8c1b-1c0f2e6e0002";
const otherDemoWorkspaceId = "018f0f7e-9b7d-7c4b-8c1b-1c0f2e6e0003";
const apiDemoId = "018f0f7e-9b7d-7c4b-8c1b-1c0f2e6e0004";

test("API baseline validates requests, exposes versioned health, readiness, and OpenAPI", async (context) => {
  const server = createApiServer({
    checkDatabaseHealth: async () => ({ healthy: true, latencyMs: 2 })
  });
  server.listen(0, "127.0.0.1");
  await once(server, "listening");
  context.after(async () => {
    server.close();
    await once(server, "close");
  });

  const address = server.address();
  assert.equal(typeof address, "object");
  const baseUrl = `http://127.0.0.1:${address.port}`;

  const health = await fetch(`${baseUrl}/api/v1/health`, {
    headers: { "x-request-id": "test-request-001" }
  });
  assert.equal(health.status, 200);
  assert.equal(health.headers.get("x-request-id"), "test-request-001");
  assert.deepEqual(await health.json(), { status: "ok", service: "api" });

  const readiness = await fetch(`${baseUrl}/api/v1/readiness`);
  assert.equal(readiness.status, 200);
  assert.deepEqual(await readiness.json(), {
    status: "ready",
    dependencies: { database: { status: "ok", latencyMs: 2 } }
  });

  const openApi = await fetch(`${baseUrl}/api/v1/openapi.json`);
  assert.equal(openApi.status, 200);
  const document = await openApi.json();
  assert.equal(document.openapi, "3.0.3");
  assert.ok(document.paths["/api/v1/readiness"]);
  assert.ok(document.paths["/api/v1/me/profile"]);
  assert.ok(document.paths["/api/v1/workspaces"]);
  assert.ok(document.components.schemas.ErrorResponse);

  const invalidQuery = await fetch(`${baseUrl}/api/v1/health?unexpected=true`);
  assert.equal(invalidQuery.status, 400);
  const invalidQueryBody = await invalidQuery.json();
  assert.equal(invalidQueryBody.error.code, "invalid_query");
  assert.equal(invalidQueryBody.error.requestId, invalidQuery.headers.get("x-request-id"));

  const methodNotAllowed = await fetch(`${baseUrl}/api/v1/health`, { method: "POST" });
  assert.equal(methodNotAllowed.status, 405);
  assert.equal(methodNotAllowed.headers.get("allow"), "GET");
});

test("API demo routes authenticate, validate writes, enforce idempotency, and preserve tenant boundaries", async (context) => {
  const calls = [];
  const demo = {
    id: apiDemoId,
    workspaceId: demoWorkspaceId,
    folderId: null,
    ownerUserId: demoActorId,
    title: "Welcome demo",
    description: null,
    type: "guided_html",
    status: "draft",
    isTemplate: false,
    publishedAt: null,
    createdAt: "2026-07-12T00:00:00.000Z",
    updatedAt: "2026-07-12T00:00:00.000Z",
    deletedAt: null
  };
  const server = createApiServer({
    checkDatabaseHealth: async () => ({ healthy: true, latencyMs: 1 }),
    authProvider: {
      kind: "local",
      verifyAccessToken: async (token) => {
        if (token !== "demo-token") throw new Error("invalid token");
        return {
          subject: "identity-subject-a",
          email: "jordan@example.com",
          issuer: "local",
          audience: "local-dev",
          expiresAt: Math.floor(Date.now() / 1000) + 3_600,
          tokenUse: "access",
          provider: "local"
        };
      }
    },
    userProfileRepository: {
      syncIdentity: async () => ({ userId: demoActorId, email: "jordan@example.com" })
    },
    demoRepository: {
      list: async (actor, workspaceId, filters) => {
        calls.push({ operation: "list", actor, workspaceId, filters });
        if (workspaceId === otherDemoWorkspaceId) throw new AuthorizationDeniedError();
        return [demo];
      },
      get: async () => demo,
      create: async (actor, workspaceId, input, idempotencyKey) => {
        calls.push({ operation: "create", actor, workspaceId, input, idempotencyKey });
        return demo;
      },
      update: async () => demo,
      transitionStatus: async () => demo,
      listTrash: async (actor, workspaceId) => {
        calls.push({ operation: "listTrash", actor, workspaceId });
        return [
          {
            demo,
            deletedAt: "2026-07-27T00:00:00.000Z",
            expiresAt: "2026-08-26T00:00:00.000Z",
            daysRemaining: 30
          }
        ];
      },
      archive: async (actor, workspaceId, demoId) => {
        calls.push({ operation: "archive", actor, workspaceId, demoId });
        return { ...demo, status: "archived" };
      },
      unarchive: async (actor, workspaceId, demoId) => {
        calls.push({ operation: "unarchive", actor, workspaceId, demoId });
        return { ...demo, status: "draft" };
      },
      softDelete: async () => true,
      restore: async () => demo,
      permanentDelete: async (actor, workspaceId, demoId) => {
        calls.push({ operation: "permanentDelete", actor, workspaceId, demoId });
        return true;
      },
      assignFolder: async () => demo,
      duplicate: async (actor, workspaceId, demoId, input, idempotencyKey) => {
        calls.push({ operation: "duplicate", actor, workspaceId, demoId, input, idempotencyKey });
        return { ...demo, title: input?.title ?? `${demo.title} (Copy)`, status: "draft" };
      },
      setTemplate: async (actor, workspaceId, demoId, isTemplate) => {
        calls.push({ operation: "setTemplate", actor, workspaceId, demoId, isTemplate });
        return { ...demo, isTemplate };
      },
      createFromTemplate: async (actor, workspaceId, demoId, input, idempotencyKey) => {
        calls.push({
          operation: "createFromTemplate",
          actor,
          workspaceId,
          demoId,
          input,
          idempotencyKey
        });
        return { ...demo, title: input?.title ?? demo.title, status: "draft", isTemplate: false };
      }
    }
  });
  server.listen(0, "127.0.0.1");
  await once(server, "listening");
  context.after(async () => {
    server.close();
    await once(server, "close");
  });

  const address = server.address();
  assert.equal(typeof address, "object");
  const baseUrl = `http://127.0.0.1:${address.port}`;
  const path = `/api/v1/workspaces/${demoWorkspaceId}/demos`;
  const unauthenticated = await fetch(`${baseUrl}${path}`);
  assert.equal(unauthenticated.status, 401);

  const missingIdempotency = await fetch(`${baseUrl}${path}`, {
    method: "POST",
    headers: { authorization: "Bearer demo-token", "content-type": "application/json" },
    body: JSON.stringify({ title: "Welcome demo", description: null, type: "guided_html" })
  });
  assert.equal(missingIdempotency.status, 400);

  const created = await fetch(`${baseUrl}${path}`, {
    method: "POST",
    headers: {
      authorization: "Bearer demo-token",
      "content-type": "application/json",
      "idempotency-key": "demo-create-api-001"
    },
    body: JSON.stringify({ title: "Welcome demo", description: null, type: "guided_html" })
  });
  assert.equal(created.status, 201);
  assert.deepEqual(calls[0], {
    operation: "create",
    actor: demoActorId,
    workspaceId: demoWorkspaceId,
    input: { title: "Welcome demo", description: null, type: "guided_html" },
    idempotencyKey: "demo-create-api-001"
  });

  const forbidden = await fetch(`${baseUrl}/api/v1/workspaces/${otherDemoWorkspaceId}/demos`, {
    headers: { authorization: "Bearer demo-token" }
  });
  assert.equal(forbidden.status, 403);

  const list = await fetch(`${baseUrl}${path}`, {
    headers: { authorization: "Bearer demo-token" }
  });
  assert.equal(list.status, 200);
  assert.deepEqual(calls[2], {
    operation: "list",
    actor: demoActorId,
    workspaceId: demoWorkspaceId,
    filters: {
      query: null,
      ownerUserId: null,
      type: null,
      status: null,
      tagIds: [],
      updatedAfter: null,
      updatedBefore: null
    }
  });

  const malformedSearch = await fetch(`${baseUrl}${path}?q=one&q=two`, {
    headers: { authorization: "Bearer demo-token" }
  });
  assert.equal(malformedSearch.status, 400);

  const archive = await fetch(`${baseUrl}${path}/${apiDemoId}/archive`, {
    method: "POST",
    headers: { authorization: "Bearer demo-token" }
  });
  assert.equal(archive.status, 200);
  const archivedBody = await archive.json();
  assert.equal(archivedBody.status, "archived");

  const unarchive = await fetch(`${baseUrl}${path}/${apiDemoId}/unarchive`, {
    method: "POST",
    headers: { authorization: "Bearer demo-token" }
  });
  assert.equal(unarchive.status, 200);

  const trashList = await fetch(`${baseUrl}/api/v1/workspaces/${demoWorkspaceId}/trash`, {
    headers: { authorization: "Bearer demo-token" }
  });
  assert.equal(trashList.status, 200);
  const trashItems = await trashList.json();
  assert.equal(trashItems.length, 1);
  assert.equal(trashItems[0].daysRemaining, 30);

  const permanentDelete = await fetch(`${baseUrl}${path}/${apiDemoId}/permanent`, {
    method: "DELETE",
    headers: { authorization: "Bearer demo-token" }
  });
  assert.equal(permanentDelete.status, 200);

  const duplicate = await fetch(`${baseUrl}${path}/${apiDemoId}/duplicate`, {
    method: "POST",
    headers: {
      authorization: "Bearer demo-token",
      "content-type": "application/json",
      "idempotency-key": "idemp-dup-api-1"
    },
    body: JSON.stringify({ title: "Custom Copy Title" })
  });
  assert.equal(duplicate.status, 201);
  const duplicateBody = await duplicate.json();
  assert.equal(duplicateBody.title, "Custom Copy Title");

  const setTemplate = await fetch(`${baseUrl}${path}/${apiDemoId}/template`, {
    method: "POST",
    headers: { authorization: "Bearer demo-token", "content-type": "application/json" },
    body: JSON.stringify({ isTemplate: true })
  });
  assert.equal(setTemplate.status, 200);
  const templateBody = await setTemplate.json();
  assert.equal(templateBody.isTemplate, true);

  const instantiate = await fetch(`${baseUrl}${path}/${apiDemoId}/instantiate`, {
    method: "POST",
    headers: {
      authorization: "Bearer demo-token",
      "content-type": "application/json",
      "idempotency-key": "idemp-inst-api-1"
    },
    body: JSON.stringify({ title: "Instantiated Demo Title" })
  });
  assert.equal(instantiate.status, 201);
  const instantiateBody = await instantiate.json();
  assert.equal(instantiateBody.title, "Instantiated Demo Title");

  const invalidStatus = await fetch(`${baseUrl}${path}/${apiDemoId}/status`, {
    method: "POST",
    headers: { authorization: "Bearer demo-token", "content-type": "application/json" },
    body: JSON.stringify({ status: "published", unexpected: true })
  });
  assert.equal(invalidStatus.status, 400);
});

test("API tag routes authenticate, require idempotency, and keep workspace scope in repositories", async (context) => {
  const tag = {
    id: "018f0f7e-9b7d-7c4b-8c1b-1c0f2e6e0005",
    workspaceId: demoWorkspaceId,
    name: "Onboarding",
    createdAt: "2026-07-12T00:00:00.000Z",
    updatedAt: "2026-07-12T00:00:00.000Z"
  };
  const calls = [];
  const server = createApiServer({
    checkDatabaseHealth: async () => ({ healthy: true, latencyMs: 1 }),
    authProvider: {
      kind: "local",
      verifyAccessToken: async (token) => {
        if (token !== "tag-token") throw new Error("invalid token");
        return {
          subject: "identity-subject-a",
          email: "jordan@example.com",
          issuer: "local",
          audience: "local-dev",
          expiresAt: Math.floor(Date.now() / 1000) + 3_600,
          tokenUse: "access",
          provider: "local"
        };
      }
    },
    userProfileRepository: {
      syncIdentity: async () => ({ userId: demoActorId, email: "jordan@example.com" })
    },
    tagRepository: {
      list: async (actor, workspaceId) => {
        calls.push({ operation: "list", actor, workspaceId });
        if (workspaceId !== demoWorkspaceId) throw new AuthorizationDeniedError();
        return [tag];
      },
      create: async (actor, workspaceId, input, idempotencyKey) => {
        calls.push({ operation: "create", actor, workspaceId, input, idempotencyKey });
        return tag;
      },
      assignToDemo: async (actor, workspaceId, demoId, assignedTagId) => {
        calls.push({ operation: "assign", actor, workspaceId, demoId, tagId: assignedTagId });
      },
      removeFromDemo: async () => true
    }
  });
  server.listen(0, "127.0.0.1");
  await once(server, "listening");
  context.after(async () => {
    server.close();
    await once(server, "close");
  });
  const address = server.address();
  assert.equal(typeof address, "object");
  const baseUrl = `http://127.0.0.1:${address.port}`;
  const path = `/api/v1/workspaces/${demoWorkspaceId}/tags`;
  assert.equal((await fetch(`${baseUrl}${path}`)).status, 401);
  assert.equal(
    (
      await fetch(`${baseUrl}${path}`, {
        method: "POST",
        headers: { authorization: "Bearer tag-token", "content-type": "application/json" },
        body: JSON.stringify({ name: "Onboarding" })
      })
    ).status,
    400
  );
  const created = await fetch(`${baseUrl}${path}`, {
    method: "POST",
    headers: {
      authorization: "Bearer tag-token",
      "content-type": "application/json",
      "idempotency-key": "tag-create-api-001"
    },
    body: JSON.stringify({ name: "Onboarding" })
  });
  assert.equal(created.status, 201);
  assert.deepEqual(calls[0], {
    operation: "create",
    actor: demoActorId,
    workspaceId: demoWorkspaceId,
    input: { name: "Onboarding" },
    idempotencyKey: "tag-create-api-001"
  });
  const assigned = await fetch(`${baseUrl}${path}/${tag.id}/demos/${apiDemoId}`, {
    method: "POST",
    headers: { authorization: "Bearer tag-token" }
  });
  assert.equal(assigned.status, 200);
  assert.deepEqual(calls[1], {
    operation: "assign",
    actor: demoActorId,
    workspaceId: demoWorkspaceId,
    demoId: apiDemoId,
    tagId: tag.id
  });
  const forbidden = await fetch(`${baseUrl}/api/v1/workspaces/${otherDemoWorkspaceId}/tags`, {
    headers: { authorization: "Bearer tag-token" }
  });
  assert.equal(forbidden.status, 403);
});

test("API folder routes authenticate, require idempotency, and reject malformed hierarchy changes", async (context) => {
  const folder = {
    id: "018f0f7e-9b7d-7c4b-8c1b-1c0f2e6e0005",
    workspaceId: demoWorkspaceId,
    parentId: null,
    name: "Product tours",
    version: 1,
    createdAt: "2026-07-12T00:00:00.000Z",
    updatedAt: "2026-07-12T00:00:00.000Z"
  };
  const calls = [];
  const server = createApiServer({
    checkDatabaseHealth: async () => ({ healthy: true, latencyMs: 1 }),
    authProvider: {
      kind: "local",
      verifyAccessToken: async (token) => {
        if (token !== "folder-token") throw new Error("invalid token");
        return {
          subject: "identity-subject-a",
          email: "jordan@example.com",
          issuer: "local",
          audience: "local-dev",
          expiresAt: Math.floor(Date.now() / 1000) + 3_600,
          tokenUse: "access",
          provider: "local"
        };
      }
    },
    userProfileRepository: {
      syncIdentity: async () => ({ userId: demoActorId, email: "jordan@example.com" })
    },
    folderRepository: {
      list: async (actor, workspaceId) => {
        if (workspaceId !== demoWorkspaceId) throw new AuthorizationDeniedError();
        calls.push({ operation: "list", actor, workspaceId });
        return [folder];
      },
      create: async (actor, workspaceId, input, idempotencyKey) => {
        calls.push({ operation: "create", actor, workspaceId, input, idempotencyKey });
        return folder;
      },
      update: async () => folder,
      move: async () => folder,
      delete: async () => true
    }
  });
  server.listen(0, "127.0.0.1");
  await once(server, "listening");
  context.after(async () => {
    server.close();
    await once(server, "close");
  });
  const address = server.address();
  assert.equal(typeof address, "object");
  const baseUrl = `http://127.0.0.1:${address.port}`;
  const path = `/api/v1/workspaces/${demoWorkspaceId}/folders`;
  assert.equal((await fetch(`${baseUrl}${path}`)).status, 401);
  assert.equal(
    (
      await fetch(`${baseUrl}${path}`, {
        method: "POST",
        headers: { authorization: "Bearer folder-token", "content-type": "application/json" },
        body: JSON.stringify({ name: "Product tours", parentId: null })
      })
    ).status,
    400
  );
  const created = await fetch(`${baseUrl}${path}`, {
    method: "POST",
    headers: {
      authorization: "Bearer folder-token",
      "content-type": "application/json",
      "idempotency-key": "folder-create-api-001"
    },
    body: JSON.stringify({ name: "Product tours", parentId: null })
  });
  assert.equal(created.status, 201);
  assert.deepEqual(calls[0], {
    operation: "create",
    actor: demoActorId,
    workspaceId: demoWorkspaceId,
    input: { name: "Product tours", parentId: null },
    idempotencyKey: "folder-create-api-001"
  });
  const malformedMove = await fetch(`${baseUrl}${path}/${folder.id}/move`, {
    method: "POST",
    headers: { authorization: "Bearer folder-token", "content-type": "application/json" },
    body: JSON.stringify({ parentId: null, expectedVersion: 1, unexpected: true })
  });
  assert.equal(malformedMove.status, 400);
  const denied = await fetch(`${baseUrl}/api/v1/workspaces/${otherDemoWorkspaceId}/folders`, {
    headers: { authorization: "Bearer folder-token" }
  });
  assert.equal(denied.status, 403);
});

test("API readiness reports dependency failure without exposing driver details", async (context) => {
  const server = createApiServer({
    checkDatabaseHealth: async () => {
      throw new Error("password=must-not-leak");
    }
  });
  server.listen(0, "127.0.0.1");
  await once(server, "listening");
  context.after(async () => {
    server.close();
    await once(server, "close");
  });

  const address = server.address();
  assert.equal(typeof address, "object");
  const response = await fetch(`http://127.0.0.1:${address.port}/api/v1/readiness`);
  assert.equal(response.status, 503);
  const body = await response.text();
  assert.match(body, /not_ready/u);
  assert.doesNotMatch(body, /must-not-leak/u);
});

test("API auth routes execute workflow success and failure paths without leaking credentials", async (context) => {
  const provider = {
    signUp: async ({ email }) => {
      if (email === "existing@example.com") {
        throw new AuthProviderOperationError("already_exists");
      }
    },
    confirmEmail: async () => {},
    signIn: async ({ email }) => {
      if (email === "bad@example.com") {
        throw new AuthProviderOperationError("invalid_credentials");
      }
      return {
        identity: {
          subject: "user-1",
          issuer: "local",
          audience: "local-dev",
          expiresAt: Math.floor(Date.now() / 1000) + 3_600,
          tokenUse: "access",
          provider: "local"
        }
      };
    },
    signOut: async () => {},
    requestPasswordReset: async () => {},
    resetPassword: async () => {},
    refreshSession: async () => ({
      identity: {
        subject: "user-1",
        issuer: "local",
        audience: "local-dev",
        expiresAt: Math.floor(Date.now() / 1000) + 3_600,
        tokenUse: "access",
        provider: "local"
      }
    })
  };
  const authWorkflow = new AuthWorkflowService({
    provider,
    rateLimiter: new InMemoryAuthRateLimiter()
  });
  const sessionStore = new InMemoryAuthSessionStore();
  const server = createApiServer({
    checkDatabaseHealth: async () => ({ healthy: true, latencyMs: 1 }),
    authWorkflow,
    authSessionStore: sessionStore
  });
  server.listen(0, "127.0.0.1");
  await once(server, "listening");
  context.after(async () => {
    server.close();
    await once(server, "close");
  });

  const address = server.address();
  assert.equal(typeof address, "object");
  const baseUrl = `http://127.0.0.1:${address.port}`;
  const request = (path, body) =>
    fetch(`${baseUrl}${path}`, {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify(body)
    });

  const anonymousRefresh = await fetch(`${baseUrl}/api/v1/auth/refresh-session`, {
    method: "POST"
  });
  assert.equal(anonymousRefresh.status, 401);

  const staleCookieSignUp = await fetch(`${baseUrl}/api/v1/auth/sign-up`, {
    method: "POST",
    headers: {
      cookie: "supademo_session=expired-session",
      "content-type": "application/json"
    },
    body: JSON.stringify({ email: "stale-cookie@example.com", password: "not-logged-123" })
  });
  assert.equal(staleCookieSignUp.status, 200);

  const signUp = await request("/api/v1/auth/sign-up", {
    email: "new@example.com",
    password: "not-logged-123"
  });
  assert.equal(signUp.status, 200);
  assert.deepEqual(await signUp.json(), {
    message: "Check your email to continue.",
    verificationRequired: true
  });

  const signedIn = await request("/api/v1/auth/sign-in", {
    email: "new@example.com",
    password: "not-logged-123"
  });
  assert.equal(signedIn.status, 200);
  assert.match(signedIn.headers.get("set-cookie") ?? "", /HttpOnly; SameSite=Lax/u);
  const signedInBody = await signedIn.json();
  assert.equal(signedInBody.message, "Signed in.");
  assert.match(signedInBody.csrfToken, /^[A-Za-z0-9-]{16,}$/u);
  assert.equal("identity" in signedInBody, false);
  const sessionCookie = (signedIn.headers.get("set-cookie") ?? "").split(";", 1)[0];
  // A new tab shares the HttpOnly session cookie but not sessionStorage. Public auth
  // operations must still work without the prior tab's CSRF token.
  const crossTabSignUp = await fetch(`${baseUrl}/api/v1/auth/sign-up`, {
    method: "POST",
    headers: { cookie: sessionCookie, "content-type": "application/json" },
    body: JSON.stringify({ email: "cross-tab@example.com", password: "not-logged-123" })
  });
  assert.equal(crossTabSignUp.status, 200);
  const crossTabSignIn = await fetch(`${baseUrl}/api/v1/auth/sign-in`, {
    method: "POST",
    headers: { cookie: sessionCookie, "content-type": "application/json" },
    body: JSON.stringify({ email: "cross-tab@example.com", password: "not-logged-123" })
  });
  assert.equal(crossTabSignIn.status, 200);
  const crossTabSignInBody = await crossTabSignIn.json();
  const crossTabSessionCookie = (crossTabSignIn.headers.get("set-cookie") ?? "").split(";", 1)[0];
  assert.match(crossTabSignInBody.csrfToken, /^[A-Za-z0-9-]{16,}$/u);
  const refreshed = await fetch(`${baseUrl}/api/v1/auth/refresh-session`, {
    method: "POST",
    headers: { cookie: crossTabSessionCookie, "x-csrf-token": crossTabSignInBody.csrfToken }
  });
  assert.equal(refreshed.status, 200);
  const refreshedBody = await refreshed.json();
  assert.equal(refreshedBody.message, "Session refreshed.");
  const refreshedCookie = (refreshed.headers.get("set-cookie") ?? "").split(";", 1)[0];
  const signedOut = await fetch(`${baseUrl}/api/v1/auth/sign-out`, {
    method: "POST",
    headers: { cookie: refreshedCookie, "x-csrf-token": refreshedBody.csrfToken }
  });
  assert.equal(signedOut.status, 200);
  assert.equal((await signedOut.json()).message, "Signed out.");

  const existing = await request("/api/v1/auth/sign-up", {
    email: "existing@example.com",
    password: "not-logged-123"
  });
  assert.equal(existing.status, 200);
  assert.equal((await existing.json()).message, "Check your email to continue.");

  const invalidCredentials = await request("/api/v1/auth/sign-in", {
    email: "bad@example.com",
    password: "secret-value-that-must-not-appear"
  });
  assert.equal(invalidCredentials.status, 401);
  const invalidBody = await invalidCredentials.text();
  assert.match(invalidBody, /email or password is incorrect/u);
  assert.doesNotMatch(invalidBody, /secret-value-that-must-not-appear/u);

  const invalidJson = await fetch(`${baseUrl}/api/v1/auth/sign-in`, {
    method: "POST",
    headers: { "content-type": "application/json" },
    body: "{"
  });
  assert.equal(invalidJson.status, 400);
});

test("API profile routes authenticate by identity subject and prevent unauthenticated profile access", async (context) => {
  const calls = [];
  const profile = {
    userId: "018f0f7e-9b7d-7c4b-8c1b-1c0f2e6e0001",
    email: "jordan@example.com",
    displayName: "Jordan Davis",
    avatarUrl: null,
    timezone: "Asia/Kolkata",
    preferences: {
      theme: "system",
      locale: "en-US",
      reducedMotion: false,
      emailNotifications: true
    },
    createdAt: "2026-07-12T00:00:00.000Z",
    updatedAt: "2026-07-12T00:00:00.000Z"
  };
  const profileRepository = {
    syncIdentity: async (input) => {
      calls.push({ operation: "sync", input });
      return profile;
    },
    updateProfile: async (subject, patch) => {
      calls.push({ operation: "update", subject, patch });
      return { ...profile, ...patch };
    }
  };
  const authProvider = {
    kind: "local",
    verifyAccessToken: async (token) => {
      if (token !== "profile-token") throw new Error("invalid token");
      return {
        subject: "identity-subject-a",
        email: "Jordan@Example.com",
        issuer: "local",
        audience: "local-dev",
        expiresAt: Math.floor(Date.now() / 1000) + 3_600,
        tokenUse: "access",
        provider: "local"
      };
    }
  };
  const server = createApiServer({
    checkDatabaseHealth: async () => ({ healthy: true, latencyMs: 1 }),
    authProvider,
    userProfileRepository: profileRepository
  });
  server.listen(0, "127.0.0.1");
  await once(server, "listening");
  context.after(async () => {
    server.close();
    await once(server, "close");
  });

  const address = server.address();
  assert.equal(typeof address, "object");
  const baseUrl = `http://127.0.0.1:${address.port}`;
  const unauthenticated = await fetch(`${baseUrl}/api/v1/me/profile`);
  assert.equal(unauthenticated.status, 401);
  assert.equal(calls.length, 0);

  const authenticated = await fetch(`${baseUrl}/api/v1/me/profile`, {
    headers: { authorization: "Bearer profile-token" }
  });
  assert.equal(authenticated.status, 200);
  assert.equal((await authenticated.json()).email, "jordan@example.com");
  assert.deepEqual(calls[0], {
    operation: "sync",
    input: { subject: "identity-subject-a", email: "jordan@example.com" }
  });

  const updated = await fetch(`${baseUrl}/api/v1/me/profile`, {
    method: "PATCH",
    headers: {
      authorization: "Bearer profile-token",
      "content-type": "application/json"
    },
    body: JSON.stringify({
      displayName: "Jordan Product",
      timezone: "UTC",
      preferences: profile.preferences
    })
  });
  assert.equal(updated.status, 200);
  assert.equal((await updated.json()).displayName, "Jordan Product");
  assert.equal(calls[1].operation, "sync");
  assert.equal(calls[2].subject, "identity-subject-a");

  const invalid = await fetch(`${baseUrl}/api/v1/me/profile`, {
    method: "PATCH",
    headers: {
      authorization: "Bearer profile-token",
      "content-type": "application/json"
    },
    body: JSON.stringify({ identitySubject: "identity-subject-b" })
  });
  assert.equal(invalid.status, 400);
  assert.doesNotMatch(await invalid.text(), /identity-subject-b/u);
});

test("API workspace routes require identity auth, enforce idempotency headers, and scope listings to the user", async (context) => {
  const calls = [];
  const profileRepository = {
    syncIdentity: async () => ({ userId: "018f0f7e-9b7d-7c4b-8c1b-1c0f2e6e0001" })
  };
  const workspace = {
    organizationId: "018f0f7e-9b7d-7c4b-8c1b-1c0f2e6e0002",
    organizationName: "Acme Inc",
    workspaceId: "018f0f7e-9b7d-7c4b-8c1b-1c0f2e6e0003",
    workspaceName: "Product demos",
    slug: "product-demos",
    role: "owner",
    capabilities: ["workspace:read", "member:invite", "demo:create"],
    createdAt: "2026-07-12T00:00:00.000Z"
  };
  const workspaceRepository = {
    listForUser: async (userId) => {
      calls.push({ operation: "list", userId });
      return [workspace];
    },
    createForUser: async (userId, input, key) => {
      calls.push({ operation: "create", userId, input, key });
      return workspace;
    },
    getCurrentForUser: async () => workspace,
    setCurrentForUser: async (userId, workspaceId) => {
      calls.push({ operation: "current", userId, workspaceId });
      return workspace;
    }
  };
  const authProvider = {
    kind: "local",
    verifyAccessToken: async (token) => {
      if (token !== "workspace-token") throw new Error("invalid token");
      return {
        subject: "identity-subject-a",
        email: "owner@example.com",
        issuer: "local",
        audience: "local-dev",
        expiresAt: Math.floor(Date.now() / 1000) + 3_600,
        tokenUse: "access",
        provider: "local"
      };
    }
  };
  const server = createApiServer({
    checkDatabaseHealth: async () => ({ healthy: true, latencyMs: 1 }),
    authProvider,
    userProfileRepository: profileRepository,
    workspaceRepository
  });
  server.listen(0, "127.0.0.1");
  await once(server, "listening");
  context.after(async () => {
    server.close();
    await once(server, "close");
  });

  const address = server.address();
  assert.equal(typeof address, "object");
  const baseUrl = `http://127.0.0.1:${address.port}`;
  const headers = { authorization: "Bearer workspace-token" };
  const unauthenticated = await fetch(`${baseUrl}/api/v1/workspaces`);
  assert.equal(unauthenticated.status, 401);

  const listing = await fetch(`${baseUrl}/api/v1/workspaces`, { headers });
  assert.equal(listing.status, 200);
  assert.deepEqual(await listing.json(), [workspace]);
  assert.deepEqual(calls[0], {
    operation: "list",
    userId: "018f0f7e-9b7d-7c4b-8c1b-1c0f2e6e0001"
  });

  const missingKey = await fetch(`${baseUrl}/api/v1/workspaces`, {
    method: "POST",
    headers: { ...headers, "content-type": "application/json" },
    body: JSON.stringify({
      organizationName: "Acme Inc",
      workspaceName: "Product demos",
      slug: "product-demos"
    })
  });
  assert.equal(missingKey.status, 400);

  const created = await fetch(`${baseUrl}/api/v1/workspaces`, {
    method: "POST",
    headers: {
      ...headers,
      "content-type": "application/json",
      "idempotency-key": "workspace-request-001"
    },
    body: JSON.stringify({
      organizationName: "Acme Inc",
      workspaceName: "Product demos",
      slug: "Product-Demos"
    })
  });
  assert.equal(created.status, 201);
  assert.deepEqual(calls.at(-1), {
    operation: "create",
    userId: "018f0f7e-9b7d-7c4b-8c1b-1c0f2e6e0001",
    input: { organizationName: "Acme Inc", workspaceName: "Product demos", slug: "product-demos" },
    key: "workspace-request-001"
  });

  const current = await fetch(`${baseUrl}/api/v1/workspaces/current`, { headers });
  assert.equal(current.status, 200);
  assert.deepEqual(await current.json(), workspace);

  const switched = await fetch(`${baseUrl}/api/v1/workspaces/current`, {
    method: "PUT",
    headers: { ...headers, "content-type": "application/json" },
    body: JSON.stringify({ workspaceId: workspace.workspaceId })
  });
  assert.equal(switched.status, 200);
  assert.equal(calls.at(-1).operation, "current");
});

test("API membership routes deliver opaque invitations and fail closed on authorization", async (context) => {
  const workspace = {
    organizationId: "018f0f7e-9b7d-7c4b-8c1b-1c0f2e6e0002",
    organizationName: "Acme Inc",
    workspaceId: "018f0f7e-9b7d-7c4b-8c1b-1c0f2e6e0003",
    workspaceName: "Product demos",
    slug: "product-demos",
    role: "owner",
    capabilities: ["member:invite"],
    createdAt: "2026-07-12T00:00:00.000Z"
  };
  const profileRepository = {
    syncIdentity: async () => ({
      userId: "018f0f7e-9b7d-7c4b-8c1b-1c0f2e6e0001",
      email: "owner@example.com"
    })
  };
  const delivered = [];
  let deny = false;
  const membershipRepository = {
    createInvitation: async (_workspaceId, _userId, email, role) => {
      if (deny) throw new AuthorizationDeniedError();
      return {
        invitation: {
          id: "018f0f7e-9b7d-7c4b-8c1b-1c0f2e6e0004",
          workspaceId: workspace.workspaceId,
          email,
          role,
          expiresAt: "2026-07-19T00:00:00.000Z",
          createdAt: "2026-07-12T00:00:00.000Z"
        },
        token: "opaque-token-that-must-not-be-returned-123456"
      };
    },
    acceptInvitation: async () => null
  };
  const authProvider = {
    kind: "local",
    verifyAccessToken: async (token) => {
      if (token !== "membership-token") throw new Error("invalid token");
      return {
        subject: "identity-subject-a",
        email: "owner@example.com",
        issuer: "local",
        audience: "local-dev",
        expiresAt: Math.floor(Date.now() / 1000) + 3_600,
        tokenUse: "access",
        provider: "local"
      };
    }
  };
  const server = createApiServer({
    checkDatabaseHealth: async () => ({ healthy: true, latencyMs: 1 }),
    authProvider,
    userProfileRepository: profileRepository,
    workspaceRepository: { listForUser: async () => [workspace] },
    membershipRepository,
    invitationDelivery: {
      sendInvitation: async (input) => delivered.push(input)
    }
  });
  server.listen(0, "127.0.0.1");
  await once(server, "listening");
  context.after(async () => {
    server.close();
    await once(server, "close");
  });

  const address = server.address();
  assert.equal(typeof address, "object");
  const baseUrl = `http://127.0.0.1:${address.port}`;
  const headers = {
    authorization: "Bearer membership-token",
    "content-type": "application/json"
  };
  const invite = await fetch(`${baseUrl}/api/v1/workspaces/${workspace.workspaceId}/invitations`, {
    method: "POST",
    headers,
    body: JSON.stringify({ email: "new-user@example.com", role: "editor" })
  });
  assert.equal(invite.status, 202);
  assert.deepEqual(await invite.json(), { message: "The invitation is being sent." });
  assert.equal(delivered.length, 1);
  assert.equal(delivered[0].email, "new-user@example.com");
  assert.equal(delivered[0].token, "opaque-token-that-must-not-be-returned-123456");
  assert.doesNotMatch(
    await (
      await fetch(`${baseUrl}/api/v1/workspaces/${workspace.workspaceId}/invitations`, {
        method: "POST",
        headers,
        body: JSON.stringify({ email: "new-user@example.com", role: "editor" })
      })
    ).text(),
    /opaque-token-that-must-not-be-returned/u
  );

  deny = true;
  const forbidden = await fetch(
    `${baseUrl}/api/v1/workspaces/${workspace.workspaceId}/invitations`,
    {
      method: "POST",
      headers,
      body: JSON.stringify({ email: "blocked@example.com", role: "viewer" })
    }
  );
  assert.equal(forbidden.status, 403);

  const invalidAccept = await fetch(`${baseUrl}/api/v1/invitations/accept`, {
    method: "POST",
    headers,
    body: JSON.stringify({ token: "short" })
  });
  assert.equal(invalidAccept.status, 400);
});

test("API restricts browser origins and requires CSRF for opaque cookie sessions", async (context) => {
  const sessionStore = new InMemoryAuthSessionStore();
  const session = createAuthSession(
    {
      subject: "cookie-user",
      email: "cookie@example.com",
      issuer: "local",
      audience: "local-dev",
      expiresAt: Math.floor(Date.now() / 1000) + 3_600,
      tokenUse: "access",
      provider: "local"
    },
    "cookie-session-001",
    undefined,
    "csrf-token-allowed-123456"
  );
  await sessionStore.create(session);
  let updateCalls = 0;
  const server = createApiServer({
    checkDatabaseHealth: async () => ({ healthy: true, latencyMs: 1 }),
    authSessionStore: sessionStore,
    allowedOrigins: ["http://localhost:3000"],
    userProfileRepository: {
      syncIdentity: async () => ({
        userId: "018f0f7e-9b7d-7c4b-8c1b-1c0f2e6e0001",
        email: "cookie@example.com"
      }),
      updateProfile: async () => {
        updateCalls += 1;
        return { displayName: "Cookie User" };
      }
    }
  });
  server.listen(0, "127.0.0.1");
  await once(server, "listening");
  context.after(async () => {
    server.close();
    await once(server, "close");
  });

  const address = server.address();
  assert.equal(typeof address, "object");
  const baseUrl = `http://127.0.0.1:${address.port}`;
  const cookie = "supademo_session=cookie-session-001";
  const patch = JSON.stringify({ displayName: "Cookie User" });

  const blockedOrigin = await fetch(`${baseUrl}/api/v1/me/profile`, {
    headers: { origin: "https://attacker.invalid", cookie }
  });
  assert.equal(blockedOrigin.status, 403);
  assert.equal(blockedOrigin.headers.get("access-control-allow-origin"), null);

  const blockedCsrf = await fetch(`${baseUrl}/api/v1/me/profile`, {
    method: "PATCH",
    headers: { cookie, "content-type": "application/json", origin: "http://localhost:3000" },
    body: patch
  });
  assert.equal(blockedCsrf.status, 403);
  assert.equal(updateCalls, 0);

  const preflight = await fetch(`${baseUrl}/api/v1/me/profile`, {
    method: "OPTIONS",
    headers: {
      origin: "http://localhost:3000",
      "access-control-request-method": "PATCH",
      "access-control-request-headers": "content-type, x-csrf-token"
    }
  });
  assert.equal(preflight.status, 204);
  assert.equal(preflight.headers.get("access-control-allow-origin"), "http://localhost:3000");

  const deniedPreflight = await fetch(`${baseUrl}/api/v1/me/profile`, {
    method: "OPTIONS",
    headers: {
      origin: "http://localhost:3000",
      "access-control-request-method": "PATCH",
      "access-control-request-headers": "x-unsafe-header"
    }
  });
  assert.equal(deniedPreflight.status, 403);

  const updated = await fetch(`${baseUrl}/api/v1/me/profile`, {
    method: "PATCH",
    headers: {
      cookie,
      origin: "http://localhost:3000",
      "content-type": "application/json",
      "x-csrf-token": "csrf-token-allowed-123456"
    },
    body: patch
  });
  assert.equal(updated.status, 200);
  assert.equal(updated.headers.get("access-control-allow-origin"), "http://localhost:3000");
  assert.equal(updateCalls, 1);

  await sessionStore.revoke("cookie-session-001");
  const revoked = await fetch(`${baseUrl}/api/v1/me/profile`, { headers: { cookie } });
  assert.equal(revoked.status, 401);
});

test("API member administration scopes reads and role changes to the authorized workspace", async (context) => {
  const workspaceId = "018f0f7e-9b7d-7c4b-8c1b-1c0f2e6e0003";
  const otherWorkspaceId = "018f0f7e-9b7d-7c4b-8c1b-1c0f2e6e0009";
  const memberId = "018f0f7e-9b7d-7c4b-8c1b-1c0f2e6e0002";
  const member = {
    userId: memberId,
    workspaceId,
    email: "member@example.com",
    displayName: "Member",
    avatarUrl: null,
    role: "editor",
    joinedAt: "2026-07-12T00:00:00.000Z"
  };
  const profileRepository = {
    syncIdentity: async () => ({
      userId: "018f0f7e-9b7d-7c4b-8c1b-1c0f2e6e0001",
      email: "owner@example.com"
    })
  };
  const membershipRepository = {
    listMembers: async (_actor, id) => {
      if (id !== workspaceId) throw new AuthorizationDeniedError();
      return [member];
    },
    listPendingInvitations: async () => [],
    listAuditEvents: async () => [],
    updateMemberRole: async (_actor, id, target, role) => {
      if (id !== workspaceId || target !== memberId) throw new AuthorizationDeniedError();
      return { ...member, role };
    }
  };
  const authProvider = {
    kind: "local",
    verifyAccessToken: async (token) => {
      if (token !== "member-admin-token") throw new Error("invalid token");
      return {
        subject: "identity-subject-a",
        email: "owner@example.com",
        issuer: "local",
        audience: "local-dev",
        expiresAt: Math.floor(Date.now() / 1000) + 3_600,
        tokenUse: "access",
        provider: "local"
      };
    }
  };
  const server = createApiServer({
    checkDatabaseHealth: async () => ({ healthy: true, latencyMs: 1 }),
    authProvider,
    userProfileRepository: profileRepository,
    membershipRepository
  });
  server.listen(0, "127.0.0.1");
  await once(server, "listening");
  context.after(async () => {
    server.close();
    await once(server, "close");
  });

  const address = server.address();
  assert.equal(typeof address, "object");
  const baseUrl = `http://127.0.0.1:${address.port}`;
  const headers = { authorization: "Bearer member-admin-token" };
  const listed = await fetch(`${baseUrl}/api/v1/workspaces/${workspaceId}/members`, { headers });
  assert.equal(listed.status, 200);
  assert.deepEqual(await listed.json(), [member]);

  const crossTenant = await fetch(`${baseUrl}/api/v1/workspaces/${otherWorkspaceId}/members`, {
    headers
  });
  assert.equal(crossTenant.status, 403);

  const roleChanged = await fetch(
    `${baseUrl}/api/v1/workspaces/${workspaceId}/members/${memberId}`,
    {
      method: "PATCH",
      headers: { ...headers, "content-type": "application/json" },
      body: JSON.stringify({ role: "viewer" })
    }
  );
  assert.equal(roleChanged.status, 200);
  assert.equal((await roleChanged.json()).role, "viewer");

  const malformed = await fetch(`${baseUrl}/api/v1/workspaces/${workspaceId}/members/${memberId}`, {
    method: "PATCH",
    headers: { ...headers, "content-type": "application/json" },
    body: JSON.stringify({ role: "owner" })
  });
  assert.equal(malformed.status, 400);
});
