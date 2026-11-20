import { DomainError } from '@dealforge/shared';
import express from 'express';
import request from 'supertest';
import { describe, expect, it } from 'vitest';
import { isUniqueViolation, offsetFor, toSafeInteger } from '../src/lib/sql.js';
import { errorHandler } from '../src/middleware/error-handler.js';
import { silentLogger } from './helpers.js';

describe('sql helpers', () => {
  it('converts bigint strings to safe integers', () => {
    expect(toSafeInteger('123456', 'c')).toBe(123_456);
    expect(toSafeInteger(42, 'c')).toBe(42);
    expect(() => toSafeInteger('9007199254740993', 'amount')).toThrow(/amount/);
    expect(() => toSafeInteger('1.5', 'amount')).toThrow();
  });

  it('detects unique violations by constraint name', () => {
    const err = { code: '23505', constraint: 'products_org_sku_key' };
    expect(isUniqueViolation(err, 'products_org_sku_key')).toBe(true);
    expect(isUniqueViolation(err, 'other')).toBe(false);
    expect(isUniqueViolation({ code: '23503' }, 'products_org_sku_key')).toBe(false);
    expect(isUniqueViolation(null, 'x')).toBe(false);
    expect(isUniqueViolation('boom', 'x')).toBe(false);
  });

  it('computes pagination offsets', () => {
    expect(offsetFor(1, 25)).toBe(0);
    expect(offsetFor(3, 10)).toBe(20);
  });
});

describe('error handler', () => {
  it('maps domain errors to 422 with the domain code', async () => {
    const app = express();
    app.get('/x', () => {
      throw new DomainError('PRICE_NOT_FOUND', 'Product has no price', { productId: 'p1' });
    });
    app.get('/y', () => {
      throw new DomainError('INVALID_RULE', 'Bad rule');
    });
    app.use(errorHandler(silentLogger));
    const res = await request(app).get('/x');
    expect(res.status).toBe(422);
    expect(res.body.error).toMatchObject({
      code: 'VALIDATION_FAILED',
      message: 'Product has no price',
      details: { domainCode: 'PRICE_NOT_FOUND', productId: 'p1' },
    });
    expect((await request(app).get('/y')).body.error.details).toEqual({
      domainCode: 'INVALID_RULE',
    });
  });
});
