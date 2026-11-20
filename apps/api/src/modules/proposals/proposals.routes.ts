import type { PendingRoute } from '../../lib/not-implemented.js';
import { requirePermission } from '../../middleware/authorize.js';

/** Printable proposal and customer sharing (FR-09). */
export const proposalsPendingRoutes: readonly PendingRoute[] = [
  {
    method: 'get',
    path: '/quote-versions/:id/print',
    ticket: 'DF-046',
    guards: [requirePermission('quotes:read')],
  },
  {
    method: 'post',
    path: '/quote-versions/:id/share',
    ticket: 'DF-045',
    guards: [requirePermission('proposals:share')],
  },
  {
    method: 'delete',
    path: '/quote-versions/:id/share/:grantId',
    ticket: 'DF-045',
    guards: [requirePermission('proposals:share')],
  },
];
