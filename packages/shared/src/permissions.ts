import type { Role } from './roles.js';

/**
 * Permission matrix (ADR-0007). Routes declare the permission they need and
 * the API resolves it from the session role. The web uses the same matrix to
 * decide what to show, never to decide what is allowed.
 */
export const PERMISSIONS = [
  'catalog:read',
  'catalog:write',
  'pricing:read',
  'pricing:write',
  'customers:read',
  'customers:write',
  'quotes:read',
  'quotes:write',
  'approvals:read',
  'approvals:decide',
  'proposals:share',
  'portal:access',
  'reports:read',
  'audit:read',
  'notifications:read',
  'users:manage',
  'settings:manage',
] as const;

export type Permission = (typeof PERMISSIONS)[number];

const ALL_INTERNAL: readonly Role[] = [
  'SALES_ADMIN',
  'PRICING_MANAGER',
  'SALES_REP',
  'SALES_MANAGER',
  'FINANCE_APPROVER',
];

export const PERMISSION_MATRIX: Readonly<Record<Permission, readonly Role[]>> = {
  'catalog:read': ALL_INTERNAL,
  'catalog:write': ['SALES_ADMIN', 'PRICING_MANAGER'],
  'pricing:read': ALL_INTERNAL,
  'pricing:write': ['SALES_ADMIN', 'PRICING_MANAGER'],
  'customers:read': ['SALES_ADMIN', 'SALES_REP', 'SALES_MANAGER', 'FINANCE_APPROVER'],
  'customers:write': ['SALES_ADMIN', 'SALES_REP', 'SALES_MANAGER'],
  'quotes:read': ['SALES_ADMIN', 'SALES_REP', 'SALES_MANAGER', 'FINANCE_APPROVER'],
  'quotes:write': ['SALES_REP'],
  'approvals:read': ['SALES_ADMIN', 'SALES_MANAGER', 'FINANCE_APPROVER'],
  'approvals:decide': ['SALES_MANAGER', 'FINANCE_APPROVER'],
  'proposals:share': ['SALES_REP'],
  'portal:access': ['CUSTOMER_VIEWER'],
  'reports:read': ['SALES_ADMIN', 'SALES_MANAGER', 'FINANCE_APPROVER'],
  'audit:read': ['SALES_ADMIN', 'FINANCE_APPROVER'],
  'notifications:read': [...ALL_INTERNAL, 'CUSTOMER_VIEWER'],
  'users:manage': ['SALES_ADMIN'],
  'settings:manage': ['SALES_ADMIN'],
};

export function can(role: Role, permission: Permission): boolean {
  return PERMISSION_MATRIX[permission].includes(role);
}

export function rolesWith(permission: Permission): readonly Role[] {
  return PERMISSION_MATRIX[permission];
}
