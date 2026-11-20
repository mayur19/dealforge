import type { Logger } from 'pino';
import type { CreateProductRequest, Role } from '@dealforge/shared';
import { hashPassword } from '../security/password.js';
import { withTransaction, type Db, type Queryable } from './pool.js';

/**
 * DEVELOPMENT-ONLY seed data. Credentials below are public, documented in
 * README, and must never exist in a production database. The seed refuses
 * to run when NODE_ENV=production. It is idempotent (upserts by natural key).
 *
 * TODO(DF-007): load the full PRD §8 dataset (100 SKUs, 8 configurable
 * products, 4 bundles, 2 price books, 8 rules, 40 customers, 60 quotes).
 */
export const DEMO_PASSWORD = 'DemoPassword!2026';

interface DemoOrg {
  readonly slug: string;
  readonly name: string;
  readonly currency: string;
}

interface DemoUser {
  readonly org: string;
  readonly email: string;
  readonly displayName: string;
  readonly role: Role;
}

export const DEMO_ORGS: readonly DemoOrg[] = [
  { slug: 'helix-managed-services', name: 'Helix Managed Services', currency: 'USD' },
  { slug: 'corvid-industrial-supply', name: 'Corvid Industrial Supply', currency: 'USD' },
];

export const DEMO_USERS: readonly DemoUser[] = [
  {
    org: 'helix-managed-services',
    email: 'admin@helix.example',
    displayName: 'Hana Admin',
    role: 'SALES_ADMIN',
  },
  {
    org: 'helix-managed-services',
    email: 'pricing@helix.example',
    displayName: 'Priya Pricing',
    role: 'PRICING_MANAGER',
  },
  {
    org: 'helix-managed-services',
    email: 'rep@helix.example',
    displayName: 'Ravi Rep',
    role: 'SALES_REP',
  },
  {
    org: 'helix-managed-services',
    email: 'manager@helix.example',
    displayName: 'Maya Manager',
    role: 'SALES_MANAGER',
  },
  {
    org: 'helix-managed-services',
    email: 'finance@helix.example',
    displayName: 'Felix Finance',
    role: 'FINANCE_APPROVER',
  },
  {
    org: 'helix-managed-services',
    email: 'customer@atlas.example',
    displayName: 'Ada Atlas (Atlas Manufacturing)',
    role: 'CUSTOMER_VIEWER',
  },
  {
    org: 'corvid-industrial-supply',
    email: 'admin@corvid.example',
    displayName: 'Cora Corvid',
    role: 'SALES_ADMIN',
  },
];

type DemoProduct = Omit<CreateProductRequest, 'description' | 'active'> & {
  readonly org: string;
  readonly description?: string;
  readonly active?: boolean;
};

export const DEMO_PRODUCTS: readonly DemoProduct[] = [
  {
    org: 'helix-managed-services',
    sku: 'EPS-SEAT',
    name: 'Managed endpoint security seat',
    category: 'Security',
    type: 'RECURRING',
    unit: 'seat/month',
    listPriceMinor: 1_200,
    unitCostMinor: 700,
  },
  {
    org: 'helix-managed-services',
    sku: 'SUP-PREMIUM',
    name: 'Premium support (24x7, 1h response)',
    category: 'Support',
    type: 'RECURRING',
    unit: 'seat/month',
    listPriceMinor: 300,
    unitCostMinor: 150,
  },
  {
    org: 'helix-managed-services',
    sku: 'MDR-ADDON',
    name: 'Managed detection and response',
    category: 'Security',
    type: 'RECURRING',
    unit: 'seat/month',
    listPriceMinor: 450,
    unitCostMinor: 260,
  },
  {
    org: 'helix-managed-services',
    sku: 'NET-SUPPORT',
    name: 'Network support retainer',
    category: 'Network',
    type: 'RECURRING',
    unit: 'site/month',
    listPriceMinor: 89_900,
    unitCostMinor: 52_000,
  },
  {
    org: 'helix-managed-services',
    sku: 'IMPL-SVC',
    name: 'Implementation services',
    category: 'Services',
    type: 'ONE_TIME',
    unit: 'hour',
    listPriceMinor: 15_000,
    unitCostMinor: 9_000,
  },
  {
    org: 'helix-managed-services',
    sku: 'FW-APPLIANCE',
    name: 'Next-gen firewall appliance',
    category: 'Hardware',
    type: 'ONE_TIME',
    unit: 'unit',
    listPriceMinor: 249_900,
    unitCostMinor: 181_000,
  },
  {
    org: 'helix-managed-services',
    sku: 'DEPLOY-DAY',
    name: 'On-site deployment day',
    category: 'Services',
    type: 'ONE_TIME',
    unit: 'day',
    listPriceMinor: 120_000,
    unitCostMinor: 70_000,
    active: false,
  },
  {
    org: 'corvid-industrial-supply',
    sku: 'PALLET-RACK',
    name: 'Pallet racking bay',
    category: 'Storage',
    type: 'ONE_TIME',
    unit: 'bay',
    listPriceMinor: 64_500,
    unitCostMinor: 41_000,
  },
  {
    org: 'corvid-industrial-supply',
    sku: 'FORKLIFT-SVC',
    name: 'Forklift maintenance plan',
    category: 'Service',
    type: 'RECURRING',
    unit: 'truck/month',
    listPriceMinor: 18_900,
    unitCostMinor: 11_500,
  },
  {
    org: 'corvid-industrial-supply',
    sku: 'SAFETY-AUDIT',
    name: 'Warehouse safety audit',
    category: 'Service',
    type: 'ONE_TIME',
    unit: 'site',
    listPriceMinor: 95_000,
    unitCostMinor: 60_000,
  },
];

async function upsertOrgs(tx: Queryable): Promise<Map<string, string>> {
  const ids = new Map<string, string>();
  for (const org of DEMO_ORGS) {
    const { rows } = await tx.query<{ id: string }>(
      `INSERT INTO organizations (slug, name, currency_code) VALUES ($1, $2, $3)
       ON CONFLICT (slug) DO UPDATE SET name = EXCLUDED.name, currency_code = EXCLUDED.currency_code
       RETURNING id`,
      [org.slug, org.name, org.currency],
    );
    ids.set(org.slug, rows[0]!.id);
  }
  return ids;
}

async function upsertUsers(tx: Queryable, orgIds: Map<string, string>): Promise<void> {
  const passwordHash = await hashPassword(DEMO_PASSWORD);
  for (const user of DEMO_USERS) {
    await tx.query(
      `INSERT INTO users (organization_id, email, display_name, role, password_hash)
       VALUES ($1, $2, $3, $4, $5)
       ON CONFLICT (email) DO UPDATE
         SET display_name = EXCLUDED.display_name, role = EXCLUDED.role, password_hash = EXCLUDED.password_hash`,
      [orgIds.get(user.org), user.email, user.displayName, user.role, passwordHash],
    );
  }
}

async function upsertProducts(tx: Queryable, orgIds: Map<string, string>): Promise<void> {
  for (const p of DEMO_PRODUCTS) {
    await tx.query(
      `INSERT INTO products (organization_id, sku, name, category, description, type, unit,
                             list_price_minor, unit_cost_minor, active)
       VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10)
       ON CONFLICT (organization_id, sku) DO UPDATE
         SET name = EXCLUDED.name, category = EXCLUDED.category, type = EXCLUDED.type,
             unit = EXCLUDED.unit, list_price_minor = EXCLUDED.list_price_minor,
             unit_cost_minor = EXCLUDED.unit_cost_minor, active = EXCLUDED.active, updated_at = now()`,
      [
        orgIds.get(p.org),
        p.sku,
        p.name,
        p.category,
        p.description ?? '',
        p.type,
        p.unit,
        p.listPriceMinor,
        p.unitCostMinor,
        p.active ?? true,
      ],
    );
  }
}

export async function seed(db: Db, logger: Logger): Promise<void> {
  if (process.env.NODE_ENV === 'production') {
    throw new Error('Refusing to seed demo data when NODE_ENV=production');
  }
  await withTransaction(db, async (tx) => {
    const orgIds = await upsertOrgs(tx);
    await upsertUsers(tx, orgIds);
    await upsertProducts(tx, orgIds);
  });
  logger.info({ users: DEMO_USERS.length, products: DEMO_PRODUCTS.length }, 'demo seed applied');
}
