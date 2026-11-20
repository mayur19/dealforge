import type { PendingRoute } from '../../lib/not-implemented.js';
import { requirePermission } from '../../middleware/authorize.js';

/**
 * Approval inbox and decisions (FR-08). Routing is computed by the shared
 * evaluateApprovalPolicy(); persistence and decisions are pending.
 */
export const approvalsPendingRoutes: readonly PendingRoute[] = [
  {
    method: 'get',
    path: '/approvals',
    ticket: 'DF-041',
    guards: [requirePermission('approvals:read')],
  },
  {
    method: 'get',
    path: '/approvals/:id',
    ticket: 'DF-042',
    guards: [requirePermission('approvals:read')],
  },
  {
    method: 'post',
    path: '/approvals/:id/decision',
    ticket: 'DF-042',
    guards: [requirePermission('approvals:decide')],
  },
];
