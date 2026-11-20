import { can, type Permission, type Role } from '@dealforge/shared';
import type { RequestHandler } from 'express';
import { errors } from '../lib/errors.js';

export const requireAuth: RequestHandler = (req, _res, next) => {
  next(req.auth ? undefined : errors.unauthenticated());
};

/** Role gate. Fine-grained/record-level checks belong in the service layer. */
export function requireRole(...allowed: readonly Role[]): RequestHandler {
  return (req, _res, next) => {
    if (!req.auth) {
      next(errors.unauthenticated());
      return;
    }
    next(allowed.includes(req.auth.user.role) ? undefined : errors.forbidden());
  };
}

/** Permission gate backed by the shared matrix (ADR-0007). */
export function requirePermission(permission: Permission): RequestHandler {
  return (req, _res, next) => {
    if (!req.auth) {
      next(errors.unauthenticated());
      return;
    }
    next(can(req.auth.user.role, permission) ? undefined : errors.forbidden());
  };
}
