import type { Role } from '@dealforge/shared';
import request from 'supertest';
import { describe, expect, it } from 'vitest';
import { createApp } from '../src/app.js';
import { PENDING_ROUTES } from '../src/modules/index.js';
import { authHeaders, sessionDb } from './fake-session.js';
import { silentLogger, testEnv } from './helpers.js';

function app(role: Role | null) {
  return createApp({ env: testEnv(), logger: silentLogger, db: sessionDb(role), version: 'test' });
}

const ID = '11111111-1111-4111-8111-111111111111';

describe('pending PRD §7 endpoints', () => {
  it.each([
    ['SALES_REP', 'get', '/api/v1/quotes', 'DF-032'],
    ['SALES_REP', 'post', `/api/v1/quote-versions/${ID}/submit`, 'DF-041'],
    ['SALES_REP', 'post', `/api/v1/quote-versions/${ID}/clone-revision`, 'DF-038'],
    ['SALES_MANAGER', 'post', `/api/v1/approvals/${ID}/decision`, 'DF-042'],
    ['FINANCE_APPROVER', 'get', '/api/v1/reports/quotes', 'DF-050'],
    ['PRICING_MANAGER', 'post', `/api/v1/price-books/${ID}/publish`, 'DF-024'],
    ['PRICING_MANAGER', 'patch', `/api/v1/products/${ID}`, 'DF-013'],
    ['PRICING_MANAGER', 'post', '/api/v1/products/import', 'DF-015'],
    ['SALES_REP', 'get', `/api/v1/products/${ID}/options`, 'DF-016'],
    ['SALES_REP', 'post', '/api/v1/pricing/simulate', 'DF-028'],
    ['CUSTOMER_VIEWER', 'post', `/api/v1/customer/quotes/${ID}/acknowledge`, 'DF-047'],
    ['SALES_ADMIN', 'get', '/api/v1/audit-logs', 'DF-053'],
    ['SALES_ADMIN', 'patch', '/api/v1/organization/settings', 'DF-010'],
  ] as const)('%s %s %s -> 501 %s', async (role, method, path, ticket) => {
    const res = await request(app(role))[method](path).set(authHeaders()).send({});
    expect(res.status).toBe(501);
    expect(res.body).toMatchObject({
      success: false,
      data: null,
      error: { code: 'NOT_IMPLEMENTED', details: { ticket } },
    });
  });

  it.each([
    ['SALES_REP', 'post', `/api/v1/approvals/${ID}/decision`],
    ['SALES_REP', 'post', `/api/v1/price-books/${ID}/publish`],
    ['CUSTOMER_VIEWER', 'get', '/api/v1/quotes'],
    ['SALES_MANAGER', 'post', `/api/v1/quote-versions/${ID}/share`],
    ['FINANCE_APPROVER', 'get', '/api/v1/customer/quotes'],
    ['PRICING_MANAGER', 'get', '/api/v1/users'],
  ] as const)('enforces permissions before 501: %s %s %s -> 403', async (role, method, path) => {
    const res = await request(app(role))[method](path).set(authHeaders()).send({});
    expect(res.status).toBe(403);
    expect(res.body.error.code).toBe('FORBIDDEN');
  });

  it('requires authentication on every pending route', async () => {
    for (const route of PENDING_ROUTES) {
      const path = `/api/v1${route.path.replace(/:[a-zA-Z]+/g, ID)}`;
      const res = await request(app(null))[route.method](path).send({});
      expect(res.status, `${route.method} ${path}`).toBe(401);
    }
  });

  it('tracks every pending route with a DF ticket', () => {
    expect(PENDING_ROUTES.length).toBeGreaterThanOrEqual(50);
    for (const route of PENDING_ROUTES) expect(route.ticket).toMatch(/^DF-\d{3}$/);
  });
});
