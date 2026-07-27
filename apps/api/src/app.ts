import { randomUUID } from "node:crypto";
import { createServer, type IncomingMessage, type Server, type ServerResponse } from "node:http";
import {
  AuthRateLimitError,
  AuthWorkflowError,
  AuthenticationError,
  createAuthSession,
  createAuthenticationMiddleware,
  createSessionCookiePolicy,
  type AuthWorkflowResult,
  type AuthRuntimeEnvironment,
  type AuthSession,
  type AuthSessionStore,
  type AuthWorkflowService,
  type IdentityClaims,
  type IdentityProvider,
  type SessionCookiePolicy
} from "@supademo/auth";
import type { DatabaseHealth } from "@supademo/database";
import {
  normalizeIdempotencyKey,
  parseCreateWorkspaceInput,
  parseUserProfilePatch,
  AuthorizationDeniedError,
  DemoConflictError,
  DemoNotFoundError,
  DemoStoreError,
  DemoValidationError,
  FolderConflictError,
  FolderStoreError,
  FolderValidationError,
  TagConflictError,
  TagValidationError,
  InvitationConflictError,
  InvitationStoreError,
  InvitationValidationError,
  invitationExpiry,
  normalizeInvitationEmail,
  normalizeInvitationRole,
  normalizeInvitationToken,
  normalizeDemoStatus,
  parseCreateDemoInput,
  parseCreateFromTemplateInput,
  parseDemoSearchFilters,
  parseDemoPatch,
  parseDuplicateDemoInput,
  parseSetDemoTemplateInput,
  parseAssignDemoFolderInput,
  parseCreateFolderInput,
  parseMoveFolderInput,
  parseUpdateFolderInput,
  parseCreateTagInput,
  WorkspaceConflictError,
  WorkspaceStoreError,
  WorkspaceValidationError,
  CommentNotFoundError,
  CommentValidationError,
  parseCreateCommentInput,
  parseToggleCommentReactionInput,
  parseToggleResolveCommentInput,
  parseUpdateCommentInput,
  NotificationNotFoundError,
  NotificationValidationError,
  parseMarkNotificationReadInput,
  UserProfileStoreError,
  UserProfileValidationError,
  type CommentRepository,
  type NotificationRepository,
  type UserProfileRepository,
  type WorkspaceRepository,
  type InvitationDelivery,
  type DemoRepository,
  type FolderRepository,
  type TagRepository,
  type WorkspaceInvitationRepository
} from "@supademo/domain";
import {
  normalizeCorrelationId,
  noopLogger,
  noopMetrics,
  noopTracer,
  protectLogger,
  protectMetrics,
  protectTracer,
  withCorrelationContext,
  type Logger,
  type Metrics,
  type Tracer
} from "@supademo/observability";
import { z } from "zod";
import { createOpenApiDocument } from "./openapi.js";
import {
  ErrorResponseSchema,
  HealthResponseSchema,
  LegacyHealthResponseSchema,
  ReadinessResponseSchema,
  RequestIdSchema
} from "./schemas.js";

export const API_V1_PREFIX = "/api/v1" as const;
export const maxRequestBytes = 1_048_576 as const;

export interface ApiServerOptions {
  readonly checkDatabaseHealth: () => Promise<DatabaseHealth>;
  readonly authWorkflow?: AuthWorkflowService;
  readonly authProvider?: IdentityProvider;
  readonly authSessionStore?: AuthSessionStore;
  readonly authEnvironment?: AuthRuntimeEnvironment;
  /** Exact browser, extension, and embed origins. Wildcards are never accepted. */
  readonly allowedOrigins?: readonly string[];
  readonly userProfileRepository?: UserProfileRepository;
  readonly workspaceRepository?: WorkspaceRepository;
  readonly membershipRepository?: WorkspaceInvitationRepository;
  readonly demoRepository?: DemoRepository;
  readonly folderRepository?: FolderRepository;
  readonly tagRepository?: TagRepository;
  readonly commentRepository?: CommentRepository;
  readonly notificationRepository?: NotificationRepository;
  readonly invitationDelivery?: InvitationDelivery;
  readonly logger?: Logger;
  readonly metrics?: Metrics;
  readonly tracer?: Tracer;
}

interface RequestContext {
  readonly requestId: string;
  readonly correlationId: string;
}

const routes: Readonly<Record<string, readonly string[]>> = {
  "/health": ["GET"],
  [`${API_V1_PREFIX}/health`]: ["GET"],
  [`${API_V1_PREFIX}/readiness`]: ["GET"],
  [`${API_V1_PREFIX}/openapi.json`]: ["GET"],
  [`${API_V1_PREFIX}/auth/sign-up`]: ["POST"],
  [`${API_V1_PREFIX}/auth/verify-email`]: ["POST"],
  [`${API_V1_PREFIX}/auth/sign-in`]: ["POST"],
  [`${API_V1_PREFIX}/auth/sign-out`]: ["POST"],
  [`${API_V1_PREFIX}/auth/forgot-password`]: ["POST"],
  [`${API_V1_PREFIX}/auth/reset-password`]: ["POST"],
  [`${API_V1_PREFIX}/auth/refresh-session`]: ["POST"],
  [`${API_V1_PREFIX}/me/profile`]: ["GET", "PATCH"],
  [`${API_V1_PREFIX}/workspaces/current`]: ["GET", "PUT"],
  [`${API_V1_PREFIX}/workspaces`]: ["GET", "POST"]
};

export function createApiServer(options: ApiServerOptions): Server {
  const openApiDocument = createOpenApiDocument();
  const logger = protectLogger(options.logger ?? noopLogger);
  const metrics = protectMetrics(options.metrics ?? noopMetrics);
  const tracer = protectTracer(options.tracer ?? noopTracer);
  const server = createServer((request, response) => {
    const requestId = resolveRequestId(request);
    const context = {
      requestId,
      correlationId: resolveCorrelationId(request, requestId)
    } satisfies RequestContext;
    const startedAt = performance.now();
    const span = tracer.startSpan("http.server", {
      "http.method": request.method ?? "GET",
      "http.route": requestPath(request),
      "correlation.id": context.correlationId
    });
    void withCorrelationContext(context, async () => {
      try {
        await handleRequest(request, response, options, openApiDocument, context);
      } catch {
        if (response.headersSent) {
          response.destroy();
        } else {
          sendError(
            response,
            500,
            "internal_error",
            "The request could not be completed.",
            context.requestId
          );
        }
        logger.error("http_request_failed", contextFields(context));
        span.end("error");
      } finally {
        const durationMs = Math.max(0, performance.now() - startedAt);
        const statusCode = response.statusCode;
        const path = requestPath(request);
        metrics.increment("http.server.requests", 1, {
          method: request.method ?? "GET",
          route: path,
          status: String(statusCode)
        });
        metrics.observe("http.server.duration_ms", durationMs, { route: path });
        span.setAttribute("http.status_code", statusCode);
        span.setAttribute("http.duration_ms", durationMs);
        if (statusCode < 500) {
          span.end("ok");
        }
        logger.info("http_request", {
          ...contextFields(context),
          method: request.method ?? "GET",
          route: path,
          statusCode,
          durationMs
        });
      }
    });
  });

  server.keepAliveTimeout = 5_000;
  server.headersTimeout = 6_000;
  server.requestTimeout = 15_000;
  server.maxHeadersCount = 100;
  return server;
}

async function handleRequest(
  request: IncomingMessage,
  response: ServerResponse,
  options: ApiServerOptions,
  openApiDocument: unknown,
  context: RequestContext
): Promise<void> {
  setResponseHeaders(response, context.requestId, context.correlationId);

  const requestGuard = validateRequestEnvelope(
    request,
    response,
    context.requestId,
    isBodyRequestTarget(request.url, request.method)
  );
  if (!requestGuard.valid) {
    return;
  }

  let url: URL;
  try {
    if ((request.url ?? "").length > 8_192) {
      sendError(
        response,
        414,
        "request_uri_too_large",
        "The request URI is too large.",
        context.requestId
      );
      return;
    }
    url = new URL(request.url ?? "/", "http://api.local");
  } catch {
    sendError(
      response,
      400,
      "invalid_request",
      "The request target is invalid.",
      context.requestId
    );
    return;
  }

  const path = url.pathname;
  const allowedMethods = routes[path] ?? dynamicRouteMethods(path);
  if (!allowedMethods) {
    sendError(
      response,
      404,
      "not_found",
      "The requested resource was not found.",
      context.requestId
    );
    return;
  }

  const method = request.method ?? "GET";
  if (!applyOriginPolicy(request, response, options, allowedMethods, method, context.requestId)) {
    return;
  }
  if (method === "OPTIONS") {
    response.statusCode = 204;
    response.end();
    return;
  }
  if (!allowedMethods.includes(method)) {
    response.setHeader("Allow", allowedMethods.join(", "));
    sendError(
      response,
      405,
      "method_not_allowed",
      "The HTTP method is not supported for this resource.",
      context.requestId
    );
    return;
  }

  if (!(await validateCookieCsrf(request, response, options, context.requestId))) {
    return;
  }

  const demoRoute = resolveDemoRoute(path);
  const acceptsDemoSearch = demoRoute?.kind === "collection" && method === "GET";
  try {
    if (acceptsDemoSearch) parseDemoSearchFilters(readDemoSearchQuery(url.searchParams));
    else z.object({}).strict().parse(Object.fromEntries(url.searchParams.entries()));
  } catch {
    sendError(
      response,
      400,
      "invalid_query",
      acceptsDemoSearch
        ? "The demo search query is invalid."
        : "Query parameters are not supported for this endpoint.",
      context.requestId
    );
    return;
  }

  if (path === "/health") {
    sendSchemaJson(response, 200, LegacyHealthResponseSchema, { status: "ok" });
    return;
  }

  if (path === `${API_V1_PREFIX}/health`) {
    sendSchemaJson(response, 200, HealthResponseSchema, { status: "ok", service: "api" });
    return;
  }

  if (path === `${API_V1_PREFIX}/openapi.json`) {
    sendJson(response, 200, openApiDocument);
    return;
  }

  if (path.startsWith(`${API_V1_PREFIX}/auth/`)) {
    await handleAuthRequest(request, response, options, path, context.requestId);
    return;
  }

  if (path === `${API_V1_PREFIX}/me/profile`) {
    await handleProfileRequest(request, response, options, context.requestId);
    return;
  }

  if (path === `${API_V1_PREFIX}/workspaces`) {
    await handleWorkspaceRequest(request, response, options, context.requestId);
    return;
  }

  if (path === `${API_V1_PREFIX}/workspaces/current`) {
    await handleCurrentWorkspaceRequest(request, response, options, context.requestId);
    return;
  }

  if (resolveFolderRoute(path)) {
    await handleFolderRequest(request, response, options, path, context.requestId);
    return;
  }
  if (resolveTagRoute(path)) {
    await handleTagRequest(request, response, options, path, context.requestId);
    return;
  }

  const commentRoute = resolveCommentRoute(path);
  if (commentRoute) {
    await handleCommentRequest(
      request,
      response,
      options,
      method,
      commentRoute,
      context.requestId,
      url.searchParams
    );
    return;
  }

  const notificationRoute = resolveNotificationRoute(path);
  if (notificationRoute) {
    await handleNotificationRequest(
      request,
      response,
      options,
      method,
      notificationRoute,
      context.requestId,
      url.searchParams
    );
    return;
  }

  if (resolveDemoRoute(path)) {
    await handleDemoRequest(request, response, options, path, context.requestId, url.searchParams);
    return;
  }

  if (path === `${API_V1_PREFIX}/invitations/accept` || resolveMembershipRoute(path)) {
    await handleMembershipRequest(request, response, options, path, context.requestId);
    return;
  }

  const health = await readDatabaseHealth(options.checkDatabaseHealth);
  const ready = health.healthy;
  sendSchemaJson(response, ready ? 200 : 503, ReadinessResponseSchema, {
    status: ready ? "ready" : "not_ready",
    dependencies: {
      database: {
        status: ready ? "ok" : "unavailable",
        latencyMs: health.latencyMs
      }
    }
  });
}

async function readDatabaseHealth(
  checkDatabaseHealth: ApiServerOptions["checkDatabaseHealth"]
): Promise<DatabaseHealth> {
  try {
    return await checkDatabaseHealth();
  } catch {
    return { healthy: false, latencyMs: 0 };
  }
}

function validateRequestEnvelope(
  request: IncomingMessage,
  response: ServerResponse,
  requestId: string,
  allowBody: boolean
): { readonly valid: boolean } {
  const contentLength = request.headers["content-length"];
  if (contentLength !== undefined) {
    if (typeof contentLength !== "string" || !/^\d+$/u.test(contentLength)) {
      request.resume();
      sendError(
        response,
        400,
        "invalid_content_length",
        "The request length is invalid.",
        requestId
      );
      return { valid: false };
    }
    const length = Number(contentLength);
    if (!Number.isSafeInteger(length) || length > maxRequestBytes) {
      request.resume();
      sendError(response, 413, "request_too_large", "The request body is too large.", requestId);
      return { valid: false };
    }
    if (length > 0 && !allowBody) {
      request.resume();
      sendError(
        response,
        400,
        "request_body_not_allowed",
        "This endpoint does not accept a request body.",
        requestId
      );
      return { valid: false };
    }
  }

  const transferEncoding = request.headers["transfer-encoding"];
  if (!allowBody && typeof transferEncoding === "string" && transferEncoding.length > 0) {
    request.resume();
    sendError(
      response,
      400,
      "request_body_not_allowed",
      "This endpoint does not accept a request body.",
      requestId
    );
    return { valid: false };
  }

  return { valid: true };
}

async function handleAuthRequest(
  request: IncomingMessage,
  response: ServerResponse,
  options: ApiServerOptions,
  path: string,
  requestId: string
): Promise<void> {
  if (!options.authWorkflow) {
    sendError(
      response,
      503,
      "authentication_unavailable",
      "Authentication is temporarily unavailable. Try again later.",
      requestId
    );
    return;
  }

  let body: Record<string, string>;
  try {
    body = await readAuthBody(request);
  } catch {
    sendError(response, 400, "invalid_request", "The request body is invalid.", requestId);
    return;
  }

  const rateAddress = (request.socket.remoteAddress ?? "unknown").slice(0, 64);
  const rateSubject = (body["email"] ?? "session").trim().toLowerCase().slice(0, 180);
  const rateKey = `${rateAddress}:${rateSubject}`;
  try {
    let result: AuthWorkflowResult;
    switch (path) {
      case `${API_V1_PREFIX}/auth/sign-up`:
        result = await options.authWorkflow.signUp(
          requireFields(body, "email", "password"),
          rateKey
        );
        break;
      case `${API_V1_PREFIX}/auth/verify-email`:
        result = await options.authWorkflow.confirmEmail(
          requireFields(body, "email", "code"),
          rateKey
        );
        break;
      case `${API_V1_PREFIX}/auth/sign-in`:
        result = await options.authWorkflow.signIn(
          requireFields(body, "email", "password"),
          rateKey
        );
        break;
      case `${API_V1_PREFIX}/auth/sign-out`:
        result = await options.authWorkflow.signOut();
        break;
      case `${API_V1_PREFIX}/auth/forgot-password`:
        result = await options.authWorkflow.requestPasswordReset(
          requireFields(body, "email"),
          rateKey
        );
        break;
      case `${API_V1_PREFIX}/auth/reset-password`:
        result = await options.authWorkflow.resetPassword(
          requireFields(body, "email", "code", "password"),
          rateKey
        );
        break;
      case `${API_V1_PREFIX}/auth/refresh-session`:
        result = await options.authWorkflow.refreshSession(rateKey);
        break;
      default:
        sendError(response, 404, "not_found", "The requested resource was not found.", requestId);
        return;
    }
    if (
      (path === `${API_V1_PREFIX}/auth/sign-in` ||
        path === `${API_V1_PREFIX}/auth/refresh-session`) &&
      result.identity &&
      options.authSessionStore
    ) {
      const existingSessionId = readCookie(
        request.headers["cookie"],
        resolveSessionCookiePolicy(options).name
      );
      if (existingSessionId) await options.authSessionStore.revoke(existingSessionId);
      const csrfToken = randomUUID();
      const policy = resolveSessionCookiePolicy(options);
      const issuedAt = Math.floor(Date.now() / 1000);
      const session = createAuthSession(
        {
          ...result.identity,
          expiresAt: Math.min(result.identity.expiresAt, issuedAt + policy.maxAgeSeconds)
        },
        randomUUID(),
        issuedAt,
        csrfToken
      );
      await options.authSessionStore.create(session);
      response.setHeader("Set-Cookie", serializeSessionCookie(policy, session));
      sendJson(response, 200, publicAuthResult(result, csrfToken));
      return;
    }
    if (path === `${API_V1_PREFIX}/auth/sign-out`) {
      const existingSessionId = readCookie(
        request.headers["cookie"],
        resolveSessionCookiePolicy(options).name
      );
      if (existingSessionId && options.authSessionStore) {
        await options.authSessionStore.revoke(existingSessionId);
      }
      response.setHeader("Set-Cookie", expireSessionCookie(resolveSessionCookiePolicy(options)));
    }
    sendJson(response, 200, publicAuthResult(result));
  } catch (error) {
    if (error instanceof AuthRateLimitError) {
      response.setHeader("Retry-After", String(error.retryAfterSeconds));
      sendError(response, 429, "rate_limited", error.message, requestId);
      return;
    }
    if (error instanceof AuthWorkflowError) {
      sendError(response, error.statusCode, `auth_${error.code}`, error.message, requestId);
      return;
    }
    sendError(
      response,
      503,
      "authentication_unavailable",
      "Authentication is temporarily unavailable. Try again later.",
      requestId
    );
  }
}

async function handleProfileRequest(
  request: IncomingMessage,
  response: ServerResponse,
  options: ApiServerOptions,
  requestId: string
): Promise<void> {
  if ((!options.authProvider && !options.authSessionStore) || !options.userProfileRepository) {
    request.resume();
    sendError(
      response,
      503,
      "profile_unavailable",
      "Your profile is temporarily unavailable. Try again later.",
      requestId
    );
    return;
  }

  let identity;
  try {
    identity = await authenticateProtectedRequest(request, options);
  } catch (error) {
    request.resume();
    if (error instanceof AuthenticationError) {
      sendError(response, 401, error.code, error.message, requestId);
      return;
    }
    sendError(response, 401, "invalid_token", "Authentication is required.", requestId);
    return;
  }

  if (!identity.identity.email) {
    request.resume();
    sendError(
      response,
      503,
      "profile_unavailable",
      "Your profile is temporarily unavailable. Try again later.",
      requestId
    );
    return;
  }

  try {
    if (request.method === "PATCH") {
      const body = await readJsonObjectBody(request);
      const patch = parseUserProfilePatch(body);
      await options.userProfileRepository.syncIdentity({
        subject: identity.identity.subject,
        email: identity.identity.email
      });
      const updated = await options.userProfileRepository.updateProfile(
        identity.identity.subject,
        patch
      );
      if (!updated) {
        sendError(response, 404, "profile_not_found", "The profile was not found.", requestId);
        return;
      }
      sendJson(response, 200, updated);
      return;
    }

    const profile = await options.userProfileRepository.syncIdentity({
      subject: identity.identity.subject,
      email: identity.identity.email
    });
    sendJson(response, 200, profile);
  } catch (error) {
    if (error instanceof UserProfileValidationError) {
      sendError(response, 400, "invalid_profile", error.message, requestId);
      return;
    }
    if (error instanceof UserProfileStoreError) {
      sendError(
        response,
        503,
        "profile_unavailable",
        "Your profile is temporarily unavailable. Try again later.",
        requestId
      );
      return;
    }
    sendError(
      response,
      503,
      "profile_unavailable",
      "Your profile is temporarily unavailable. Try again later.",
      requestId
    );
  }
}

async function handleWorkspaceRequest(
  request: IncomingMessage,
  response: ServerResponse,
  options: ApiServerOptions,
  requestId: string
): Promise<void> {
  if (
    (!options.authProvider && !options.authSessionStore) ||
    !options.userProfileRepository ||
    !options.workspaceRepository
  ) {
    request.resume();
    sendError(
      response,
      503,
      "workspace_unavailable",
      "Workspaces are temporarily unavailable. Try again later.",
      requestId
    );
    return;
  }

  let identity;
  try {
    identity = await authenticateProtectedRequest(request, options);
  } catch (error) {
    request.resume();
    if (error instanceof AuthenticationError) {
      sendError(response, 401, error.code, error.message, requestId);
      return;
    }
    sendError(response, 401, "invalid_token", "Authentication is required.", requestId);
    return;
  }

  if (!identity.identity.email) {
    request.resume();
    sendError(
      response,
      503,
      "workspace_unavailable",
      "Workspaces are temporarily unavailable. Try again later.",
      requestId
    );
    return;
  }

  try {
    const profile = await options.userProfileRepository.syncIdentity({
      subject: identity.identity.subject,
      email: identity.identity.email
    });
    if (request.method === "GET") {
      sendJson(response, 200, await options.workspaceRepository.listForUser(profile.userId));
      return;
    }

    const rawIdempotencyKey = request.headers["idempotency-key"];
    if (typeof rawIdempotencyKey !== "string") {
      request.resume();
      sendError(
        response,
        400,
        "idempotency_key_required",
        "An idempotency key is required to create a workspace.",
        requestId
      );
      return;
    }
    const input = parseCreateWorkspaceInput(await readJsonObjectBody(request));
    const workspace = await options.workspaceRepository.createForUser(
      profile.userId,
      input,
      normalizeIdempotencyKey(rawIdempotencyKey)
    );
    sendJson(response, 201, workspace);
  } catch (error) {
    if (error instanceof WorkspaceValidationError) {
      sendError(response, 400, "invalid_workspace", error.message, requestId);
      return;
    }
    if (error instanceof WorkspaceConflictError) {
      sendError(
        response,
        409,
        "workspace_conflict",
        "The workspace could not be created with the requested values.",
        requestId
      );
      return;
    }
    if (error instanceof WorkspaceStoreError) {
      sendError(
        response,
        503,
        "workspace_unavailable",
        "Workspaces are temporarily unavailable. Try again later.",
        requestId
      );
      return;
    }
    sendError(
      response,
      503,
      "workspace_unavailable",
      "Workspaces are temporarily unavailable. Try again later.",
      requestId
    );
  }
}

async function handleCurrentWorkspaceRequest(
  request: IncomingMessage,
  response: ServerResponse,
  options: ApiServerOptions,
  requestId: string
): Promise<void> {
  if (
    (!options.authProvider && !options.authSessionStore) ||
    !options.userProfileRepository ||
    !options.workspaceRepository
  ) {
    request.resume();
    sendError(
      response,
      503,
      "workspace_unavailable",
      "Workspaces are temporarily unavailable. Try again later.",
      requestId
    );
    return;
  }
  let identity;
  try {
    identity = await authenticateProtectedRequest(request, options);
  } catch (error) {
    request.resume();
    if (error instanceof AuthenticationError) {
      sendError(response, 401, error.code, error.message, requestId);
      return;
    }
    sendError(response, 401, "invalid_token", "Authentication is required.", requestId);
    return;
  }
  if (!identity.identity.email) {
    request.resume();
    sendError(
      response,
      503,
      "workspace_unavailable",
      "Workspaces are temporarily unavailable. Try again later.",
      requestId
    );
    return;
  }
  try {
    const profile = await options.userProfileRepository.syncIdentity({
      subject: identity.identity.subject,
      email: identity.identity.email
    });
    if (request.method === "PUT") {
      const body = requireExactStringFields(await readJsonObjectBody(request), ["workspaceId"]);
      const selected = await options.workspaceRepository.setCurrentForUser(
        profile.userId,
        body["workspaceId"] ?? ""
      );
      if (!selected) {
        sendError(response, 404, "workspace_not_found", "The workspace was not found.", requestId);
        return;
      }
      sendJson(response, 200, selected);
      return;
    }
    const current = await options.workspaceRepository.getCurrentForUser(profile.userId);
    if (current) {
      sendJson(response, 200, current);
      return;
    }
    const workspaces = await options.workspaceRepository.listForUser(profile.userId);
    const fallback = workspaces[0];
    if (!fallback) {
      sendError(response, 404, "workspace_not_found", "No workspace is available.", requestId);
      return;
    }
    const recovered = await options.workspaceRepository.setCurrentForUser(
      profile.userId,
      fallback.workspaceId
    );
    sendJson(response, 200, recovered ?? fallback);
  } catch (error) {
    if (error instanceof WorkspaceValidationError) {
      sendError(response, 400, "invalid_workspace", error.message, requestId);
      return;
    }
    sendError(
      response,
      503,
      "workspace_unavailable",
      "Workspaces are temporarily unavailable. Try again later.",
      requestId
    );
  }
}

async function handleMembershipRequest(
  request: IncomingMessage,
  response: ServerResponse,
  options: ApiServerOptions,
  path: string,
  requestId: string
): Promise<void> {
  if (
    (!options.authProvider && !options.authSessionStore) ||
    !options.userProfileRepository ||
    !options.membershipRepository
  ) {
    request.resume();
    sendError(
      response,
      503,
      "membership_unavailable",
      "Membership services are temporarily unavailable. Try again later.",
      requestId
    );
    return;
  }
  let identity;
  try {
    identity = await authenticateProtectedRequest(request, options);
  } catch (error) {
    request.resume();
    if (error instanceof AuthenticationError) {
      sendError(response, 401, error.code, error.message, requestId);
      return;
    }
    sendError(response, 401, "invalid_token", "Authentication is required.", requestId);
    return;
  }
  if (!identity.identity.email) {
    request.resume();
    sendError(
      response,
      503,
      "membership_unavailable",
      "Membership services are temporarily unavailable. Try again later.",
      requestId
    );
    return;
  }

  try {
    const profile = await options.userProfileRepository.syncIdentity({
      subject: identity.identity.subject,
      email: identity.identity.email
    });
    const route = resolveMembershipRoute(path);
    if (!route) {
      sendError(response, 404, "not_found", "The requested resource was not found.", requestId);
      return;
    }
    if (route.kind === "accept") {
      const body = await readJsonObjectBody(request);
      const token = requireExactStringFields(body, ["token"])["token"];
      const workspace = await options.membershipRepository.acceptInvitation(
        normalizeInvitationToken(token),
        profile.userId,
        profile.email
      );
      if (!workspace) {
        sendError(
          response,
          400,
          "invalid_invitation",
          "The invitation is invalid or expired.",
          requestId
        );
        return;
      }
      sendJson(response, 200, workspace);
      return;
    }
    if (route.kind === "members") {
      sendJson(
        response,
        200,
        await options.membershipRepository.listMembers(profile.userId, route.workspaceId)
      );
      return;
    }
    if (route.kind === "pendingInvitations") {
      sendJson(
        response,
        200,
        await options.membershipRepository.listPendingInvitations(profile.userId, route.workspaceId)
      );
      return;
    }
    if (route.kind === "auditEvents") {
      sendJson(
        response,
        200,
        await options.membershipRepository.listAuditEvents(profile.userId, route.workspaceId)
      );
      return;
    }
    if (route.kind === "invite" || route.kind === "resend") {
      if (!options.invitationDelivery) {
        request.resume();
        sendError(
          response,
          503,
          "membership_unavailable",
          "Membership services are temporarily unavailable. Try again later.",
          requestId
        );
        return;
      }
      const workspace = options.workspaceRepository
        ? (await options.workspaceRepository.listForUser(profile.userId)).find(
            (item) => item.workspaceId === route.workspaceId
          )
        : undefined;
      if (!workspace) {
        request.resume();
        sendError(response, 404, "not_found", "The requested resource was not found.", requestId);
        return;
      }
      const created =
        route.kind === "invite"
          ? await createInvitationFromRequest(request, options, route.workspaceId, profile.userId)
          : await options.membershipRepository.resendInvitation(
              profile.userId,
              route.workspaceId,
              route.invitationId,
              invitationExpiry()
            );
      if (!created) {
        sendError(response, 404, "not_found", "The requested resource was not found.", requestId);
        return;
      }
      await options.invitationDelivery.sendInvitation({
        email: created.invitation.email,
        workspaceName: workspace.workspaceName,
        token: created.token,
        expiresAt: created.invitation.expiresAt
      });
      sendJson(response, 202, { message: "The invitation is being sent." });
      return;
    }
    if (route.kind === "revoke") {
      const changed = await options.membershipRepository.revokeInvitation(
        profile.userId,
        route.workspaceId,
        route.invitationId
      );
      if (!changed) {
        sendError(response, 404, "not_found", "The requested resource was not found.", requestId);
        return;
      }
      sendJson(response, 200, { message: "The invitation was revoked." });
      return;
    }
    if (route.kind === "member" && request.method === "PATCH") {
      const body = requireExactStringFields(await readJsonObjectBody(request), ["role"]);
      const member = await options.membershipRepository.updateMemberRole(
        profile.userId,
        route.workspaceId,
        route.memberId,
        normalizeInvitationRole(body["role"])
      );
      if (!member) {
        sendError(response, 404, "not_found", "The requested resource was not found.", requestId);
        return;
      }
      sendJson(response, 200, member);
      return;
    }
    if (route.kind === "member") {
      const removed = await options.membershipRepository.removeMember(
        profile.userId,
        route.workspaceId,
        route.memberId
      );
      if (!removed) {
        sendError(response, 404, "not_found", "The requested resource was not found.", requestId);
        return;
      }
      sendJson(response, 200, { message: "The member was removed." });
      return;
    }
    const left = await options.membershipRepository.leaveWorkspace(
      profile.userId,
      route.workspaceId
    );
    if (!left) {
      sendError(response, 404, "not_found", "The requested resource was not found.", requestId);
      return;
    }
    sendJson(response, 200, { message: "You left the workspace." });
  } catch (error) {
    if (error instanceof AuthorizationDeniedError) {
      sendError(response, 403, "forbidden", error.message, requestId);
      return;
    }
    if (error instanceof InvitationValidationError) {
      sendError(response, 400, "invalid_membership_request", error.message, requestId);
      return;
    }
    if (error instanceof InvitationConflictError) {
      sendError(response, 409, "membership_conflict", error.message, requestId);
      return;
    }
    if (error instanceof InvitationStoreError) {
      sendError(
        response,
        503,
        "membership_unavailable",
        "Membership services are temporarily unavailable. Try again later.",
        requestId
      );
      return;
    }
    sendError(
      response,
      503,
      "membership_unavailable",
      "Membership services are temporarily unavailable. Try again later.",
      requestId
    );
  }
}

async function createInvitationFromRequest(
  request: IncomingMessage,
  options: ApiServerOptions,
  workspaceId: string,
  inviterUserId: string
) {
  const body = await readJsonObjectBody(request);
  const fields = requireExactStringFields(body, ["email", "role"]);
  return options.membershipRepository!.createInvitation(
    workspaceId,
    inviterUserId,
    normalizeInvitationEmail(fields["email"]),
    normalizeInvitationRole(fields["role"]),
    invitationExpiry()
  );
}

async function handleDemoRequest(
  request: IncomingMessage,
  response: ServerResponse,
  options: ApiServerOptions,
  path: string,
  requestId: string,
  searchParams: URLSearchParams
): Promise<void> {
  if (
    (!options.authProvider && !options.authSessionStore) ||
    !options.userProfileRepository ||
    !options.demoRepository
  ) {
    request.resume();
    sendError(
      response,
      503,
      "demo_unavailable",
      "Demos are temporarily unavailable. Try again later.",
      requestId
    );
    return;
  }
  let identity;
  try {
    identity = await authenticateProtectedRequest(request, options);
  } catch (error) {
    request.resume();
    if (error instanceof AuthenticationError) {
      sendError(response, 401, error.code, error.message, requestId);
      return;
    }
    sendError(response, 401, "invalid_token", "Authentication is required.", requestId);
    return;
  }
  if (!identity.identity.email) {
    request.resume();
    sendError(
      response,
      503,
      "demo_unavailable",
      "Demos are temporarily unavailable. Try again later.",
      requestId
    );
    return;
  }

  try {
    const route = resolveDemoRoute(path);
    if (!route) {
      sendError(response, 404, "not_found", "The requested resource was not found.", requestId);
      return;
    }
    const profile = await options.userProfileRepository.syncIdentity({
      subject: identity.identity.subject,
      email: identity.identity.email
    });
    if (route.kind === "collection") {
      if (request.method === "GET") {
        sendJson(
          response,
          200,
          await options.demoRepository.list(
            profile.userId,
            route.workspaceId,
            parseDemoSearchFilters(readDemoSearchQuery(searchParams))
          )
        );
        return;
      }
      const rawIdempotencyKey = request.headers["idempotency-key"];
      if (typeof rawIdempotencyKey !== "string") {
        sendError(
          response,
          400,
          "missing_idempotency_key",
          "An idempotency key is required.",
          requestId
        );
        return;
      }
      const demo = await options.demoRepository.create(
        profile.userId,
        route.workspaceId,
        parseCreateDemoInput(await readJsonObjectBody(request)),
        normalizeIdempotencyKey(rawIdempotencyKey)
      );
      sendJson(response, 201, demo);
      return;
    }
    if (route.kind === "trash") {
      const items = await options.demoRepository.listTrash(profile.userId, route.workspaceId);
      sendJson(response, 200, items);
      return;
    }
    if (route.kind === "demo") {
      if (request.method === "GET") {
        const demo = await options.demoRepository.get(
          profile.userId,
          route.workspaceId,
          route.demoId
        );
        if (!demo) {
          sendError(response, 404, "not_found", "The requested resource was not found.", requestId);
          return;
        }
        sendJson(response, 200, demo);
        return;
      }
      if (request.method === "PATCH") {
        const demo = await options.demoRepository.update(
          profile.userId,
          route.workspaceId,
          route.demoId,
          parseDemoPatch(await readJsonObjectBody(request))
        );
        if (!demo) {
          sendError(response, 404, "not_found", "The requested resource was not found.", requestId);
          return;
        }
        sendJson(response, 200, demo);
        return;
      }
      const deleted = await options.demoRepository.softDelete(
        profile.userId,
        route.workspaceId,
        route.demoId
      );
      if (!deleted) {
        sendError(response, 404, "not_found", "The requested resource was not found.", requestId);
        return;
      }
      sendJson(response, 200, { message: "The demo was moved to trash." });
      return;
    }
    if (route.kind === "archive") {
      const demo = await options.demoRepository.archive(
        profile.userId,
        route.workspaceId,
        route.demoId
      );
      if (!demo) {
        sendError(response, 404, "not_found", "The requested resource was not found.", requestId);
        return;
      }
      sendJson(response, 200, demo);
      return;
    }
    if (route.kind === "unarchive") {
      const demo = await options.demoRepository.unarchive(
        profile.userId,
        route.workspaceId,
        route.demoId
      );
      if (!demo) {
        sendError(response, 404, "not_found", "The requested resource was not found.", requestId);
        return;
      }
      sendJson(response, 200, demo);
      return;
    }
    if (route.kind === "permanent") {
      await options.demoRepository.permanentDelete(profile.userId, route.workspaceId, route.demoId);
      sendJson(response, 200, { message: "The demo was permanently deleted." });
      return;
    }
    if (route.kind === "status") {
      const body = requireDemoStatusBody(await readJsonObjectBody(request));
      const demo = await options.demoRepository.transitionStatus(
        profile.userId,
        route.workspaceId,
        route.demoId,
        normalizeDemoStatus(body)
      );
      if (!demo) {
        sendError(response, 404, "not_found", "The requested resource was not found.", requestId);
        return;
      }
      sendJson(response, 200, demo);
      return;
    }
    if (route.kind === "folder") {
      const demo = await options.demoRepository.assignFolder(
        profile.userId,
        route.workspaceId,
        route.demoId,
        parseAssignDemoFolderInput(await readJsonObjectBody(request)).folderId
      );
      if (!demo) {
        sendError(response, 404, "not_found", "The requested resource was not found.", requestId);
        return;
      }
      sendJson(response, 200, demo);
      return;
    }
    if (route.kind === "duplicate") {
      const body = await readJsonObjectBody(request);
      const rawIdempotencyKey = request.headers["idempotency-key"];
      const idempotencyKey = typeof rawIdempotencyKey === "string" ? rawIdempotencyKey : undefined;
      const demo = await options.demoRepository.duplicate(
        profile.userId,
        route.workspaceId,
        route.demoId,
        parseDuplicateDemoInput(body),
        idempotencyKey
      );
      if (!demo) {
        sendError(response, 404, "not_found", "The requested resource was not found.", requestId);
        return;
      }
      sendJson(response, 201, demo);
      return;
    }
    if (route.kind === "template") {
      const body = await readJsonObjectBody(request);
      const parsed = parseSetDemoTemplateInput(body);
      const demo = await options.demoRepository.setTemplate(
        profile.userId,
        route.workspaceId,
        route.demoId,
        parsed.isTemplate
      );
      if (!demo) {
        sendError(response, 404, "not_found", "The requested resource was not found.", requestId);
        return;
      }
      sendJson(response, 200, demo);
      return;
    }
    if (route.kind === "instantiate") {
      const body = await readJsonObjectBody(request);
      const rawIdempotencyKey = request.headers["idempotency-key"];
      const idempotencyKey = typeof rawIdempotencyKey === "string" ? rawIdempotencyKey : undefined;
      const demo = await options.demoRepository.createFromTemplate(
        profile.userId,
        route.workspaceId,
        route.demoId,
        parseCreateFromTemplateInput(body),
        idempotencyKey
      );
      if (!demo) {
        sendError(response, 404, "not_found", "The requested resource was not found.", requestId);
        return;
      }
      sendJson(response, 201, demo);
      return;
    }
    const demo = await options.demoRepository.restore(
      profile.userId,
      route.workspaceId,
      route.demoId
    );
    if (!demo) {
      sendError(response, 404, "not_found", "The requested resource was not found.", requestId);
      return;
    }
    sendJson(response, 200, demo);
  } catch (error) {
    if (error instanceof AuthorizationDeniedError) {
      sendError(response, 403, "forbidden", error.message, requestId);
      return;
    }
    if (error instanceof DemoNotFoundError) {
      sendError(response, 404, "not_found", (error as Error).message, requestId);
      return;
    }
    if (error instanceof DemoValidationError) {
      sendError(response, 400, "invalid_demo_request", error.message, requestId);
      return;
    }
    if (error instanceof DemoConflictError) {
      sendError(response, 409, "demo_conflict", error.message, requestId);
      return;
    }
    if (error instanceof DemoStoreError) {
      sendError(
        response,
        503,
        "demo_unavailable",
        "Demos are temporarily unavailable. Try again later.",
        requestId
      );
      return;
    }
    sendError(
      response,
      503,
      "demo_unavailable",
      "Demos are temporarily unavailable. Try again later.",
      requestId
    );
  }
}

async function handleFolderRequest(
  request: IncomingMessage,
  response: ServerResponse,
  options: ApiServerOptions,
  path: string,
  requestId: string
): Promise<void> {
  if (
    (!options.authProvider && !options.authSessionStore) ||
    !options.userProfileRepository ||
    !options.folderRepository
  ) {
    request.resume();
    sendError(
      response,
      503,
      "folder_unavailable",
      "Folders are temporarily unavailable. Try again later.",
      requestId
    );
    return;
  }
  let identity;
  try {
    identity = await authenticateProtectedRequest(request, options);
  } catch (error) {
    request.resume();
    if (error instanceof AuthenticationError) {
      sendError(response, 401, error.code, error.message, requestId);
      return;
    }
    sendError(response, 401, "invalid_token", "Authentication is required.", requestId);
    return;
  }
  if (!identity.identity.email) {
    request.resume();
    sendError(
      response,
      503,
      "folder_unavailable",
      "Folders are temporarily unavailable. Try again later.",
      requestId
    );
    return;
  }
  try {
    const route = resolveFolderRoute(path);
    if (!route) {
      sendError(response, 404, "not_found", "The requested resource was not found.", requestId);
      return;
    }
    const profile = await options.userProfileRepository.syncIdentity({
      subject: identity.identity.subject,
      email: identity.identity.email
    });
    if (route.kind === "collection") {
      if (request.method === "GET") {
        sendJson(
          response,
          200,
          await options.folderRepository.list(profile.userId, route.workspaceId)
        );
        return;
      }
      const rawIdempotencyKey = request.headers["idempotency-key"];
      if (typeof rawIdempotencyKey !== "string") {
        sendError(
          response,
          400,
          "missing_idempotency_key",
          "An idempotency key is required.",
          requestId
        );
        return;
      }
      const folder = await options.folderRepository.create(
        profile.userId,
        route.workspaceId,
        parseCreateFolderInput(await readJsonObjectBody(request)),
        normalizeIdempotencyKey(rawIdempotencyKey)
      );
      sendJson(response, 201, folder);
      return;
    }
    if (route.kind === "folder") {
      if (request.method === "PATCH") {
        const folder = await options.folderRepository.update(
          profile.userId,
          route.workspaceId,
          route.folderId,
          parseUpdateFolderInput(await readJsonObjectBody(request))
        );
        if (!folder) {
          sendError(response, 404, "not_found", "The requested resource was not found.", requestId);
          return;
        }
        sendJson(response, 200, folder);
        return;
      }
      const body = await readJsonObjectBody(request);
      const keys = Object.keys(body);
      if (keys.length !== 1 || keys[0] !== "expectedVersion") {
        throw new FolderValidationError("The folder request is invalid.");
      }
      const deleted = await options.folderRepository.delete(
        profile.userId,
        route.workspaceId,
        route.folderId,
        body["expectedVersion"] as number
      );
      if (!deleted) {
        sendError(response, 404, "not_found", "The requested resource was not found.", requestId);
        return;
      }
      sendJson(response, 200, { message: "The folder was deleted. Its content was preserved." });
      return;
    }
    const folder = await options.folderRepository.move(
      profile.userId,
      route.workspaceId,
      route.folderId,
      parseMoveFolderInput(await readJsonObjectBody(request))
    );
    if (!folder) {
      sendError(response, 404, "not_found", "The requested resource was not found.", requestId);
      return;
    }
    sendJson(response, 200, folder);
  } catch (error) {
    if (error instanceof AuthorizationDeniedError) {
      sendError(response, 403, "forbidden", error.message, requestId);
      return;
    }
    if (error instanceof FolderValidationError) {
      sendError(response, 400, "invalid_folder_request", error.message, requestId);
      return;
    }
    if (error instanceof FolderConflictError) {
      sendError(response, 409, "folder_conflict", error.message, requestId);
      return;
    }
    if (error instanceof FolderStoreError) {
      sendError(
        response,
        503,
        "folder_unavailable",
        "Folders are temporarily unavailable. Try again later.",
        requestId
      );
      return;
    }
    sendError(
      response,
      503,
      "folder_unavailable",
      "Folders are temporarily unavailable. Try again later.",
      requestId
    );
  }
}

async function handleTagRequest(
  request: IncomingMessage,
  response: ServerResponse,
  options: ApiServerOptions,
  path: string,
  requestId: string
): Promise<void> {
  if (
    (!options.authProvider && !options.authSessionStore) ||
    !options.userProfileRepository ||
    !options.tagRepository
  ) {
    request.resume();
    sendError(
      response,
      503,
      "tag_unavailable",
      "Tags are temporarily unavailable. Try again later.",
      requestId
    );
    return;
  }
  try {
    const identity = await authenticateProtectedRequest(request, options);
    if (!identity.identity.email) throw new AuthenticationError("invalid_token");
    const route = resolveTagRoute(path);
    if (!route) {
      sendError(response, 404, "not_found", "The requested resource was not found.", requestId);
      return;
    }
    const profile = await options.userProfileRepository.syncIdentity({
      subject: identity.identity.subject,
      email: identity.identity.email
    });
    if (route.kind === "collection" && request.method === "GET") {
      sendJson(response, 200, await options.tagRepository.list(profile.userId, route.workspaceId));
      return;
    }
    if (route.kind === "assignment") {
      const changed =
        request.method === "POST"
          ? await options.tagRepository.assignToDemo(
              profile.userId,
              route.workspaceId,
              route.demoId,
              route.tagId
            )
          : await options.tagRepository.removeFromDemo(
              profile.userId,
              route.workspaceId,
              route.demoId,
              route.tagId
            );
      sendJson(response, 200, {
        message: changed === false ? "The tag was not assigned." : "The demo tags were updated."
      });
      return;
    }
    const key = request.headers["idempotency-key"];
    if (typeof key !== "string") {
      sendError(
        response,
        400,
        "missing_idempotency_key",
        "An idempotency key is required.",
        requestId
      );
      return;
    }
    sendJson(
      response,
      201,
      await options.tagRepository.create(
        profile.userId,
        route.workspaceId,
        parseCreateTagInput(await readJsonObjectBody(request)),
        normalizeIdempotencyKey(key)
      )
    );
  } catch (error) {
    if (error instanceof AuthenticationError) {
      request.resume();
      sendError(response, 401, error.code, error.message, requestId);
      return;
    }
    if (error instanceof AuthorizationDeniedError) {
      sendError(response, 403, "forbidden", error.message, requestId);
      return;
    }
    if (error instanceof TagValidationError) {
      sendError(response, 400, "invalid_tag_request", error.message, requestId);
      return;
    }
    if (error instanceof TagConflictError) {
      sendError(response, 409, "tag_conflict", error.message, requestId);
      return;
    }
    sendError(
      response,
      503,
      "tag_unavailable",
      "Tags are temporarily unavailable. Try again later.",
      requestId
    );
  }
}

type CommentRoute =
  | { readonly kind: "collection"; readonly workspaceId: string }
  | { readonly kind: "comment"; readonly workspaceId: string; readonly commentId: string }
  | { readonly kind: "resolve"; readonly workspaceId: string; readonly commentId: string }
  | { readonly kind: "reactions"; readonly workspaceId: string; readonly commentId: string };

function resolveCommentRoute(path: string): CommentRoute | undefined {
  const collection = new RegExp(`^${API_V1_PREFIX}/workspaces/([^/]+)/comments$`, "u").exec(path);
  if (collection) return { kind: "collection", workspaceId: collection[1]! };
  const resolve = new RegExp(
    `^${API_V1_PREFIX}/workspaces/([^/]+)/comments/([^/]+)/resolve$`,
    "u"
  ).exec(path);
  if (resolve) return { kind: "resolve", workspaceId: resolve[1]!, commentId: resolve[2]! };
  const reactions = new RegExp(
    `^${API_V1_PREFIX}/workspaces/([^/]+)/comments/([^/]+)/reactions$`,
    "u"
  ).exec(path);
  if (reactions) return { kind: "reactions", workspaceId: reactions[1]!, commentId: reactions[2]! };
  const comment = new RegExp(`^${API_V1_PREFIX}/workspaces/([^/]+)/comments/([^/]+)$`, "u").exec(
    path
  );
  if (comment) return { kind: "comment", workspaceId: comment[1]!, commentId: comment[2]! };
  return undefined;
}

async function handleCommentRequest(
  request: IncomingMessage,
  response: ServerResponse,
  options: ApiServerOptions,
  method: string,
  route: CommentRoute,
  requestId: string,
  searchParams: URLSearchParams
): Promise<void> {
  if (!options.commentRepository) {
    sendError(
      response,
      503,
      "comments_unavailable",
      "Comments service is not configured.",
      requestId
    );
    return;
  }
  try {
    let identity;
    try {
      identity = await authenticateProtectedRequest(request, options);
    } catch (error) {
      request.resume();
      if (error instanceof AuthenticationError) {
        sendError(response, 401, error.code, error.message, requestId);
        return;
      }
      sendError(response, 401, "invalid_token", "Authentication is required.", requestId);
      return;
    }
    if (!identity.identity.email) {
      request.resume();
      sendError(
        response,
        503,
        "comment_unavailable",
        "Comments are temporarily unavailable. Try again later.",
        requestId
      );
      return;
    }
    if (!options.userProfileRepository) {
      sendError(
        response,
        503,
        "profile_unavailable",
        "User profiles service is not configured.",
        requestId
      );
      return;
    }
    const profile = await options.userProfileRepository.syncIdentity({
      subject: identity.identity.subject,
      email: identity.identity.email
    });
    if (route.kind === "collection") {
      if (method === "GET") {
        const targetType = searchParams.get("targetType");
        const targetId = searchParams.get("targetId");
        if (targetType !== "demo" && targetType !== "step") {
          sendError(
            response,
            400,
            "invalid_comment_request",
            "Valid targetType query parameter is required.",
            requestId
          );
          return;
        }
        if (!targetId) {
          sendError(
            response,
            400,
            "invalid_comment_request",
            "targetId query parameter is required.",
            requestId
          );
          return;
        }
        const comments = await options.commentRepository.list(
          profile.userId,
          route.workspaceId,
          targetType,
          targetId
        );
        sendJson(response, 200, comments);
        return;
      }
      if (method === "POST") {
        const key = request.headers["idempotency-key"];
        const comment = await options.commentRepository.create(
          profile.userId,
          route.workspaceId,
          parseCreateCommentInput(await readJsonObjectBody(request)),
          normalizeIdempotencyKey(key)
        );
        sendJson(response, 201, comment);
        return;
      }
    }
    if (route.kind === "comment") {
      if (method === "PATCH") {
        const updated = await options.commentRepository.update(
          profile.userId,
          route.workspaceId,
          route.commentId,
          parseUpdateCommentInput(await readJsonObjectBody(request))
        );
        if (!updated) {
          sendError(response, 404, "not_found", "The comment was not found.", requestId);
          return;
        }
        sendJson(response, 200, updated);
        return;
      }
      if (method === "DELETE") {
        await options.commentRepository.delete(profile.userId, route.workspaceId, route.commentId);
        sendJson(response, 200, { success: true });
        return;
      }
    }
    if (route.kind === "resolve" && method === "POST") {
      const input = parseToggleResolveCommentInput(await readJsonObjectBody(request));
      const resolved = await options.commentRepository.toggleResolve(
        profile.userId,
        route.workspaceId,
        route.commentId,
        input.isResolved
      );
      if (!resolved) {
        sendError(response, 404, "not_found", "The comment was not found.", requestId);
        return;
      }
      sendJson(response, 200, resolved);
      return;
    }
    if (route.kind === "reactions" && method === "POST") {
      const input = parseToggleCommentReactionInput(await readJsonObjectBody(request));
      const reacted = await options.commentRepository.toggleReaction(
        profile.userId,
        route.workspaceId,
        route.commentId,
        input.emoji
      );
      if (!reacted) {
        sendError(response, 404, "not_found", "The comment was not found.", requestId);
        return;
      }
      sendJson(response, 200, reacted);
      return;
    }
    sendError(response, 405, "method_not_allowed", "Method not allowed.", requestId);
  } catch (error) {
    if (error instanceof AuthenticationError) {
      request.resume();
      sendError(response, 401, error.code, error.message, requestId);
      return;
    }
    if (error instanceof AuthorizationDeniedError) {
      sendError(response, 403, "forbidden", error.message, requestId);
      return;
    }
    if (error instanceof CommentNotFoundError) {
      sendError(response, 404, "not_found", (error as Error).message, requestId);
      return;
    }
    if (error instanceof CommentValidationError) {
      sendError(response, 400, "invalid_comment_request", (error as Error).message, requestId);
      return;
    }
    sendError(
      response,
      503,
      "comment_unavailable",
      "Comments are temporarily unavailable. Try again later.",
      requestId
    );
  }
}

type NotificationRoute =
  | { readonly kind: "list"; readonly workspaceId: string }
  | { readonly kind: "unreadCount"; readonly workspaceId: string }
  | { readonly kind: "markRead"; readonly workspaceId: string };

function resolveNotificationRoute(path: string): NotificationRoute | undefined {
  const list = new RegExp(`^${API_V1_PREFIX}/workspaces/([^/]+)/notifications$`, "u").exec(path);
  if (list) return { kind: "list", workspaceId: list[1]! };
  const unreadCount = new RegExp(
    `^${API_V1_PREFIX}/workspaces/([^/]+)/notifications/unread-count$`,
    "u"
  ).exec(path);
  if (unreadCount) return { kind: "unreadCount", workspaceId: unreadCount[1]! };
  const markRead = new RegExp(
    `^${API_V1_PREFIX}/workspaces/([^/]+)/notifications/mark-read$`,
    "u"
  ).exec(path);
  if (markRead) return { kind: "markRead", workspaceId: markRead[1]! };
  return undefined;
}

async function handleNotificationRequest(
  request: IncomingMessage,
  response: ServerResponse,
  options: ApiServerOptions,
  method: string,
  route: NotificationRoute,
  requestId: string,
  searchParams: URLSearchParams
): Promise<void> {
  if (!options.notificationRepository) {
    sendError(
      response,
      503,
      "notifications_unavailable",
      "Notifications service is not configured.",
      requestId
    );
    return;
  }
  try {
    let identity;
    try {
      identity = await authenticateProtectedRequest(request, options);
    } catch (error) {
      request.resume();
      if (error instanceof AuthenticationError) {
        sendError(response, 401, error.code, error.message, requestId);
        return;
      }
      sendError(response, 401, "invalid_token", "Authentication is required.", requestId);
      return;
    }
    if (!identity.identity.email) {
      request.resume();
      sendError(
        response,
        503,
        "notification_unavailable",
        "Notifications are temporarily unavailable. Try again later.",
        requestId
      );
      return;
    }
    if (!options.userProfileRepository) {
      sendError(
        response,
        503,
        "profile_unavailable",
        "User profiles service is not configured.",
        requestId
      );
      return;
    }
    const profile = await options.userProfileRepository.syncIdentity({
      subject: identity.identity.subject,
      email: identity.identity.email
    });

    if (route.kind === "list" && method === "GET") {
      const unreadOnly = searchParams.get("unreadOnly") === "true";
      const notifications = await options.notificationRepository.list(
        profile.userId,
        route.workspaceId,
        unreadOnly
      );
      sendJson(response, 200, notifications);
      return;
    }

    if (route.kind === "unreadCount" && method === "GET") {
      const count = await options.notificationRepository.unreadCount(
        profile.userId,
        route.workspaceId
      );
      sendJson(response, 200, { unreadCount: count });
      return;
    }

    if (route.kind === "markRead" && method === "POST") {
      const body = await readJsonObjectBody(request);
      const input = parseMarkNotificationReadInput(body);
      const updatedCount = await options.notificationRepository.markRead(
        profile.userId,
        route.workspaceId,
        input.notificationId
      );
      sendJson(response, 200, { updatedCount });
      return;
    }

    sendError(response, 405, "method_not_allowed", "Method not allowed.", requestId);
  } catch (error) {
    if (error instanceof AuthenticationError) {
      request.resume();
      sendError(response, 401, error.code, error.message, requestId);
      return;
    }
    if (error instanceof AuthorizationDeniedError) {
      sendError(response, 403, "forbidden", error.message, requestId);
      return;
    }
    if (error instanceof NotificationNotFoundError) {
      sendError(response, 404, "not_found", (error as Error).message, requestId);
      return;
    }
    if (error instanceof NotificationValidationError) {
      sendError(response, 400, "invalid_notification_request", (error as Error).message, requestId);
      return;
    }
    sendError(
      response,
      503,
      "notification_unavailable",
      "Notifications are temporarily unavailable. Try again later.",
      requestId
    );
  }
}

type MembershipRoute =
  | { readonly kind: "accept" }
  | { readonly kind: "members"; readonly workspaceId: string }
  | { readonly kind: "pendingInvitations"; readonly workspaceId: string }
  | { readonly kind: "auditEvents"; readonly workspaceId: string }
  | { readonly kind: "invite"; readonly workspaceId: string }
  | { readonly kind: "resend"; readonly workspaceId: string; readonly invitationId: string }
  | { readonly kind: "revoke"; readonly workspaceId: string; readonly invitationId: string }
  | { readonly kind: "member"; readonly workspaceId: string; readonly memberId: string }
  | { readonly kind: "leave"; readonly workspaceId: string };

function resolveMembershipRoute(path: string): MembershipRoute | undefined {
  if (path === `${API_V1_PREFIX}/invitations/accept`) return { kind: "accept" };
  const members = new RegExp(`^${API_V1_PREFIX}/workspaces/([^/]+)/members$`, "u").exec(path);
  if (members) return { kind: "members", workspaceId: members[1]! };
  const pendingInvitations = new RegExp(
    `^${API_V1_PREFIX}/workspaces/([^/]+)/invitations/pending$`,
    "u"
  ).exec(path);
  if (pendingInvitations) {
    return { kind: "pendingInvitations", workspaceId: pendingInvitations[1]! };
  }
  const auditEvents = new RegExp(`^${API_V1_PREFIX}/workspaces/([^/]+)/audit-events$`, "u").exec(
    path
  );
  if (auditEvents) return { kind: "auditEvents", workspaceId: auditEvents[1]! };
  const invite = new RegExp(`^${API_V1_PREFIX}/workspaces/([^/]+)/invitations$`, "u").exec(path);
  if (invite) return { kind: "invite", workspaceId: invite[1]! };
  const invitationAction = new RegExp(
    `^${API_V1_PREFIX}/workspaces/([^/]+)/invitations/([^/]+)/(resend|revoke)$`,
    "u"
  ).exec(path);
  if (invitationAction) {
    return {
      kind: invitationAction[3] === "resend" ? "resend" : "revoke",
      workspaceId: invitationAction[1]!,
      invitationId: invitationAction[2]!
    };
  }
  const member = new RegExp(`^${API_V1_PREFIX}/workspaces/([^/]+)/members/([^/]+)$`, "u").exec(
    path
  );
  if (member) return { kind: "member", workspaceId: member[1]!, memberId: member[2]! };
  const leave = new RegExp(`^${API_V1_PREFIX}/workspaces/([^/]+)/leave$`, "u").exec(path);
  if (leave) return { kind: "leave", workspaceId: leave[1]! };
  return undefined;
}

type DemoRoute =
  | { readonly kind: "collection"; readonly workspaceId: string }
  | { readonly kind: "trash"; readonly workspaceId: string }
  | { readonly kind: "demo"; readonly workspaceId: string; readonly demoId: string }
  | { readonly kind: "status"; readonly workspaceId: string; readonly demoId: string }
  | { readonly kind: "folder"; readonly workspaceId: string; readonly demoId: string }
  | { readonly kind: "archive"; readonly workspaceId: string; readonly demoId: string }
  | { readonly kind: "unarchive"; readonly workspaceId: string; readonly demoId: string }
  | { readonly kind: "restore"; readonly workspaceId: string; readonly demoId: string }
  | { readonly kind: "permanent"; readonly workspaceId: string; readonly demoId: string }
  | { readonly kind: "duplicate"; readonly workspaceId: string; readonly demoId: string }
  | { readonly kind: "template"; readonly workspaceId: string; readonly demoId: string }
  | { readonly kind: "instantiate"; readonly workspaceId: string; readonly demoId: string };

function resolveDemoRoute(path: string): DemoRoute | undefined {
  const collection = new RegExp(`^${API_V1_PREFIX}/workspaces/([^/]+)/demos$`, "u").exec(path);
  if (collection) return { kind: "collection", workspaceId: collection[1]! };
  const trash = new RegExp(`^${API_V1_PREFIX}/workspaces/([^/]+)/trash$`, "u").exec(path);
  if (trash) return { kind: "trash", workspaceId: trash[1]! };
  const action = new RegExp(
    `^${API_V1_PREFIX}/workspaces/([^/]+)/demos/([^/]+)/(status|restore|folder|archive|unarchive|permanent|duplicate|template|instantiate)$`,
    "u"
  ).exec(path);
  if (action) {
    const act = action[3]!;
    return {
      kind: act as
        | "status"
        | "folder"
        | "restore"
        | "archive"
        | "unarchive"
        | "permanent"
        | "duplicate"
        | "template"
        | "instantiate",
      workspaceId: action[1]!,
      demoId: action[2]!
    };
  }
  const demo = new RegExp(`^${API_V1_PREFIX}/workspaces/([^/]+)/demos/([^/]+)$`, "u").exec(path);
  return demo ? { kind: "demo", workspaceId: demo[1]!, demoId: demo[2]! } : undefined;
}

type FolderRoute =
  | { readonly kind: "collection"; readonly workspaceId: string }
  | { readonly kind: "folder"; readonly workspaceId: string; readonly folderId: string }
  | { readonly kind: "move"; readonly workspaceId: string; readonly folderId: string };

function resolveFolderRoute(path: string): FolderRoute | undefined {
  const collection = new RegExp(`^${API_V1_PREFIX}/workspaces/([^/]+)/folders$`, "u").exec(path);
  if (collection) return { kind: "collection", workspaceId: collection[1]! };
  const move = new RegExp(`^${API_V1_PREFIX}/workspaces/([^/]+)/folders/([^/]+)/move$`, "u").exec(
    path
  );
  if (move) return { kind: "move", workspaceId: move[1]!, folderId: move[2]! };
  const folder = new RegExp(`^${API_V1_PREFIX}/workspaces/([^/]+)/folders/([^/]+)$`, "u").exec(
    path
  );
  return folder ? { kind: "folder", workspaceId: folder[1]!, folderId: folder[2]! } : undefined;
}

type TagRoute =
  | { readonly kind: "collection"; readonly workspaceId: string }
  | {
      readonly kind: "assignment";
      readonly workspaceId: string;
      readonly tagId: string;
      readonly demoId: string;
    };
function resolveTagRoute(path: string): TagRoute | undefined {
  const assignment = new RegExp(
    `^${API_V1_PREFIX}/workspaces/([^/]+)/tags/([^/]+)/demos/([^/]+)$`,
    "u"
  ).exec(path);
  if (assignment)
    return {
      kind: "assignment",
      workspaceId: assignment[1]!,
      tagId: assignment[2]!,
      demoId: assignment[3]!
    };
  const match = new RegExp(`^${API_V1_PREFIX}/workspaces/([^/]+)/tags$`, "u").exec(path);
  return match ? { kind: "collection", workspaceId: match[1]! } : undefined;
}

function dynamicRouteMethods(path: string): readonly string[] | undefined {
  const demoRoute = resolveDemoRoute(path);
  if (demoRoute) {
    if (demoRoute.kind === "collection") return ["GET", "POST"];
    if (demoRoute.kind === "trash") return ["GET"];
    if (demoRoute.kind === "demo") return ["GET", "PATCH", "DELETE"];
    if (demoRoute.kind === "permanent") return ["DELETE"];
    return ["POST"];
  }
  const folderRoute = resolveFolderRoute(path);
  if (folderRoute) {
    if (folderRoute.kind === "collection") return ["GET", "POST"];
    if (folderRoute.kind === "folder") return ["PATCH", "DELETE"];
    return ["POST"];
  }
  const tagRoute = resolveTagRoute(path);
  if (tagRoute) return tagRoute.kind === "collection" ? ["GET", "POST"] : ["POST", "DELETE"];
  const route = resolveMembershipRoute(path);
  if (!route) return undefined;
  if (
    route.kind === "members" ||
    route.kind === "pendingInvitations" ||
    route.kind === "auditEvents"
  ) {
    return ["GET"];
  }
  if (route.kind === "member") return ["PATCH", "DELETE"];
  return ["POST"];
}

function requireExactStringFields(
  body: Record<string, unknown>,
  fields: readonly string[]
): Record<string, string> {
  const expected = new Set(fields);
  const keys = Object.keys(body);
  if (keys.length !== fields.length || keys.some((key) => !expected.has(key))) {
    throw new InvitationValidationError("The membership request is invalid.");
  }
  const result: Record<string, string> = {};
  for (const field of fields) {
    const value = body[field];
    if (typeof value !== "string")
      throw new InvitationValidationError("The membership request is invalid.");
    result[field] = value;
  }
  return result;
}

function requireDemoStatusBody(body: Record<string, unknown>): string {
  const keys = Object.keys(body);
  if (keys.length !== 1 || keys[0] !== "status" || typeof body["status"] !== "string") {
    throw new DemoValidationError("The demo request is invalid.");
  }
  return body["status"];
}

function readDemoSearchQuery(searchParams: URLSearchParams): Record<string, string | undefined> {
  const supported = new Set([
    "q",
    "owner",
    "type",
    "status",
    "tag",
    "updatedAfter",
    "updatedBefore"
  ]);
  const result: Record<string, string | undefined> = {};
  for (const [key, value] of searchParams.entries()) {
    if (!supported.has(key) || Object.hasOwn(result, key)) {
      throw new TagValidationError("The demo search is invalid.");
    }
    result[key] = value;
  }
  return result;
}

function isBodyRequestTarget(target: string | undefined, method: string | undefined): boolean {
  try {
    const path = new URL(target ?? "/", "http://api.local").pathname;
    return (
      path.startsWith(`${API_V1_PREFIX}/auth/`) ||
      path === `${API_V1_PREFIX}/me/profile` ||
      path === `${API_V1_PREFIX}/workspaces` ||
      path === `${API_V1_PREFIX}/workspaces/current` ||
      ((method ?? "GET") !== "GET" && resolveDemoRoute(path) !== undefined) ||
      ((method ?? "GET") !== "GET" && resolveFolderRoute(path) !== undefined) ||
      ((method ?? "GET") !== "GET" && resolveTagRoute(path) !== undefined) ||
      ((method ?? "GET") !== "GET" && resolveMembershipRoute(path) !== undefined)
    );
  } catch {
    return false;
  }
}

async function readAuthBody(request: IncomingMessage): Promise<Record<string, string>> {
  const record = await readJsonObjectBody(request);
  const result: Record<string, string> = {};
  for (const [key, value] of Object.entries(record)) {
    if (typeof value !== "string") throw new Error("Invalid field.");
    result[key] = value;
  }
  return result;
}

async function readJsonObjectBody(request: IncomingMessage): Promise<Record<string, unknown>> {
  const chunks: Buffer[] = [];
  let size = 0;
  for await (const chunk of request) {
    const buffer = Buffer.isBuffer(chunk) ? chunk : Buffer.from(chunk);
    size += buffer.length;
    if (size > maxRequestBytes) throw new Error("Request body too large.");
    chunks.push(buffer);
  }
  const parsed: unknown = JSON.parse(Buffer.concat(chunks).toString("utf8"));
  if (!parsed || typeof parsed !== "object" || Array.isArray(parsed)) {
    throw new Error("Request body must be an object.");
  }
  const record = parsed as Record<string, unknown>;
  for (const [key, value] of Object.entries(record)) {
    if (key.length > 128 || JSON.stringify(value).length > 16_384) {
      throw new Error("Invalid field.");
    }
  }
  return record;
}

function requireFields<const Fields extends readonly string[]>(
  body: Record<string, string>,
  ...fields: Fields
): { [Key in Fields[number]]: string } {
  for (const field of fields) {
    if (!(field in body)) throw new AuthWorkflowError("invalid_input");
  }
  return Object.fromEntries(fields.map((field) => [field, body[field]])) as {
    [Key in Fields[number]]: string;
  };
}

function resolveRequestId(request: IncomingMessage): string {
  const candidate = request.headers["x-request-id"];
  if (typeof candidate === "string" && RequestIdSchema.safeParse(candidate).success) {
    return candidate;
  }
  return randomUUID();
}

function resolveCorrelationId(request: IncomingMessage, requestId: string): string {
  return normalizeCorrelationId(request.headers["x-correlation-id"], requestId);
}

function setResponseHeaders(
  response: ServerResponse,
  requestId: string,
  correlationId: string
): void {
  response.setHeader("Cache-Control", "no-store");
  response.setHeader("Content-Security-Policy", "default-src 'none'");
  response.setHeader("Cross-Origin-Opener-Policy", "same-origin");
  response.setHeader("Cross-Origin-Resource-Policy", "same-origin");
  response.setHeader("Content-Type", "application/json; charset=utf-8");
  response.setHeader("Permissions-Policy", "camera=(), geolocation=(), microphone=(), payment=()");
  response.setHeader("Referrer-Policy", "no-referrer");
  response.setHeader("X-Content-Type-Options", "nosniff");
  response.setHeader("X-Frame-Options", "DENY");
  response.setHeader("X-Request-ID", requestId);
  response.setHeader("X-Correlation-ID", correlationId);
}

function applyOriginPolicy(
  request: IncomingMessage,
  response: ServerResponse,
  options: ApiServerOptions,
  allowedMethods: readonly string[],
  method: string,
  requestId: string
): boolean {
  const origin = request.headers["origin"];
  if (origin === undefined) {
    if (method === "OPTIONS") {
      sendError(
        response,
        405,
        "method_not_allowed",
        "The HTTP method is not supported for this resource.",
        requestId
      );
      return false;
    }
    return true;
  }
  if (typeof origin !== "string" || !isAllowedOrigin(origin, options.allowedOrigins ?? [])) {
    sendError(response, 403, "origin_not_allowed", "The request origin is not allowed.", requestId);
    return false;
  }
  response.setHeader("Access-Control-Allow-Origin", origin);
  response.setHeader("Access-Control-Allow-Credentials", "true");
  response.setHeader("Vary", "Origin");
  if (method !== "OPTIONS") return true;

  const requestedMethod = request.headers["access-control-request-method"];
  if (typeof requestedMethod !== "string" || !allowedMethods.includes(requestedMethod)) {
    sendError(
      response,
      403,
      "cors_preflight_denied",
      "The requested method is not allowed.",
      requestId
    );
    return false;
  }
  const requestedHeaders = request.headers["access-control-request-headers"];
  const safeHeaders = new Set([
    "accept",
    "authorization",
    "content-type",
    "idempotency-key",
    "x-correlation-id",
    "x-csrf-token",
    "x-request-id"
  ]);
  const headerNames =
    typeof requestedHeaders === "string"
      ? requestedHeaders
          .split(",")
          .map((value) => value.trim().toLowerCase())
          .filter(Boolean)
      : [];
  if (headerNames.some((header) => !safeHeaders.has(header))) {
    sendError(
      response,
      403,
      "cors_preflight_denied",
      "The requested header is not allowed.",
      requestId
    );
    return false;
  }
  response.setHeader("Access-Control-Allow-Methods", allowedMethods.join(", "));
  response.setHeader("Access-Control-Allow-Headers", [...safeHeaders].join(", "));
  response.setHeader("Access-Control-Max-Age", "600");
  return true;
}

function isAllowedOrigin(origin: string, configuredOrigins: readonly string[]): boolean {
  if (origin.length > 2_048) return false;
  let normalized: string;
  try {
    const parsed = new URL(origin);
    if (parsed.origin !== origin || (parsed.protocol !== "https:" && parsed.protocol !== "http:")) {
      return false;
    }
    normalized = parsed.origin;
  } catch {
    return false;
  }
  return configuredOrigins.some((candidate) => candidate === normalized);
}

async function validateCookieCsrf(
  request: IncomingMessage,
  response: ServerResponse,
  options: ApiServerOptions,
  requestId: string
): Promise<boolean> {
  if (!isUnsafeMethod(request.method ?? "GET") || !options.authSessionStore) return true;
  const sessionId = readCookie(request.headers["cookie"], resolveSessionCookiePolicy(options).name);
  if (!sessionId) return true;
  const session = await options.authSessionStore.getActive(sessionId);
  if (!session?.csrfToken || request.headers["x-csrf-token"] !== session.csrfToken) {
    request.resume();
    sendError(
      response,
      403,
      "csrf_validation_failed",
      "The request could not be verified.",
      requestId
    );
    return false;
  }
  return true;
}

function isUnsafeMethod(method: string): boolean {
  return method !== "GET" && method !== "HEAD" && method !== "OPTIONS";
}

async function authenticateProtectedRequest(
  request: IncomingMessage,
  options: ApiServerOptions
): Promise<{ readonly identity: IdentityClaims; readonly session?: AuthSession }> {
  if (options.authProvider && typeof request.headers.authorization === "string") {
    return createAuthenticationMiddleware(options.authProvider)(request.headers);
  }
  if (!options.authSessionStore) throw new AuthenticationError("missing_token");
  const sessionId = readCookie(request.headers["cookie"], resolveSessionCookiePolicy(options).name);
  if (!sessionId) throw new AuthenticationError("missing_token");
  const session = await options.authSessionStore.getActive(sessionId);
  if (!session) throw new AuthenticationError("invalid_token");
  return { identity: session.identity, session };
}

function resolveSessionCookiePolicy(options: ApiServerOptions): SessionCookiePolicy {
  return createSessionCookiePolicy(options.authEnvironment ?? "local");
}

function readCookie(
  value: string | readonly string[] | undefined,
  name: string
): string | undefined {
  if (typeof value !== "string" || value.length > 8_192) return undefined;
  for (const segment of value.split(";")) {
    const index = segment.indexOf("=");
    if (index < 1) continue;
    const key = segment.slice(0, index).trim();
    const raw = segment.slice(index + 1).trim();
    if (key === name && /^[A-Za-z0-9-]{1,256}$/u.test(raw)) return raw;
  }
  return undefined;
}

function serializeSessionCookie(policy: SessionCookiePolicy, session: AuthSession): string {
  return [
    `${policy.name}=${session.sessionId}`,
    "Path=/",
    `Max-Age=${Math.min(policy.maxAgeSeconds, Math.max(0, session.expiresAt - Math.floor(Date.now() / 1000)))}`,
    "HttpOnly",
    "SameSite=Lax",
    ...(policy.secure ? ["Secure"] : [])
  ].join("; ");
}

function expireSessionCookie(policy: SessionCookiePolicy): string {
  return [
    `${policy.name}=`,
    "Path=/",
    "Max-Age=0",
    "HttpOnly",
    "SameSite=Lax",
    ...(policy.secure ? ["Secure"] : [])
  ].join("; ");
}

function publicAuthResult(result: AuthWorkflowResult, csrfToken?: string): Record<string, unknown> {
  return {
    message: result.message,
    ...(result.verificationRequired === undefined
      ? {}
      : { verificationRequired: result.verificationRequired }),
    ...(csrfToken === undefined ? {} : { csrfToken })
  };
}

function requestPath(request: IncomingMessage): string {
  try {
    const path = new URL(request.url ?? "/", "http://api.local").pathname;
    return path.length <= 128 ? path : "/oversized";
  } catch {
    return "/invalid";
  }
}

function contextFields(context: RequestContext): Record<string, string> {
  return { requestId: context.requestId, correlationId: context.correlationId };
}

function sendSchemaJson(
  response: ServerResponse,
  statusCode: number,
  schema: { parse: (value: unknown) => unknown },
  body: unknown
): void {
  sendJson(response, statusCode, schema.parse(body));
}

function sendJson(response: ServerResponse, statusCode: number, body: unknown): void {
  response.statusCode = statusCode;
  response.end(JSON.stringify(body));
}

function sendError(
  response: ServerResponse,
  statusCode: number,
  code: string,
  message: string,
  requestId: string
): void {
  const body = ErrorResponseSchema.parse({ error: { code, message, requestId } });
  sendJson(response, statusCode, body);
}
