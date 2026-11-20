import type { PendingRoute } from '../../lib/not-implemented.js';
import { requirePermission } from '../../middleware/authorize.js';

const read = [requirePermission('quotes:read')];
const write = [requirePermission('quotes:write')];

/** Quote families, immutable versions and lifecycle (FR-06, FR-07, ADR-0016). */
export const quotesPendingRoutes: readonly PendingRoute[] = [
  { method: 'get', path: '/quotes', ticket: 'DF-032', guards: read },
  { method: 'post', path: '/quotes', ticket: 'DF-032', guards: write },
  { method: 'get', path: '/quotes/:id', ticket: 'DF-032', guards: read },
  { method: 'get', path: '/quotes/:id/versions', ticket: 'DF-032', guards: read },
  { method: 'get', path: '/quote-versions/:id', ticket: 'DF-032', guards: read },
  { method: 'patch', path: '/quote-versions/:id', ticket: 'DF-035', guards: write },
  { method: 'post', path: '/quote-versions/:id/calculate', ticket: 'DF-035', guards: write },
  { method: 'post', path: '/quote-versions/:id/submit', ticket: 'DF-041', guards: write },
  { method: 'post', path: '/quote-versions/:id/clone-revision', ticket: 'DF-038', guards: write },
  { method: 'post', path: '/quote-versions/:id/reprice', ticket: 'DF-038', guards: write },
  { method: 'post', path: '/quote-versions/:id/withdraw', ticket: 'DF-037', guards: write },
];
