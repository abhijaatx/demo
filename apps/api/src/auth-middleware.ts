import type { IncomingMessage } from "node:http";
import {
  createAuthenticationMiddleware,
  type AuthenticatedRequestContext,
  type AuthenticationMiddlewareOptions,
  type IdentityProvider
} from "@supademo/auth";

export function createApiAuthenticationMiddleware(
  provider: IdentityProvider,
  options: AuthenticationMiddlewareOptions = {}
): (request: IncomingMessage) => Promise<AuthenticatedRequestContext> {
  const authenticate = createAuthenticationMiddleware(provider, options);
  return (request) => authenticate(request.headers);
}
