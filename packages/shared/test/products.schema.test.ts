import { describe, expect, it } from 'vitest';
import { MAX_PRODUCT_AMOUNT_MINOR, createProductSchema, skuSchema } from '../src/index.js';

const valid = {
  sku: 'eps-seat',
  name: 'Managed endpoint security seat',
  category: 'Security',
  type: 'RECURRING',
  unit: 'seat/month',
  listPriceMinor: 1_200,
  unitCostMinor: 700,
};

describe('createProductSchema', () => {
  it('normalises SKU casing and applies defaults', () => {
    expect(createProductSchema.parse(valid)).toEqual({
      ...valid,
      sku: 'EPS-SEAT',
      description: '',
      active: true,
    });
  });

  it.each([
    ['fractional price', { listPriceMinor: 12.5 }],
    ['string price', { listPriceMinor: '1200' }],
    ['negative cost', { unitCostMinor: -1 }],
    ['oversized price', { listPriceMinor: MAX_PRODUCT_AMOUNT_MINOR + 1 }],
    ['unknown type', { type: 'USAGE' }],
    ['blank name', { name: '   ' }],
    ['bad sku', { sku: 'has space' }],
    ['unknown field', { margin: 10 }],
  ])('rejects %s', (_label, patch) => {
    expect(createProductSchema.safeParse({ ...valid, ...patch }).success).toBe(false);
  });
});

describe('skuSchema', () => {
  it('accepts dotted, dashed and underscored codes', () => {
    expect(skuSchema.parse(' net_sup.24-7 ')).toBe('NET_SUP.24-7');
    expect(skuSchema.safeParse('A').success).toBe(false);
    expect(skuSchema.safeParse('-LEAD').success).toBe(false);
  });
});
