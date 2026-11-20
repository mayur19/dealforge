import { describe, expect, it } from 'vitest';
import { DomainError } from '../../src/domain/errors.js';
import { priceQuote } from '../../src/domain/pricing/engine.js';
import type { QuotePricingInput } from '../../src/domain/pricing/types.js';
import {
  CONTEXT,
  GOLD_TIER,
  IMPL_LINE,
  PRICE_BOOK,
  SEAT_LINE,
  VOLUME_200_SEATS,
  rule,
} from './pricing-fixtures.js';

function input(overrides: Partial<QuotePricingInput> = {}): QuotePricingInput {
  return {
    lines: [SEAT_LINE, IMPL_LINE],
    priceBook: PRICE_BOOK,
    rules: [VOLUME_200_SEATS, GOLD_TIER],
    context: CONTEXT,
    ...overrides,
  };
}

describe('priceQuote: golden scenario (PRD §8, D-05)', () => {
  const result = priceQuote(input());
  const [seat, impl] = result.lines;

  it('applies base -> options -> volume -> customer tier -> manual in order', () => {
    expect(seat!.steps.map((s) => [s.kind, s.deltaMinor, s.resultMinor])).toEqual([
      ['BASE', 240_000, 240_000],
      ['OPTIONS', 60_000, 300_000],
      ['VOLUME', -24_000, 276_000],
      ['CUSTOMER_TIER', -8_280, 267_720],
      ['MANUAL', -18_740, 248_980],
    ]);
    expect(seat!.appliedRuleIds).toEqual(['r-volume-200', 'r-tier-gold']);
  });

  it('rounds each percentage stage half up to the minor unit (18 740.4 -> 18 740)', () => {
    const manual = seat!.steps.find((s) => s.kind === 'MANUAL')!;
    expect(manual).toMatchObject({ requestedBps: 700, appliedBps: 700, capped: false });
    expect(manual.deltaMinor).toBe(-18_740);
  });

  it('computes per-line cost, profit and margin from snapshots', () => {
    expect(seat).toMatchObject({
      unitListMinor: 1_200,
      unitCostMinor: 700,
      effectiveUnitMinor: 1_500,
      grossMinor: 300_000,
      automaticDiscountMinor: 32_280,
      manualDiscountMinor: 18_740,
      manualDiscountBps: 700,
      netMinor: 248_980,
      costMinor: 170_000,
      grossProfitMinor: 78_980,
      grossMarginBps: 3_172,
    });
  });

  it('does not apply the seat volume rule to services', () => {
    expect(impl!.steps.map((s) => s.kind)).toEqual(['BASE', 'CUSTOMER_TIER', 'MANUAL']);
    expect(impl).toMatchObject({ netMinor: 541_260, costMinor: 360_000, grossMarginBps: 3_349 });
  });

  it('keeps one-time and recurring totals separate', () => {
    expect(result.oneTime).toEqual({
      lineCount: 1,
      grossMinor: 600_000,
      automaticDiscountMinor: 18_000,
      manualDiscountMinor: 40_740,
      netMinor: 541_260,
      costMinor: 360_000,
      grossProfitMinor: 181_260,
      grossMarginBps: 3_349,
      discountBps: 979,
    });
    expect(result.recurringMonthly).toEqual({
      lineCount: 1,
      grossMinor: 300_000,
      automaticDiscountMinor: 32_280,
      manualDiscountMinor: 18_740,
      netMinor: 248_980,
      costMinor: 170_000,
      grossProfitMinor: 78_980,
      grossMarginBps: 3_172,
      discountBps: 1_701,
      contractValueMinor: 2_987_760,
    });
    expect(result.maxManualDiscountBps).toBe(700);
    expect(result).toMatchObject({
      currency: 'USD',
      priceBookId: 'pb-2026-q4',
      pricingDate: '2026-11-20',
    });
  });

  it('is deterministic and does not mutate its input', () => {
    const frozen = Object.freeze(input());
    expect(priceQuote(frozen)).toEqual(priceQuote(frozen));
    expect(SEAT_LINE.manualDiscountBps).toBe(700);
  });
});

describe('priceQuote: stacking and caps', () => {
  it('applies only the highest-priority rule within a category', () => {
    const weaker = rule({
      id: 'r-volume-any',
      priority: 1,
      action: { type: 'PERCENT_DISCOUNT', bps: 2_000 },
    });
    const result = priceQuote(input({ lines: [SEAT_LINE], rules: [weaker, VOLUME_200_SEATS] }));
    const volumeSteps = result.lines[0]!.steps.filter((s) => s.kind === 'VOLUME');
    expect(volumeSteps).toHaveLength(1);
    expect(volumeSteps[0]!.ruleId).toBe('r-volume-200');
  });

  it('caps a percentage rule at its maximum discount', () => {
    const greedy = rule({
      id: 'g',
      action: { type: 'PERCENT_DISCOUNT', bps: 4_000 },
      maxDiscountBps: 1_000,
    });
    const step = priceQuote(input({ lines: [IMPL_LINE], rules: [greedy] })).lines[0]!.steps[1]!;
    expect(step).toMatchObject({
      kind: 'VOLUME',
      requestedBps: 4_000,
      appliedBps: 1_000,
      deltaMinor: -60_000,
      capped: true,
    });
  });

  it('applies fixed per-unit discounts and caps them', () => {
    const fixed = rule({
      id: 'f',
      action: { type: 'FIXED_DISCOUNT', amountMinorPerUnit: 1_000 },
      maxDiscountBps: 5_000,
    });
    const step = priceQuote(input({ lines: [IMPL_LINE], rules: [fixed] })).lines[0]!.steps[1]!;
    expect(step).toMatchObject({
      requestedBps: null,
      appliedBps: null,
      deltaMinor: -40_000,
      capped: false,
    });

    const tooBig = rule({
      id: 'f2',
      action: { type: 'FIXED_DISCOUNT', amountMinorPerUnit: 14_000 },
      maxDiscountBps: 5_000,
    });
    const capped = priceQuote(input({ lines: [IMPL_LINE], rules: [tooBig] })).lines[0]!.steps[1]!;
    expect(capped).toMatchObject({ deltaMinor: -300_000, capped: true });
  });

  it('never lets a fixed discount push the line below zero', () => {
    const wipe = rule({
      id: 'w',
      action: { type: 'FIXED_DISCOUNT', amountMinorPerUnit: 99_999 },
      maxDiscountBps: 10_000,
    });
    const line = priceQuote(
      input({ lines: [{ ...IMPL_LINE, manualDiscountBps: 0 }], rules: [wipe] }),
    ).lines[0]!;
    expect(line.netMinor).toBe(0);
    expect(line.steps[1]).toMatchObject({ deltaMinor: -600_000, capped: true });
  });

  it('caps the manual discount at the organization maximum', () => {
    const line = priceQuote(
      input({ lines: [{ ...IMPL_LINE, manualDiscountBps: 3_500 }], rules: [] }),
    ).lines[0]!;
    expect(line.steps[1]).toMatchObject({
      kind: 'MANUAL',
      requestedBps: 3_500,
      appliedBps: 2_000,
      capped: true,
      deltaMinor: -120_000,
    });
    expect(line.manualDiscountBps).toBe(2_000);
  });

  it('applies the manual discount to the post-automatic price, once', () => {
    const line = priceQuote(input({ lines: [IMPL_LINE], rules: [GOLD_TIER, GOLD_TIER] })).lines[0]!;
    expect(line.steps.filter((s) => s.kind === 'CUSTOMER_TIER')).toHaveLength(1);
    expect(line.manualDiscountMinor).toBe(40_740); // 7% of 582 000, not of 600 000
  });

  it('applies bundle discounts only to bundle lines', () => {
    const bundleRule = rule({
      id: 'b',
      category: 'BUNDLE',
      conditions: { bundleCodes: ['SEC-PACK'] },
      action: { type: 'PERCENT_DISCOUNT', bps: 500 },
    });
    const result = priceQuote(
      input({
        lines: [
          { ...IMPL_LINE, manualDiscountBps: 0, bundleCode: 'SEC-PACK' },
          { ...IMPL_LINE, lineId: 'l3', manualDiscountBps: 0 },
        ],
        rules: [bundleRule],
      }),
    );
    expect(result.lines[0]!.steps.map((s) => s.kind)).toEqual(['BASE', 'BUNDLE']);
    expect(result.lines[1]!.steps.map((s) => s.kind)).toEqual(['BASE']);
  });

  it('skips rules outside their effective window', () => {
    const future = rule({ id: 'fut', effectiveFrom: '2027-01-01' });
    expect(
      priceQuote(input({ lines: [IMPL_LINE], rules: [future] })).lines[0]!.appliedRuleIds,
    ).toEqual([]);
  });
});

describe('priceQuote: margins and edge cases', () => {
  it('reports a null margin for zero revenue instead of a fake value', () => {
    const freebie = { ...IMPL_LINE, productId: 'FREE-AUDIT', quantity: 1, manualDiscountBps: 0 };
    const result = priceQuote(input({ lines: [freebie], rules: [] }));
    expect(result.lines[0]).toMatchObject({
      netMinor: 0,
      costMinor: 2_500,
      grossProfitMinor: -2_500,
      grossMarginBps: null,
    });
    expect(result.oneTime).toMatchObject({ netMinor: 0, grossMarginBps: null, discountBps: null });
  });

  it('returns empty zeroed totals when there are no lines', () => {
    const result = priceQuote(input({ lines: [] }));
    expect(result.lines).toEqual([]);
    expect(result.oneTime).toMatchObject({ lineCount: 0, netMinor: 0, grossMarginBps: null });
    expect(result.recurringMonthly.contractValueMinor).toBe(0);
    expect(result.maxManualDiscountBps).toBe(0);
  });

  it('reports negative margins when cost exceeds revenue', () => {
    const line = { ...IMPL_LINE, manualDiscountBps: 5_000 };
    const result = priceQuote(
      input({ lines: [line], rules: [], context: { ...CONTEXT, maxManualDiscountBps: 10_000 } }),
    );
    expect(result.lines[0]!.grossMarginBps).toBe(-2_000);
  });

  it('supports negative option deltas as long as the unit price stays non-negative', () => {
    const credit = {
      ...IMPL_LINE,
      manualDiscountBps: 0,
      options: [
        {
          optionId: 'o',
          label: 'Remote only',
          unitPriceDeltaMinor: -5_000,
          unitCostDeltaMinor: -1_000,
        },
      ],
    };
    const line = priceQuote(input({ lines: [credit], rules: [] })).lines[0]!;
    expect(line.steps[1]).toMatchObject({
      kind: 'OPTIONS',
      deltaMinor: -200_000,
      resultMinor: 400_000,
    });
    expect(line.costMinor).toBe(320_000);
  });

  it('treats an omitted manual discount as zero and adds no manual step', () => {
    const { manualDiscountBps: _omitted, ...noManual } = IMPL_LINE;
    const line = priceQuote(input({ lines: [noManual], rules: [] })).lines[0]!;
    expect(line.steps.map((s) => s.kind)).toEqual(['BASE']);
    expect(line).toMatchObject({ manualDiscountBps: 0, manualDiscountMinor: 0, netMinor: 600_000 });
  });

  it('computes recurring contract value from billing terms', () => {
    const plain = {
      ...SEAT_LINE,
      options: [],
      manualDiscountBps: 0,
      quantity: 10,
      billingTermMonths: 36,
    };
    const result = priceQuote(input({ lines: [plain], rules: [] }));
    expect(result.recurringMonthly.netMinor).toBe(12_000);
    expect(result.recurringMonthly.contractValueMinor).toBe(432_000);
    expect(result.oneTime.lineCount).toBe(0);
  });
});

describe('priceQuote: rejects invalid input', () => {
  const expectCode = (fn: () => unknown, code: string) => {
    try {
      fn();
      expect.unreachable('expected a DomainError');
    } catch (error) {
      expect(error).toBeInstanceOf(DomainError);
      expect((error as DomainError).code).toBe(code);
    }
  };

  it('requires every product to have a price-book price', () => {
    expectCode(
      () => priceQuote(input({ lines: [{ ...IMPL_LINE, productId: 'NOPE' }] })),
      'PRICE_NOT_FOUND',
    );
  });

  it('requires the quote currency to match the price book', () => {
    expectCode(
      () => priceQuote(input({ context: { ...CONTEXT, currency: 'EUR' } })),
      'CURRENCY_MISMATCH',
    );
  });

  it('validates the pricing date', () => {
    expectCode(
      () => priceQuote(input({ context: { ...CONTEXT, pricingDate: '20/11/2026' } })),
      'INVALID_LINE',
    );
  });

  it('validates quantities and manual discounts', () => {
    expectCode(
      () => priceQuote(input({ lines: [{ ...IMPL_LINE, quantity: 0 }] })),
      'INVALID_QUANTITY',
    );
    expectCode(
      () => priceQuote(input({ lines: [{ ...IMPL_LINE, quantity: 1.5 }] })),
      'INVALID_QUANTITY',
    );
    expectCode(
      () => priceQuote(input({ lines: [{ ...IMPL_LINE, manualDiscountBps: 10_001 }] })),
      'INVALID_BPS',
    );
    expectCode(
      () => priceQuote(input({ context: { ...CONTEXT, maxManualDiscountBps: -1 } })),
      'INVALID_BPS',
    );
  });

  it('enforces billing terms per price type', () => {
    expectCode(
      () => priceQuote(input({ lines: [{ ...SEAT_LINE, billingTermMonths: null }] })),
      'INVALID_LINE',
    );
    expectCode(
      () => priceQuote(input({ lines: [{ ...SEAT_LINE, billingTermMonths: 121 }] })),
      'INVALID_LINE',
    );
    expectCode(
      () => priceQuote(input({ lines: [{ ...IMPL_LINE, billingTermMonths: 12 }] })),
      'INVALID_LINE',
    );
  });

  it('rejects option adjustments that make the unit price negative', () => {
    const bad = {
      ...IMPL_LINE,
      options: [{ optionId: 'o', label: 'x', unitPriceDeltaMinor: -20_000, unitCostDeltaMinor: 0 }],
    };
    expectCode(() => priceQuote(input({ lines: [bad] })), 'INVALID_LINE');
    const badCost = {
      ...IMPL_LINE,
      options: [{ optionId: 'o', label: 'x', unitPriceDeltaMinor: 0, unitCostDeltaMinor: -10_000 }],
    };
    expectCode(() => priceQuote(input({ lines: [badCost] })), 'INVALID_LINE');
  });

  it('rejects duplicate line ids', () => {
    expectCode(() => priceQuote(input({ lines: [IMPL_LINE, IMPL_LINE] })), 'INVALID_LINE');
  });

  it('rejects invalid rules before pricing', () => {
    expectCode(
      () => priceQuote(input({ rules: [rule({ id: 'bad', priority: -1 })] })),
      'INVALID_RULE',
    );
  });

  it('rejects price-book prices that are not integer minor units', () => {
    const book = {
      ...PRICE_BOOK,
      prices: [{ productId: 'IMPL-SVC', unitListMinor: 10.5, unitCostMinor: 1 }],
    };
    expectCode(() => priceQuote(input({ lines: [IMPL_LINE], priceBook: book })), 'INVALID_AMOUNT');
  });

  it('guards against arithmetic overflow', () => {
    const book = {
      ...PRICE_BOOK,
      prices: [{ productId: 'IMPL-SVC', unitListMinor: Number.MAX_SAFE_INTEGER, unitCostMinor: 0 }],
    };
    expectCode(
      () => priceQuote(input({ lines: [IMPL_LINE], priceBook: book })),
      'ARITHMETIC_OVERFLOW',
    );
  });
});
