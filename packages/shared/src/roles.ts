/**
 * DealForge actor model (PRD §3, ADR-0007). A role is a coarse capability set;
 * object-level checks (own drafts, explicit customer grants) live in services.
 * Authorization is always enforced by the API; the web only mirrors it.
 *
 * TODO(DF-008): a user may hold several roles per tenant via sales_memberships.
 */
export const ROLES = [
  'SALES_ADMIN',
  'PRICING_MANAGER',
  'SALES_REP',
  'SALES_MANAGER',
  'FINANCE_APPROVER',
  'CUSTOMER_VIEWER',
] as const;

export type Role = (typeof ROLES)[number];

export const ROLE_LABELS: Readonly<Record<Role, string>> = {
  SALES_ADMIN: 'Sales Organization Admin',
  PRICING_MANAGER: 'Pricing Manager',
  SALES_REP: 'Sales Representative',
  SALES_MANAGER: 'Sales Manager',
  FINANCE_APPROVER: 'Finance Approver',
  CUSTOMER_VIEWER: 'Customer Viewer',
};

/** Roles that belong to the selling organization (everyone except customers). */
export const INTERNAL_ROLES: readonly Role[] = ROLES.filter((role) => role !== 'CUSTOMER_VIEWER');

export function isRole(value: unknown): value is Role {
  return typeof value === 'string' && (ROLES as readonly string[]).includes(value);
}
