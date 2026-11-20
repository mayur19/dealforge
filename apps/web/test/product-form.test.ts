import { describe, expect, it } from 'vitest';
import { EMPTY_PRODUCT_FORM, toCreateProductRequest } from '../src/pages/products/product-form';

const filled = {
  ...EMPTY_PRODUCT_FORM,
  sku: 'eps-seat',
  name: 'Endpoint seat',
  category: 'Security',
  type: 'RECURRING' as const,
  unit: 'seat/month',
  listPrice: '12.00',
  unitCost: '7.05',
};

describe('toCreateProductRequest', () => {
  it('converts decimal text to integer minor units without floats', () => {
    const result = toCreateProductRequest(filled, 'USD');
    expect(result).toEqual({
      ok: true,
      value: expect.objectContaining({ sku: 'EPS-SEAT', listPriceMinor: 1200, unitCostMinor: 705 }),
    });
  });

  it('uses the currency minor digits', () => {
    const result = toCreateProductRequest({ ...filled, listPrice: '1200', unitCost: '700' }, 'JPY');
    expect(result.ok && result.value.listPriceMinor).toBe(1200);
    expect(toCreateProductRequest({ ...filled, listPrice: '12.5' }, 'JPY').ok).toBe(false);
  });

  it('reports field errors for invalid money and missing text', () => {
    const result = toCreateProductRequest(
      { ...filled, listPrice: '12.345', unitCost: 'abc', name: ' ' },
      'USD',
    );
    expect(result.ok).toBe(false);
    if (!result.ok) {
      expect(Object.keys(result.errors).sort()).toEqual(['listPrice', 'name', 'unitCost']);
    }
  });

  it('maps schema money errors back to the form field', () => {
    const result = toCreateProductRequest({ ...filled, listPrice: '-1.00' }, 'USD');
    expect(result.ok).toBe(false);
    if (!result.ok) expect(result.errors.listPrice).toMatch(/negative/);
  });
});
