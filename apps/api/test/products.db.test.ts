import request from 'supertest';
import { afterAll, beforeAll, describe, expect, it } from 'vitest';
import { createApp } from '../src/app.js';
import type { Db } from '../src/db/pool.js';
import { DEMO_PASSWORD } from '../src/db/seed.js';
import { freshDatabase, TEST_DATABASE_URL } from './db-setup.js';
import { silentLogger, testEnv, TEST_ORIGIN } from './helpers.js';

type Agent = ReturnType<typeof request.agent>;

interface Session {
  readonly agent: Agent;
  readonly csrf: string;
}

const NEW_PRODUCT = {
  sku: 'soc-review',
  name: 'Quarterly SOC review',
  category: 'Security',
  description: 'Analyst-led review of detections and posture.',
  type: 'ONE_TIME',
  unit: 'review',
  listPriceMinor: 450_000,
  unitCostMinor: 275_050,
};

describe.skipIf(!TEST_DATABASE_URL)('integration: products catalog (DF-011)', () => {
  let db: Db;
  let login: (email: string) => Promise<Session>;

  beforeAll(async () => {
    db = await freshDatabase();
    const app = createApp({ env: testEnv(), logger: silentLogger, db, version: 'test' });
    login = async (email) => {
      const agent = request.agent(app);
      const res = await agent
        .post('/api/v1/auth/login')
        .set('Origin', TEST_ORIGIN)
        .send({ email, password: DEMO_PASSWORD });
      expect(res.status).toBe(200);
      return { agent, csrf: res.body.data.csrfToken as string };
    };
  });

  afterAll(async () => {
    await db?.end();
  });

  const create = (session: Session, body: object) =>
    session.agent
      .post('/api/v1/products')
      .set('Origin', TEST_ORIGIN)
      .set('X-CSRF-Token', session.csrf)
      .send(body);

  it('lists the tenant catalog with pagination metadata, sorted by SKU', async () => {
    const rep = await login('rep@helix.example');
    const res = await rep.agent.get('/api/v1/products?page=1&limit=3');
    expect(res.status).toBe(200);
    expect(res.body.meta).toEqual({ total: 7, page: 1, limit: 3 });
    expect(res.body.data.map((p: { sku: string }) => p.sku)).toEqual([
      'DEPLOY-DAY',
      'EPS-SEAT',
      'FW-APPLIANCE',
    ]);
    expect(res.body.data[1]).toMatchObject({
      listPriceMinor: 1_200,
      unitCostMinor: 700,
      currencyCode: 'USD',
      type: 'RECURRING',
    });
  });

  it('lets a pricing manager create a product with integer money and audits it', async () => {
    const pricing = await login('pricing@helix.example');
    const res = await create(pricing, NEW_PRODUCT);
    expect(res.status).toBe(201);
    expect(res.body.data).toMatchObject({
      sku: 'SOC-REVIEW',
      listPriceMinor: 450_000,
      unitCostMinor: 275_050,
      active: true,
    });

    const audit = await db.query(
      "SELECT metadata FROM audit_events WHERE action = 'product.created' AND entity_id = $1",
      [res.body.data.id],
    );
    expect(audit.rows).toHaveLength(1);
    expect(audit.rows[0].metadata).toMatchObject({ sku: 'SOC-REVIEW', unitCostMinor: 275_050 });

    const fetched = await pricing.agent.get(`/api/v1/products/${res.body.data.id}`);
    expect(fetched.status).toBe(200);
    expect(fetched.body.data.name).toBe('Quarterly SOC review');
  });

  it('enforces a unique SKU per organization with 409 and no audit row', async () => {
    const admin = await login('admin@helix.example');
    const before = await db.query(
      "SELECT count(*)::int AS n FROM audit_events WHERE action = 'product.created'",
    );
    const res = await create(admin, { ...NEW_PRODUCT, sku: 'SOC-REVIEW' });
    expect(res.status).toBe(409);
    expect(res.body.error.code).toBe('CONFLICT');
    const after = await db.query(
      "SELECT count(*)::int AS n FROM audit_events WHERE action = 'product.created'",
    );
    expect(after.rows[0].n).toBe(before.rows[0].n);
  });

  it('allows the same SKU in a different organization', async () => {
    const corvid = await login('admin@corvid.example');
    const res = await create(corvid, NEW_PRODUCT);
    expect(res.status).toBe(201);
  });

  it('forbids sales reps from changing the catalog (403)', async () => {
    const rep = await login('rep@helix.example');
    const res = await create(rep, { ...NEW_PRODUCT, sku: 'REP-ATTEMPT' });
    expect(res.status).toBe(403);
    expect(res.body.error.code).toBe('FORBIDDEN');
  });

  it('forbids customer viewers from reading the catalog (403)', async () => {
    const customer = await login('customer@atlas.example');
    expect((await customer.agent.get('/api/v1/products')).status).toBe(403);
  });

  it('isolates tenants: org B cannot read org A products (404) or see them in lists', async () => {
    const { rows } = await db.query(
      `SELECT p.id FROM products p JOIN organizations o ON o.id = p.organization_id
        WHERE o.slug = 'helix-managed-services' AND p.sku = 'EPS-SEAT'`,
    );
    const helixProductId: string = rows[0].id;
    const corvid = await login('admin@corvid.example');

    const direct = await corvid.agent.get(`/api/v1/products/${helixProductId}`);
    expect(direct.status).toBe(404);
    expect(direct.body.error.code).toBe('NOT_FOUND');

    const list = await corvid.agent.get('/api/v1/products?limit=100');
    const skus = list.body.data.map((p: { sku: string }) => p.sku);
    expect(skus).not.toContain('EPS-SEAT');
    expect(skus).toEqual(['FORKLIFT-SVC', 'PALLET-RACK', 'SAFETY-AUDIT', 'SOC-REVIEW']);
  });

  it('requires a CSRF token for creation', async () => {
    const pricing = await login('pricing@helix.example');
    const res = await pricing.agent
      .post('/api/v1/products')
      .set('Origin', TEST_ORIGIN)
      .send({ ...NEW_PRODUCT, sku: 'NO-CSRF' });
    expect(res.status).toBe(403);
    expect(res.body.error.code).toBe('CSRF_FAILED');
  });

  it('enforces money bounds in the database as defence in depth', async () => {
    await expect(
      db.query(
        `INSERT INTO products (organization_id, sku, name, category, type, unit, list_price_minor, unit_cost_minor)
         SELECT id, 'NEG-PRICE', 'n', 'c', 'ONE_TIME', 'u', -1, 0 FROM organizations LIMIT 1`,
      ),
    ).rejects.toThrow(/products_list_price_minor_check/);
  });
});
