import { describe, expect, it } from 'vitest';
import {
  isRuleEffective,
  matchesConditions,
  selectRule,
} from '../../src/domain/pricing/rule-selection.js';
import { CONTEXT, IMPL_LINE, SEAT_LINE, rule } from './pricing-fixtures.js';

describe('isRuleEffective (inclusive date window)', () => {
  const windowed = rule({ id: 'w', effectiveFrom: '2026-11-01', effectiveUntil: '2026-11-30' });

  it.each([
    ['2026-10-31', false],
    ['2026-11-01', true],
    ['2026-11-15', true],
    ['2026-11-30', true],
    ['2026-12-01', false],
  ])('on %s -> %s', (date, expected) => {
    expect(isRuleEffective(windowed, date)).toBe(expected);
  });

  it('treats a null end date as open-ended', () => {
    expect(isRuleEffective(rule({ id: 'o', effectiveFrom: '2020-01-01' }), '2099-12-31')).toBe(
      true,
    );
  });
});

describe('matchesConditions', () => {
  it('matches everything when no conditions are set', () => {
    expect(matchesConditions(rule({ id: 'any' }), SEAT_LINE, CONTEXT)).toBe(true);
  });

  it('filters by product id and category', () => {
    const byProduct = rule({ id: 'p', conditions: { productIds: ['IMPL-SVC'] } });
    expect(matchesConditions(byProduct, IMPL_LINE, CONTEXT)).toBe(true);
    expect(matchesConditions(byProduct, SEAT_LINE, CONTEXT)).toBe(false);
    const byCategory = rule({ id: 'c', conditions: { productCategories: ['SECURITY'] } });
    expect(matchesConditions(byCategory, SEAT_LINE, CONTEXT)).toBe(true);
    expect(matchesConditions(byCategory, IMPL_LINE, CONTEXT)).toBe(false);
  });

  it('applies inclusive min and max quantity bounds', () => {
    const tier = rule({ id: 'q', conditions: { minQuantity: 100, maxQuantity: 200 } });
    expect(matchesConditions(tier, { ...SEAT_LINE, quantity: 99 }, CONTEXT)).toBe(false);
    expect(matchesConditions(tier, { ...SEAT_LINE, quantity: 100 }, CONTEXT)).toBe(true);
    expect(matchesConditions(tier, { ...SEAT_LINE, quantity: 200 }, CONTEXT)).toBe(true);
    expect(matchesConditions(tier, { ...SEAT_LINE, quantity: 201 }, CONTEXT)).toBe(false);
  });

  it('requires a matching customer tier for customer-tier rules', () => {
    const gold = rule({
      id: 't',
      category: 'CUSTOMER_TIER',
      conditions: { customerTiers: ['GOLD'] },
    });
    expect(matchesConditions(gold, SEAT_LINE, CONTEXT)).toBe(true);
    expect(matchesConditions(gold, SEAT_LINE, { ...CONTEXT, customerTier: 'SILVER' })).toBe(false);
    expect(matchesConditions(gold, SEAT_LINE, { ...CONTEXT, customerTier: null })).toBe(false);
    const anyTier = rule({ id: 'a', category: 'CUSTOMER_TIER' });
    expect(matchesConditions(anyTier, SEAT_LINE, CONTEXT)).toBe(true);
    expect(matchesConditions(anyTier, SEAT_LINE, { ...CONTEXT, customerTier: null })).toBe(false);
  });

  it('only applies bundle rules to lines added through a bundle', () => {
    const bundle = rule({ id: 'b', category: 'BUNDLE', conditions: { bundleCodes: ['SEC-PACK'] } });
    expect(matchesConditions(bundle, SEAT_LINE, CONTEXT)).toBe(false);
    expect(matchesConditions(bundle, { ...SEAT_LINE, bundleCode: 'SEC-PACK' }, CONTEXT)).toBe(true);
    expect(matchesConditions(bundle, { ...SEAT_LINE, bundleCode: 'NET-PACK' }, CONTEXT)).toBe(
      false,
    );
    const anyBundle = rule({ id: 'ab', category: 'BUNDLE' });
    expect(matchesConditions(anyBundle, { ...SEAT_LINE, bundleCode: 'NET-PACK' }, CONTEXT)).toBe(
      true,
    );
    expect(matchesConditions(anyBundle, { ...SEAT_LINE, bundleCode: null }, CONTEXT)).toBe(false);
  });
});

describe('selectRule (at most one per category)', () => {
  it('returns null when nothing is eligible', () => {
    expect(selectRule([], 'VOLUME', SEAT_LINE, CONTEXT)).toBeNull();
    const expired = rule({ id: 'x', effectiveUntil: '2025-12-31', effectiveFrom: '2025-01-01' });
    expect(selectRule([expired], 'VOLUME', SEAT_LINE, CONTEXT)).toBeNull();
  });

  it('ignores rules from other categories', () => {
    const tier = rule({ id: 't', category: 'CUSTOMER_TIER' });
    expect(selectRule([tier], 'VOLUME', SEAT_LINE, CONTEXT)).toBeNull();
  });

  it('picks the highest priority eligible rule', () => {
    const low = rule({ id: 'a-low', priority: 1 });
    const high = rule({ id: 'z-high', priority: 50 });
    const ineligible = rule({ id: 'b-top', priority: 99, conditions: { minQuantity: 10_000 } });
    expect(selectRule([low, ineligible, high], 'VOLUME', SEAT_LINE, CONTEXT)?.id).toBe('z-high');
  });

  it('breaks priority ties deterministically on ascending id', () => {
    const b = rule({ id: 'rule-b', priority: 5 });
    const a = rule({ id: 'rule-a', priority: 5 });
    expect(selectRule([b, a], 'VOLUME', SEAT_LINE, CONTEXT)?.id).toBe('rule-a');
    expect(selectRule([a, b], 'VOLUME', SEAT_LINE, CONTEXT)?.id).toBe('rule-a');
  });

  it('does not mutate the input array', () => {
    const rules = Object.freeze([rule({ id: 'b', priority: 1 }), rule({ id: 'a', priority: 9 })]);
    selectRule(rules, 'VOLUME', SEAT_LINE, CONTEXT);
    expect(rules.map((r) => r.id)).toEqual(['b', 'a']);
  });
});
