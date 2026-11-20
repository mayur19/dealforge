import { DomainError } from '../errors.js';
import { formatBps } from '../money-format.js';
import type { QuotePricingResult, SegmentTotals } from '../pricing/types.js';
import type { Role } from '../../roles.js';

/**
 * Approval policy evaluator (FR-08, ADR-0017). Pure: given the server-side
 * pricing result and the organization's thresholds it returns the ordered
 * approval steps a quote version needs, each with human-readable reasons.
 *
 * - Manual discount strictly above the threshold -> Sales Manager.
 * - Gross margin strictly below the floor (or cost with zero revenue) in any
 *   non-empty segment -> Finance.
 * - Both -> Sales Manager first, then Finance (sequential).
 */
export type ApprovalLevel = 'SALES_MANAGER' | 'FINANCE';
export type Segment = 'ONE_TIME' | 'RECURRING';

export type ApprovalReasonCode =
  'MANUAL_DISCOUNT_ABOVE_THRESHOLD' | 'MARGIN_BELOW_FLOOR' | 'ZERO_REVENUE_WITH_COST';

export interface ApprovalPolicy {
  readonly managerDiscountThresholdBps: number;
  readonly marginFloorBps: number;
}

export interface SegmentMargin {
  readonly segment: Segment;
  readonly lineCount: number;
  readonly netMinor: number;
  readonly costMinor: number;
  readonly grossMarginBps: number | null;
}

export interface ApprovalInput {
  readonly maxManualDiscountBps: number;
  readonly segments: readonly SegmentMargin[];
}

export interface ApprovalReason {
  readonly code: ApprovalReasonCode;
  readonly level: ApprovalLevel;
  readonly segment: Segment | null;
  readonly observedBps: number | null;
  readonly thresholdBps: number;
  readonly message: string;
}

export interface ApprovalStepRequirement {
  readonly sequence: number;
  readonly level: ApprovalLevel;
  readonly approvalRole: Extract<Role, 'SALES_MANAGER' | 'FINANCE_APPROVER'>;
  readonly reasons: readonly ApprovalReason[];
}

export interface ApprovalRequirement {
  readonly required: boolean;
  readonly steps: readonly ApprovalStepRequirement[];
  readonly reasons: readonly ApprovalReason[];
}

const LEVEL_ORDER: readonly ApprovalLevel[] = ['SALES_MANAGER', 'FINANCE'];
const ROLE_FOR_LEVEL = { SALES_MANAGER: 'SALES_MANAGER', FINANCE: 'FINANCE_APPROVER' } as const;
const SEGMENT_LABEL: Readonly<Record<Segment, string>> = {
  ONE_TIME: 'One-time',
  RECURRING: 'Recurring',
};

function assertPolicyValue(value: number, name: string, min: number, max: number): void {
  if (!Number.isSafeInteger(value) || value < min || value > max) {
    throw new DomainError(
      'INVALID_POLICY',
      `${name} must be integer bps between ${min} and ${max}`,
    );
  }
}

function discountReasons(input: ApprovalInput, policy: ApprovalPolicy): ApprovalReason[] {
  const threshold = policy.managerDiscountThresholdBps;
  if (input.maxManualDiscountBps <= threshold) return [];
  return [
    {
      code: 'MANUAL_DISCOUNT_ABOVE_THRESHOLD',
      level: 'SALES_MANAGER',
      segment: null,
      observedBps: input.maxManualDiscountBps,
      thresholdBps: threshold,
      message: `Manual discount ${formatBps(input.maxManualDiscountBps)} exceeds the ${formatBps(threshold)} manager approval threshold`,
    },
  ];
}

function marginReason(segment: SegmentMargin, floor: number): ApprovalReason | null {
  const label = SEGMENT_LABEL[segment.segment];
  const base = { level: 'FINANCE', segment: segment.segment, thresholdBps: floor } as const;
  if (segment.lineCount === 0) return null;
  if (segment.grossMarginBps === null) {
    return segment.costMinor > 0
      ? {
          ...base,
          code: 'ZERO_REVENUE_WITH_COST',
          observedBps: null,
          message: `${label} lines carry cost but no revenue`,
        }
      : null;
  }
  if (segment.grossMarginBps >= floor) return null;
  return {
    ...base,
    code: 'MARGIN_BELOW_FLOOR',
    observedBps: segment.grossMarginBps,
    message: `${label} gross margin ${formatBps(segment.grossMarginBps)} is below the ${formatBps(floor)} floor`,
  };
}

export function evaluateApprovalPolicy(
  input: ApprovalInput,
  policy: ApprovalPolicy,
): ApprovalRequirement {
  assertPolicyValue(policy.managerDiscountThresholdBps, 'managerDiscountThresholdBps', 0, 10_000);
  assertPolicyValue(policy.marginFloorBps, 'marginFloorBps', -10_000, 10_000);
  const marginReasons = input.segments
    .map((segment) => marginReason(segment, policy.marginFloorBps))
    .filter((reason): reason is ApprovalReason => reason !== null);
  const reasons = [...discountReasons(input, policy), ...marginReasons];
  const steps = LEVEL_ORDER.map((level) => ({
    level,
    reasons: reasons.filter((r) => r.level === level),
  }))
    .filter((step) => step.reasons.length > 0)
    .map((step, index) => ({
      sequence: index + 1,
      level: step.level,
      approvalRole: ROLE_FOR_LEVEL[step.level],
      reasons: step.reasons,
    }));
  return { required: steps.length > 0, steps, reasons };
}

const toSegment = (segment: Segment, totals: SegmentTotals): SegmentMargin => ({
  segment,
  lineCount: totals.lineCount,
  netMinor: totals.netMinor,
  costMinor: totals.costMinor,
  grossMarginBps: totals.grossMarginBps,
});

/** Adapt a pricing result into the evaluator input. */
export function approvalInputFromPricing(pricing: QuotePricingResult): ApprovalInput {
  return {
    maxManualDiscountBps: pricing.maxManualDiscountBps,
    segments: [
      toSegment('ONE_TIME', pricing.oneTime),
      toSegment('RECURRING', pricing.recurringMonthly),
    ],
  };
}
