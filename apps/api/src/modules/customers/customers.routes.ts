import type { PendingRoute } from '../../lib/not-implemented.js';
import { requirePermission } from '../../middleware/authorize.js';

const read = [requirePermission('customers:read')];
const write = [requirePermission('customers:write')];

/** Customer accounts and contacts (PRD §4 screen 9). */
export const customersPendingRoutes: readonly PendingRoute[] = [
  { method: 'get', path: '/customers', ticket: 'DF-030', guards: read },
  { method: 'post', path: '/customers', ticket: 'DF-030', guards: write },
  { method: 'get', path: '/customers/:id', ticket: 'DF-030', guards: read },
  { method: 'patch', path: '/customers/:id', ticket: 'DF-030', guards: write },
  { method: 'get', path: '/customers/:id/contacts', ticket: 'DF-030', guards: read },
  { method: 'post', path: '/customers/:id/contacts', ticket: 'DF-030', guards: write },
];
