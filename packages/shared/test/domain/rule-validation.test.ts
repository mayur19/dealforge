import { describe, expect, it } from 'vitest';
import { DomainError } from '../../src/domain/errors.js';
import { assertValidRule, ruleIssues } from '../../src/domain/pricing/rule-validation.js';
import { GOLD_TIER, VOLUME_200_SEATS, rule } from './pricing-fixtures.js';

describe('rule validation (restricted declarative schema)', () => {
  it('accepts well-formed rules', () => {
    expect(ruleIssues(VOLUME_200_SEATS)).toEqual([]);
    expect(ruleIssues(GOLD_TIER)).toEqual([]);
    expect(
      ruleIssues(rule({ id: 'f', action: { type: 'FIXED_DISCOUNT', amountMinorPerUnit: 1 } })),
    ).toEqual([]);
  });

  it.each([
    ['empty id', rule({ id: '' }), 'id'],
    ['unknown category', rule({ id: 'x', category: 'LOYALTY' as never }), 'category'],
    ['negative priority', rule({ id: 'x', priority: -1 }), 'priority'],
    ['fractional priority', rule({ id: 'x', priority: 1.5 }), 'priority'],
    ['bad from date', rule({ id: 'x', effectiveFrom: '2026-13-01' }), 'effectiveFrom'],
    ['bad until date', rule({ id: 'x', effectiveUntil: 'soon' }), 'effectiveUntil'],
    [
      'until before from',
      rule({ id: 'x', effectiveFrom: '2026-02-01', effectiveUntil: '2026-01-31' }),
      'effectiveUntil',
    ],
    ['zero percent', rule({ id: 'x', action: { type: 'PERCENT_DISCOUNT', bps: 0 } }), 'action'],
    [
      'over 100 percent',
      rule({ id: 'x', action: { type: 'PERCENT_DISCOUNT', bps: 10_001 } }),
      'action',
    ],
    [
      'zero fixed amount',
      rule({ id: 'x', action: { type: 'FIXED_DISCOUNT', amountMinorPerUnit: 0 } }),
      'action',
    ],
    ['unknown action', rule({ id: 'x', action: { type: 'MARKUP' } as never }), 'action'],
    ['max over 100%', rule({ id: 'x', maxDiscountBps: 10_001 }), 'maxDiscountBps'],
    [
      'min quantity zero',
      rule({ id: 'x', conditions: { minQuantity: 0 } }),
      'conditions.minQuantity',
    ],
    [
      'max quantity fractional',
      rule({ id: 'x', conditions: { maxQuantity: 2.5 } }),
      'conditions.maxQuantity',
    ],
    [
      'min above max',
      rule({ id: 'x', conditions: { minQuantity: 10, maxQuantity: 5 } }),
      'conditions.maxQuantity',
    ],
    [
      'empty condition list',
      rule({ id: 'x', conditions: { productIds: [] } }),
      'conditions.productIds',
    ],
  ])('flags %s', (_label, candidate, path) => {
    expect(ruleIssues(candidate).map((issue) => issue.path)).toContain(path);
  });

  it('assertValidRule throws INVALID_RULE with the issue list', () => {
    expect(() => assertValidRule(GOLD_TIER)).not.toThrow();
    try {
      assertValidRule(rule({ id: 'bad', priority: -5 }));
      expect.unreachable();
    } catch (error) {
      expect(error).toBeInstanceOf(DomainError);
      expect((error as DomainError).code).toBe('INVALID_RULE');
      expect((error as DomainError).details).toMatchObject({ ruleId: 'bad' });
    }
  });
});
