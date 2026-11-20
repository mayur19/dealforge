import { describe, expect, it } from 'vitest';
import {
  approvalInputFromPricing,
  evaluateApprovalPolicy,
  type ApprovalInput,
  type ApprovalPolicy,
} from '../../src/domain/approval/approval-policy.js';
import { DomainError } from '../../src/domain/errors.js';
import { priceQuote } from '../../src/domain/pricing/engine.js';
import {
  CONTEXT,
  GOLD_TIER,
  IMPL_LINE,
  PRICE_BOOK,
  SEAT_LINE,
  VOLUME_200_SEATS,
} from './pricing-fixtures.js';

const POLICY: ApprovalPolicy = { managerDiscountThresholdBps: 500, marginFloorBps: 3_500 };

const healthy = (overrides: Partial<ApprovalInput> = {}): ApprovalInput => ({
  maxManualDiscountBps: 0,
  segments: [
    {
      segment: 'ONE_TIME',
      lineCount: 1,
      netMinor: 100_000,
      costMinor: 50_000,
      grossMarginBps: 5_000,
    },
  ],
  ...overrides,
});

describe('evaluateApprovalPolicy (FR-08)', () => {
  it('lets a standard quote self-submit with no approval steps', () => {
    const decision = evaluateApprovalPolicy(healthy(), POLICY);
    expect(decision).toEqual({ required: false, steps: [], reasons: [] });
  });

  it('does not trigger at exactly the discount threshold', () => {
    expect(evaluateApprovalPolicy(healthy({ maxManualDiscountBps: 500 }), POLICY).required).toBe(
      false,
    );
  });

  it('requires sales-manager approval above the discount threshold (D-07)', () => {
    const decision = evaluateApprovalPolicy(healthy({ maxManualDiscountBps: 501 }), POLICY);
    expect(decision.steps).toEqual([
      {
        sequence: 1,
        level: 'SALES_MANAGER',
        approvalRole: 'SALES_MANAGER',
        reasons: [
          {
            code: 'MANUAL_DISCOUNT_ABOVE_THRESHOLD',
            level: 'SALES_MANAGER',
            segment: null,
            observedBps: 501,
            thresholdBps: 500,
            message: 'Manual discount 5.01% exceeds the 5.00% manager approval threshold',
          },
        ],
      },
    ]);
  });

  it('requires finance approval when margin is below the floor (D-08)', () => {
    const lowMargin = healthy({
      segments: [
        {
          segment: 'RECURRING',
          lineCount: 2,
          netMinor: 100_000,
          costMinor: 70_000,
          grossMarginBps: 3_000,
        },
      ],
    });
    const decision = evaluateApprovalPolicy(lowMargin, POLICY);
    expect(decision.steps.map((s) => [s.sequence, s.level, s.approvalRole])).toEqual([
      [1, 'FINANCE', 'FINANCE_APPROVER'],
    ]);
    expect(decision.reasons[0]).toMatchObject({
      code: 'MARGIN_BELOW_FLOOR',
      segment: 'RECURRING',
      observedBps: 3_000,
      thresholdBps: 3_500,
      message: 'Recurring gross margin 30.00% is below the 35.00% floor',
    });
  });

  it('does not trigger at exactly the margin floor', () => {
    const atFloor = healthy({
      segments: [
        { segment: 'ONE_TIME', lineCount: 1, netMinor: 100, costMinor: 65, grossMarginBps: 3_500 },
      ],
    });
    expect(evaluateApprovalPolicy(atFloor, POLICY).required).toBe(false);
  });

  it('flags zero revenue with cost as margin-critical, but ignores empty segments', () => {
    const decision = evaluateApprovalPolicy(
      healthy({
        segments: [
          {
            segment: 'ONE_TIME',
            lineCount: 1,
            netMinor: 0,
            costMinor: 2_500,
            grossMarginBps: null,
          },
          { segment: 'RECURRING', lineCount: 0, netMinor: 0, costMinor: 0, grossMarginBps: null },
        ],
      }),
      POLICY,
    );
    expect(decision.reasons).toEqual([
      expect.objectContaining({
        code: 'ZERO_REVENUE_WITH_COST',
        segment: 'ONE_TIME',
        observedBps: null,
        message: 'One-time lines carry cost but no revenue',
      }),
    ]);
  });

  it('ignores zero-revenue, zero-cost segments', () => {
    const free = healthy({
      segments: [
        { segment: 'ONE_TIME', lineCount: 1, netMinor: 0, costMinor: 0, grossMarginBps: null },
      ],
    });
    expect(evaluateApprovalPolicy(free, POLICY).required).toBe(false);
  });

  it('routes sequentially manager then finance when both triggers apply', () => {
    const both = healthy({
      maxManualDiscountBps: 700,
      segments: [
        {
          segment: 'ONE_TIME',
          lineCount: 1,
          netMinor: 100_000,
          costMinor: 70_000,
          grossMarginBps: 3_000,
        },
        {
          segment: 'RECURRING',
          lineCount: 1,
          netMinor: 100_000,
          costMinor: 90_000,
          grossMarginBps: 1_000,
        },
      ],
    });
    const decision = evaluateApprovalPolicy(both, POLICY);
    expect(decision.steps.map((s) => s.level)).toEqual(['SALES_MANAGER', 'FINANCE']);
    expect(decision.steps[1]!.reasons.map((r) => r.segment)).toEqual(['ONE_TIME', 'RECURRING']);
    expect(decision.reasons).toHaveLength(3);
  });

  it('rejects invalid policies', () => {
    expect(() =>
      evaluateApprovalPolicy(healthy(), { ...POLICY, managerDiscountThresholdBps: -1 }),
    ).toThrow(DomainError);
    expect(() => evaluateApprovalPolicy(healthy(), { ...POLICY, marginFloorBps: 10_001 })).toThrow(
      /marginFloorBps/,
    );
    expect(() => evaluateApprovalPolicy(healthy(), { ...POLICY, marginFloorBps: 1.5 })).toThrow(
      DomainError,
    );
  });
});

describe('golden scenario routing (PRD §8 step 5)', () => {
  it('creates sequential manager and finance steps for the 7% manual discount quote', () => {
    const pricing = priceQuote({
      lines: [SEAT_LINE, IMPL_LINE],
      priceBook: PRICE_BOOK,
      rules: [VOLUME_200_SEATS, GOLD_TIER],
      context: CONTEXT,
    });
    const decision = evaluateApprovalPolicy(approvalInputFromPricing(pricing), POLICY);
    expect(decision.required).toBe(true);
    expect(decision.steps.map((s) => s.approvalRole)).toEqual([
      'SALES_MANAGER',
      'FINANCE_APPROVER',
    ]);
    expect(decision.reasons.map((r) => r.code)).toEqual([
      'MANUAL_DISCOUNT_ABOVE_THRESHOLD',
      'MARGIN_BELOW_FLOOR',
      'MARGIN_BELOW_FLOOR',
    ]);
  });
});
