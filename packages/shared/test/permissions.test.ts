import { describe, expect, it } from 'vitest';
import {
  INTERNAL_ROLES,
  PERMISSIONS,
  PERMISSION_MATRIX,
  ROLES,
  can,
  rolesWith,
} from '../src/index.js';

describe('permission matrix (PRD §3)', () => {
  it('defines an entry for every permission using known roles only', () => {
    for (const permission of PERMISSIONS) {
      expect(PERMISSION_MATRIX[permission].length).toBeGreaterThan(0);
      for (const role of PERMISSION_MATRIX[permission]) expect(ROLES).toContain(role);
    }
  });

  it('lets pricing managers and admins edit the catalog, but not reps', () => {
    expect(can('PRICING_MANAGER', 'catalog:write')).toBe(true);
    expect(can('SALES_ADMIN', 'catalog:write')).toBe(true);
    expect(can('SALES_REP', 'catalog:write')).toBe(false);
    expect(can('SALES_REP', 'catalog:read')).toBe(true);
  });

  it('keeps customer viewers out of every internal surface', () => {
    const customerPermissions = PERMISSIONS.filter((p) => can('CUSTOMER_VIEWER', p));
    expect(customerPermissions).toEqual(['portal:access', 'notifications:read']);
    expect(INTERNAL_ROLES).not.toContain('CUSTOMER_VIEWER');
  });

  it('restricts approval decisions to managers and finance', () => {
    expect(rolesWith('approvals:decide')).toEqual(['SALES_MANAGER', 'FINANCE_APPROVER']);
    expect(can('SALES_REP', 'approvals:decide')).toBe(false);
  });
});
