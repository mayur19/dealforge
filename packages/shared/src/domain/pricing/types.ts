/**
 * Pricing engine data contracts (FR-05, FR-07, ADR-0015). Everything here is
 * plain immutable data: the engine is a pure function from inputs to a
 * breakdown, so the same inputs always produce the same result.
 */
export const PRICE_TYPES = ['ONE_TIME', 'RECURRING'] as const;
export type PriceType = (typeof PRICE_TYPES)[number];

/** Rule categories in the order they are applied (FR-05 deterministic order). */
export const RULE_CATEGORIES = ['VOLUME', 'CUSTOMER_TIER', 'BUNDLE'] as const;
export type RuleCategory = (typeof RULE_CATEGORIES)[number];

export const RULE_ACTION_TYPES = ['PERCENT_DISCOUNT', 'FIXED_DISCOUNT'] as const;
export type RuleActionType = (typeof RULE_ACTION_TYPES)[number];

export type RuleAction =
  | { readonly type: 'PERCENT_DISCOUNT'; readonly bps: number }
  /** Fixed discount per unit, multiplied by the line quantity. */
  | { readonly type: 'FIXED_DISCOUNT'; readonly amountMinorPerUnit: number };

/** Restricted declarative conditions. Every present condition must match. */
export interface RuleConditions {
  readonly productIds?: readonly string[];
  readonly productCategories?: readonly string[];
  readonly minQuantity?: number;
  readonly maxQuantity?: number;
  readonly customerTiers?: readonly string[];
  readonly bundleCodes?: readonly string[];
}

export interface PricingRule {
  readonly id: string;
  readonly name: string;
  readonly category: RuleCategory;
  /** Higher wins within a category; ties break on ascending id. */
  readonly priority: number;
  /** Inclusive ISO dates (YYYY-MM-DD). `null` until = open-ended. */
  readonly effectiveFrom: string;
  readonly effectiveUntil: string | null;
  readonly conditions: RuleConditions;
  readonly action: RuleAction;
  /** Upper bound for the discount this rule may grant, relative to its input amount. */
  readonly maxDiscountBps: number;
}

export interface PriceBookPrice {
  readonly productId: string;
  readonly unitListMinor: number;
  readonly unitCostMinor: number;
}

export interface PriceBookSnapshot {
  readonly id: string;
  readonly currency: string;
  readonly prices: readonly PriceBookPrice[];
}

export interface OptionAdjustment {
  readonly optionId: string;
  readonly label: string;
  readonly unitPriceDeltaMinor: number;
  readonly unitCostDeltaMinor: number;
}

export interface QuoteLineInput {
  readonly lineId: string;
  readonly productId: string;
  readonly productCategory: string;
  readonly priceType: PriceType;
  readonly quantity: number;
  /** Required for RECURRING lines (1-120 months), null for ONE_TIME. */
  readonly billingTermMonths: number | null;
  readonly options?: readonly OptionAdjustment[];
  readonly bundleCode?: string | null;
  readonly manualDiscountBps?: number;
}

export interface PricingContext {
  /** Server-side pricing date (YYYY-MM-DD); never taken from the client clock. */
  readonly pricingDate: string;
  readonly currency: string;
  readonly customerTier: string | null;
  /** Organization cap for manually requested discounts. */
  readonly maxManualDiscountBps: number;
}

export interface QuotePricingInput {
  readonly lines: readonly QuoteLineInput[];
  readonly priceBook: PriceBookSnapshot;
  readonly rules: readonly PricingRule[];
  readonly context: PricingContext;
}

export type PricingStepKind = 'BASE' | 'OPTIONS' | RuleCategory | 'MANUAL';

export interface PricingStep {
  readonly kind: PricingStepKind;
  readonly ruleId: string | null;
  readonly label: string;
  /** Percentage requested by the rule/rep; null for base, options and fixed discounts. */
  readonly requestedBps: number | null;
  /** Percentage actually applied after caps; null where not percentage based. */
  readonly appliedBps: number | null;
  /** Signed change to the running line amount (discounts are negative). */
  readonly deltaMinor: number;
  readonly resultMinor: number;
  readonly capped: boolean;
}

export interface PricedLine {
  readonly lineId: string;
  readonly productId: string;
  readonly priceType: PriceType;
  readonly quantity: number;
  readonly billingTermMonths: number | null;
  readonly unitListMinor: number;
  readonly unitCostMinor: number;
  /** List price plus option adjustments, per unit. */
  readonly effectiveUnitMinor: number;
  /** effectiveUnitMinor × quantity, before any discount. */
  readonly grossMinor: number;
  readonly automaticDiscountMinor: number;
  readonly manualDiscountMinor: number;
  readonly manualDiscountBps: number;
  readonly netMinor: number;
  readonly costMinor: number;
  readonly grossProfitMinor: number;
  readonly grossMarginBps: number | null;
  readonly appliedRuleIds: readonly string[];
  readonly steps: readonly PricingStep[];
}

export interface SegmentTotals {
  readonly lineCount: number;
  readonly grossMinor: number;
  readonly automaticDiscountMinor: number;
  readonly manualDiscountMinor: number;
  readonly netMinor: number;
  readonly costMinor: number;
  readonly grossProfitMinor: number;
  /** null when net revenue is zero (undefined margin, never a fake value). */
  readonly grossMarginBps: number | null;
  /** Total discount relative to gross; null when gross is zero. */
  readonly discountBps: number | null;
}

export interface RecurringTotals extends SegmentTotals {
  /** Σ monthly net × billing term months: total committed recurring value. */
  readonly contractValueMinor: number;
}

export interface QuotePricingResult {
  readonly currency: string;
  readonly priceBookId: string;
  readonly pricingDate: string;
  readonly lines: readonly PricedLine[];
  readonly oneTime: SegmentTotals;
  /** Recurring amounts are per month; never merged into one-time totals. */
  readonly recurringMonthly: RecurringTotals;
  /** Highest manual discount applied on any line; input to approval policy. */
  readonly maxManualDiscountBps: number;
}
