import type { PendingRoute } from '../../lib/not-implemented.js';
import { requirePermission } from '../../middleware/authorize.js';

const portal = [requirePermission('portal:access')];

/**
 * Customer portal (FR-09, ADR-0018). Access is by explicit quote-version
 * grant; responses use a redacted DTO without cost or margin fields.
 */
export const customerPortalPendingRoutes: readonly PendingRoute[] = [
  { method: 'get', path: '/customer/quotes', ticket: 'DF-047', guards: portal },
  { method: 'get', path: '/customer/quotes/:id', ticket: 'DF-047', guards: portal },
  { method: 'post', path: '/customer/quotes/:id/acknowledge', ticket: 'DF-047', guards: portal },
];
