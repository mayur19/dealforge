import type { PendingRoute } from '../../lib/not-implemented.js';
import { requirePermission } from '../../middleware/authorize.js';

const reports = [requirePermission('reports:read')];
const notifications = [requirePermission('notifications:read')];

/** Dashboard, reports, notifications and audit log (FR-10). */
export const reportingPendingRoutes: readonly PendingRoute[] = [
  {
    method: 'get',
    path: '/reports/dashboard',
    ticket: 'DF-049',
    guards: [requirePermission('quotes:read')],
  },
  { method: 'get', path: '/reports/quotes', ticket: 'DF-050', guards: reports },
  { method: 'get', path: '/reports/export.csv', ticket: 'DF-051', guards: reports },
  { method: 'get', path: '/notifications', ticket: 'DF-052', guards: notifications },
  { method: 'post', path: '/notifications/:id/read', ticket: 'DF-052', guards: notifications },
  {
    method: 'get',
    path: '/audit-logs',
    ticket: 'DF-053',
    guards: [requirePermission('audit:read')],
  },
];
