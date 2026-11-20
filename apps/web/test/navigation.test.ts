import { ROLES } from '@dealforge/shared';
import { describe, expect, it } from 'vitest';
import { NAV_ITEMS, navItemsFor } from '../src/routes/navigation';

describe('navigation (PRD §4)', () => {
  it('covers PRD screens 2-20 exactly once', () => {
    expect(NAV_ITEMS.map((item) => item.screen).sort((a, b) => a - b)).toEqual(
      Array.from({ length: 19 }, (_, i) => i + 2),
    );
  });

  it('tracks every pending screen with a DF ticket and unique path', () => {
    for (const item of NAV_ITEMS) {
      if (item.ticket) expect(item.ticket).toMatch(/^DF-\d{3}$/);
      expect(item.roles.every((role) => ROLES.includes(role))).toBe(true);
    }
    expect(new Set(NAV_ITEMS.map((i) => i.path)).size).toBe(NAV_ITEMS.length);
  });

  it('implements the product catalog screen', () => {
    expect(NAV_ITEMS.find((i) => i.path === '/products')?.ticket).toBeUndefined();
  });

  it('shows customers only their portal and hides internal screens', () => {
    expect(navItemsFor('CUSTOMER_VIEWER').map((i) => i.path)).toEqual(['/portal']);
    expect(navItemsFor('SALES_REP').map((i) => i.path)).toContain('/quotes/builder');
    expect(navItemsFor('SALES_REP').map((i) => i.path)).not.toContain('/price-books');
  });
});
