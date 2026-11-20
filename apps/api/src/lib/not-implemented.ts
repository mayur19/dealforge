import { Router, type RequestHandler } from 'express';
import { errors } from './errors.js';

/**
 * Placeholder handler for endpoints defined in the API contract but not yet
 * built. Returns 501 with the backlog ticket id so the gap is explicit.
 */
export function notImplemented(ticket: string): RequestHandler {
  return (_req, _res, next) => next(errors.notImplemented(ticket));
}

export interface PendingRoute {
  readonly method: 'get' | 'post' | 'put' | 'patch' | 'delete';
  readonly path: string;
  readonly ticket: string;
  /** Route-specific guards (e.g. permission checks) run after the shared ones. */
  readonly guards?: readonly RequestHandler[];
}

/**
 * Build a router whose every route responds 501 with its tracking ticket.
 * Guards still run first, so authentication and authorization behave exactly
 * as they will once the endpoint is implemented.
 */
export function pendingRouter(
  routes: readonly PendingRoute[],
  guards: readonly RequestHandler[] = [],
): Router {
  const router = Router();
  for (const route of routes) {
    router[route.method](
      route.path,
      ...guards,
      ...(route.guards ?? []),
      notImplemented(route.ticket),
    );
  }
  return router;
}
