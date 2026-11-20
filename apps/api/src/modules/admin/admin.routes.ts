import type { PendingRoute } from '../../lib/not-implemented.js';
import { requirePermission } from '../../middleware/authorize.js';

const users = [requirePermission('users:manage')];
const settings = [requirePermission('settings:manage')];

/** User administration and organization pricing settings (PRD §4 screen 20). */
export const adminPendingRoutes: readonly PendingRoute[] = [
  { method: 'get', path: '/users', ticket: 'DF-009', guards: users },
  { method: 'post', path: '/users', ticket: 'DF-009', guards: users },
  { method: 'patch', path: '/users/:id', ticket: 'DF-009', guards: users },
  { method: 'get', path: '/organization/settings', ticket: 'DF-010', guards: settings },
  { method: 'patch', path: '/organization/settings', ticket: 'DF-010', guards: settings },
  { method: 'post', path: '/organization/logo', ticket: 'DF-059', guards: settings },
  { method: 'get', path: '/auth/organizations', ticket: 'DF-008' },
];
