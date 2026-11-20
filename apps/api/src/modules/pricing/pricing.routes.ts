import type { PendingRoute } from '../../lib/not-implemented.js';
import { requirePermission } from '../../middleware/authorize.js';

const read = [requirePermission('pricing:read')];
const write = [requirePermission('pricing:write')];

/**
 * Price books, rules and simulation (FR-02, FR-05). The calculation itself is
 * implemented in @dealforge/shared (priceQuote); persistence is pending.
 */
export const pricingPendingRoutes: readonly PendingRoute[] = [
  { method: 'get', path: '/price-books', ticket: 'DF-024', guards: read },
  { method: 'post', path: '/price-books', ticket: 'DF-024', guards: write },
  { method: 'get', path: '/price-books/:id', ticket: 'DF-024', guards: read },
  { method: 'patch', path: '/price-books/:id', ticket: 'DF-024', guards: write },
  { method: 'post', path: '/price-books/:id/publish', ticket: 'DF-024', guards: write },
  { method: 'get', path: '/pricing-rules', ticket: 'DF-026', guards: read },
  { method: 'post', path: '/pricing-rules', ticket: 'DF-026', guards: write },
  { method: 'patch', path: '/pricing-rules/:id', ticket: 'DF-026', guards: write },
  { method: 'post', path: '/pricing/simulate', ticket: 'DF-028', guards: read },
];
