import { multiplyMinor, percentOfMinor } from '../money.js';
import type { PricingRule } from './types.js';

export interface DiscountOutcome {
  readonly discountMinor: number;
  readonly requestedBps: number | null;
  readonly appliedBps: number | null;
  readonly capped: boolean;
}

/** Discount granted by one rule on `amount`, honouring the rule's cap. */
export function ruleDiscount(rule: PricingRule, amount: number, quantity: number): DiscountOutcome {
  const { action, maxDiscountBps } = rule;
  if (action.type === 'PERCENT_DISCOUNT') {
    const appliedBps = Math.min(action.bps, maxDiscountBps);
    return {
      discountMinor: percentOfMinor(amount, appliedBps),
      requestedBps: action.bps,
      appliedBps,
      capped: appliedBps < action.bps,
    };
  }
  const requested = multiplyMinor(action.amountMinorPerUnit, quantity);
  const ceiling = Math.min(percentOfMinor(amount, maxDiscountBps), amount);
  const discountMinor = Math.min(requested, ceiling);
  return { discountMinor, requestedBps: null, appliedBps: null, capped: discountMinor < requested };
}

export interface ManualDiscountOutcome extends DiscountOutcome {
  readonly requestedBps: number;
  readonly appliedBps: number;
}

/** Manually requested discount, capped at the organization maximum. */
export function manualDiscount(
  amount: number,
  requestedBps: number,
  maxManualDiscountBps: number,
): ManualDiscountOutcome {
  const appliedBps = Math.min(requestedBps, maxManualDiscountBps);
  return {
    discountMinor: percentOfMinor(amount, appliedBps),
    requestedBps,
    appliedBps,
    capped: appliedBps < requestedBps,
  };
}
