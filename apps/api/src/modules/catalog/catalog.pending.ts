import type { PendingRoute } from '../../lib/not-implemented.js';
import { requirePermission } from '../../middleware/authorize.js';

const read = [requirePermission('catalog:read')];
const write = [requirePermission('catalog:write')];

/** Catalog endpoints from PRD §7 that are not built yet (FR-01, FR-03, FR-04). */
export const catalogPendingRoutes: readonly PendingRoute[] = [
  { method: 'patch', path: '/products/:id', ticket: 'DF-013', guards: write },
  { method: 'post', path: '/products/:id/archive', ticket: 'DF-013', guards: write },
  { method: 'post', path: '/products/import', ticket: 'DF-015', guards: write },
  { method: 'get', path: '/products/:id/options', ticket: 'DF-016', guards: read },
  { method: 'post', path: '/products/:id/options', ticket: 'DF-016', guards: write },
  { method: 'post', path: '/products/:id/incompatibilities', ticket: 'DF-017', guards: write },
  { method: 'get', path: '/bundles', ticket: 'DF-019', guards: read },
  { method: 'post', path: '/bundles', ticket: 'DF-019', guards: write },
  { method: 'get', path: '/bundles/:id', ticket: 'DF-019', guards: read },
  { method: 'patch', path: '/bundles/:id', ticket: 'DF-019', guards: write },
];
