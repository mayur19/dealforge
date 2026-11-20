import { INTERNAL_ROLES, rolesWith, type Role } from '@dealforge/shared';

export type NavSection =
  'Overview' | 'Catalog' | 'Pricing' | 'Selling' | 'Approvals' | 'Customer' | 'Insights' | 'Admin';

export interface NavItem {
  readonly path: string;
  readonly label: string;
  readonly section: NavSection;
  /** PRD §4 screen number this item delivers. */
  readonly screen: number;
  /** Backlog ticket that delivers this screen; omitted once implemented. */
  readonly ticket?: string;
  /** Roles that see the item. The API enforces the same rules independently. */
  readonly roles: readonly Role[];
}

/**
 * Every screen from PRD §4 (screen 1, login and organization selection, lives
 * outside the shell: /login, with organization switching tracked as DF-008).
 * Items with a ticket render <PendingPage>.
 */
export const NAV_ITEMS: readonly NavItem[] = [
  {
    path: '/',
    label: 'Sales dashboard',
    section: 'Overview',
    screen: 2,
    ticket: 'DF-049',
    roles: rolesWith('quotes:read'),
  },
  {
    path: '/products',
    label: 'Product catalog',
    section: 'Catalog',
    screen: 3,
    roles: rolesWith('catalog:read'),
  },
  {
    path: '/products/editor',
    label: 'Product editor',
    section: 'Catalog',
    screen: 4,
    ticket: 'DF-013',
    roles: rolesWith('catalog:write'),
  },
  {
    path: '/products/options',
    label: 'Options & compatibility',
    section: 'Catalog',
    screen: 5,
    ticket: 'DF-018',
    roles: rolesWith('catalog:write'),
  },
  {
    path: '/bundles',
    label: 'Bundles',
    section: 'Catalog',
    screen: 6,
    ticket: 'DF-020',
    roles: rolesWith('catalog:read'),
  },
  {
    path: '/price-books',
    label: 'Price books',
    section: 'Pricing',
    screen: 7,
    ticket: 'DF-025',
    roles: rolesWith('pricing:write'),
  },
  {
    path: '/pricing-rules',
    label: 'Discount & price rules',
    section: 'Pricing',
    screen: 8,
    ticket: 'DF-027',
    roles: rolesWith('pricing:write'),
  },
  {
    path: '/customers',
    label: 'Customers & contacts',
    section: 'Selling',
    screen: 9,
    ticket: 'DF-031',
    roles: rolesWith('customers:read'),
  },
  {
    path: '/quotes',
    label: 'Quotes',
    section: 'Selling',
    screen: 10,
    ticket: 'DF-033',
    roles: rolesWith('quotes:read'),
  },
  {
    path: '/quotes/new',
    label: 'New quote',
    section: 'Selling',
    screen: 11,
    ticket: 'DF-034',
    roles: rolesWith('quotes:write'),
  },
  {
    path: '/quotes/builder',
    label: 'Quote builder',
    section: 'Selling',
    screen: 12,
    ticket: 'DF-036',
    roles: rolesWith('quotes:write'),
  },
  {
    path: '/quotes/compare',
    label: 'Compare revisions',
    section: 'Selling',
    screen: 13,
    ticket: 'DF-039',
    roles: rolesWith('quotes:read'),
  },
  {
    path: '/approvals',
    label: 'Approval inbox',
    section: 'Approvals',
    screen: 14,
    ticket: 'DF-043',
    roles: rolesWith('approvals:read'),
  },
  {
    path: '/approvals/decision',
    label: 'Approval decision',
    section: 'Approvals',
    screen: 15,
    ticket: 'DF-044',
    roles: rolesWith('approvals:decide'),
  },
  {
    path: '/proposals',
    label: 'Proposal preview & print',
    section: 'Selling',
    screen: 16,
    ticket: 'DF-046',
    roles: rolesWith('quotes:read'),
  },
  {
    path: '/portal',
    label: 'My quotes',
    section: 'Customer',
    screen: 17,
    ticket: 'DF-048',
    roles: rolesWith('portal:access'),
  },
  {
    path: '/reports',
    label: 'Reports',
    section: 'Insights',
    screen: 18,
    ticket: 'DF-051',
    roles: rolesWith('reports:read'),
  },
  {
    path: '/activity',
    label: 'Audit & notifications',
    section: 'Insights',
    screen: 19,
    ticket: 'DF-053',
    roles: INTERNAL_ROLES,
  },
  {
    path: '/settings',
    label: 'Pricing settings & users',
    section: 'Admin',
    screen: 20,
    ticket: 'DF-010',
    roles: rolesWith('settings:manage'),
  },
];

export function navItemsFor(role: Role): readonly NavItem[] {
  return NAV_ITEMS.filter((item) => item.roles.includes(role));
}
