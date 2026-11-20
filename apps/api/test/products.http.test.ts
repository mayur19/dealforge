import request from 'supertest';
import { describe, expect, it } from 'vitest';
import { createApp } from '../src/app.js';
import { authHeaders, sessionDb } from './fake-session.js';
import { silentLogger, testEnv } from './helpers.js';

function app(role: Parameters<typeof sessionDb>[0]) {
  return createApp({ env: testEnv(), logger: silentLogger, db: sessionDb(role), version: 'test' });
}

describe('products routes (boundary checks without a database)', () => {
  it('answers 404, not 500, for malformed product ids', async () => {
    const res = await request(app('SALES_REP'))
      .get('/api/v1/products/not-a-uuid')
      .set(authHeaders());
    expect(res.status).toBe(404);
    expect(res.body.error.code).toBe('NOT_FOUND');
  });

  it('rejects fractional money before touching the database', async () => {
    const res = await request(app('PRICING_MANAGER'))
      .post('/api/v1/products')
      .set(authHeaders())
      .send({
        sku: 'X-1',
        name: 'X',
        category: 'C',
        type: 'ONE_TIME',
        unit: 'u',
        listPriceMinor: 10.5,
        unitCostMinor: 1,
      });
    expect(res.status).toBe(422);
    expect(res.body.error.details[0].path).toBe('listPriceMinor');
  });

  it('rejects invalid pagination', async () => {
    const res = await request(app('SALES_REP'))
      .get('/api/v1/products?limit=1000')
      .set(authHeaders());
    expect(res.status).toBe(422);
  });

  it('keeps customer viewers out of the catalog', async () => {
    const res = await request(app('CUSTOMER_VIEWER')).get('/api/v1/products').set(authHeaders());
    expect(res.status).toBe(403);
  });
});
