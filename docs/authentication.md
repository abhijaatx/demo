# Authentication foundation

TASK-021 adds the identity boundary used by future authenticated API routes. The application depends on `@supademo/auth` interfaces rather than a provider SDK in route code.

## Provider model

- **Local/test:** `LocalIdentityProvider` accepts only explicitly configured in-memory fixture tokens and refuses construction in staging or production. No default local user or token exists.
- **Staging/production:** `CognitoIdentityProvider` requires a Cognito issuer, audience, and an injected signature/JWKS verifier. The package deliberately does not scatter AWS SDK calls or implement a second JWT crypto stack.
- **Request middleware:** `createAuthenticationMiddleware` extracts one bounded `Authorization: Bearer <token>` value, delegates verification, revalidates normalized claims, and converts all provider failures to a generic 401 error.
- **API adapter:** `createApiAuthenticationMiddleware` adapts Node HTTP requests to the shared middleware contract.

## Claim contract

The normalized identity requires a bounded subject, exact issuer, expected audience, access-token use, and an unexpired integer `exp` claim. Cognito claims also require `token_use=access`; `aud` or Cognito `client_id` must match the configured audience. Optional `iat` values cannot be materially in the future.

Provider errors, signature failures, malformed claims, expired tokens, invalid audiences, and wrong token uses are not returned to callers. Middleware returns only generic `missing_token` or `invalid_token` errors with HTTP status 401.

## Sessions

`AuthSession` is an opaque server-side session record containing a bounded ID, verified identity, issue/authentication time, token-derived expiry, and a per-session CSRF secret. The browser receives only the opaque ID in an `HttpOnly` cookie; identity claims and the CSRF secret are retained in the server-side session store. `AuthSessionStore` supports active lookup and revocation by session or subject. `InMemoryAuthSessionStore` is intentionally limited to local/test use; a shared durable adapter is required when API instances are scaled.

## Account workflows

TASK-022 adds `AuthWorkflowService`, a provider-neutral application boundary for sign-up, email confirmation, sign-in, sign-out, password recovery/reset, and session refresh. The service validates and normalizes input before calling `AuthWorkflowProvider`; passwords are passed only to that provider and are never logged, persisted, hashed by application code, or included in public errors. A Cognito/SES adapter is responsible for the actual hosted identity operations in staging/production; the local provider remains fixture-backed for development.

Public responses are deliberately enumeration-resistant. Sign-up returns the same continuation message for a new or already-registered address, and password recovery always returns `If an account matches, we’ll send a reset email.` even when the provider reports a failure. Invalid credentials and verification/reset-code failures use generic messages. Each workflow has a bounded rate-limit policy; `InMemoryAuthRateLimiter` is suitable only for local/test use, while production must supply a shared store-backed implementation so limits survive multiple API instances.

The accessible web flow is available at `/auth` and uses the shared API client with `credentials: include` and `cache: no-store`. It provides labeled native forms for sign-up, verification, sign-in, sign-out, recovery, reset, and refresh. The API exposes the matching `POST /api/v1/auth/*` workflow routes when an `AuthWorkflowService` is injected; without a provider wiring, those routes fail closed with a generic 503. The page is marked `noindex` because it is an account utility rather than public content.

Where an application session cookie is used, `createSessionCookiePolicy` produces the production-safe `__Host-supademo_session` policy: `HttpOnly`, `Secure`, `SameSite=Lax`, `Path=/`, and a bounded lifetime. Local/test uses a separate non-secure cookie name so local HTTP development does not weaken production configuration. State-changing requests authenticated by that cookie require the matching `X-CSRF-Token`; bearer-token API and extension clients remain supported without a cookie. Signing out revokes the opaque server-side session and expires the browser cookie.

The API admits browser CORS only from exact entries in `CORS_ALLOWED_ORIGINS`, rejects wildcard/path origins, validates preflight methods and headers, and returns a restrictive API CSP, permissions policy, COOP, and CORP policy. Production deployment must supply a shared session-store adapter and construct the configured Cognito workflow/provider; the API otherwise fails closed rather than issuing a browser session.

## Configuration

Local/test configuration defaults to `AUTH_PROVIDER=local`, `AUTH_AUDIENCE=local-dev`, and the fixture-backed provider. Staging/production configuration defaults to Cognito and requires an HTTPS `AUTH_ISSUER`, non-empty `AUTH_AUDIENCE`, and exact `CORS_ALLOWED_ORIGINS` delivered through AWS Parameter Store. `AUTH_PROVIDER=local` is rejected outside local/test environments.

The identity provider proves who a caller is; later authorization middleware must still resolve workspace membership and action-specific permissions on the server. Hiding UI controls or accepting client-provided workspace claims is never an authorization check.

The normalized identity may carry a validated email claim for the user/profile synchronization boundary. A profile route must not derive ownership from that email; it must use the authenticated subject and only use the email as trusted identity metadata.
