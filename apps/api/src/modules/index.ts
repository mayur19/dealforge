import type { Router } from 'express';
import type { Db } from '../db/pool.js';
import { pendingRouter, type PendingRoute } from '../lib/not-implemented.js';
import { requireAuth } from '../middleware/authorize.js';
import { adminPendingRoutes } from './admin/admin.routes.js';
import { approvalsPendingRoutes } from './approvals/approvals.routes.js';
import { catalogPendingRoutes } from './catalog/catalog.pending.js';
import { createProductsRouter } from './catalog/products.routes.js';
import { createProductService } from './catalog/products.service.js';
import { customerPortalPendingRoutes } from './customer-portal/customer-portal.routes.js';
import { customersPendingRoutes } from './customers/customers.routes.js';
import { pricingPendingRoutes } from './pricing/pricing.routes.js';
import { proposalsPendingRoutes } from './proposals/proposals.routes.js';
import { quotesPendingRoutes } from './quotes/quotes.routes.js';
import { reportingPendingRoutes } from './reporting/reporting.routes.js';

export interface ModuleDeps {
  readonly db: Db;
}

export interface MountedModule {
  readonly path: string;
  readonly router: Router;
}

/** Every PRD §7 endpoint that is registered but not built yet, by module. */
export const PENDING_ROUTES: readonly PendingRoute[] = [
  ...catalogPendingRoutes,
  ...pricingPendingRoutes,
  ...customersPendingRoutes,
  ...quotesPendingRoutes,
  ...approvalsPendingRoutes,
  ...proposalsPendingRoutes,
  ...customerPortalPendingRoutes,
  ...reportingPendingRoutes,
  ...adminPendingRoutes,
];

/**
 * Product modules mounted under /api/v1. Each module owns its routes,
 * service, repository and schemas (ADR-0002). Endpoints not yet built are
 * registered with `pendingRouter` so the API surface matches the contract
 * and returns 501 + ticket id (after auth and permission checks) until built.
 */
export function productModules({ db }: ModuleDeps): readonly MountedModule[] {
  return [
    {
      path: '/products',
      router: createProductsRouter(createProductService({ db })),
    },
    { path: '/', router: pendingRouter(PENDING_ROUTES, [requireAuth]) },
  ];
}
