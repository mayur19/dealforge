import type {
  PriceBookSnapshot,
  PricingContext,
  PricingRule,
  QuoteLineInput,
} from '../../src/domain/pricing/types.js';

/** Golden scenario fixtures (PRD §8): Helix Managed Services quoting Atlas Manufacturing. */
export const PRICE_BOOK: PriceBookSnapshot = {
  id: 'pb-2026-q4',
  currency: 'USD',
  prices: [
    { productId: 'EPS-SEAT', unitListMinor: 1_200, unitCostMinor: 700 },
    { productId: 'IMPL-SVC', unitListMinor: 15_000, unitCostMinor: 9_000 },
    { productId: 'FREE-AUDIT', unitListMinor: 0, unitCostMinor: 2_500 },
    { productId: 'GIFT', unitListMinor: 0, unitCostMinor: 0 },
  ],
};

export const CONTEXT: PricingContext = {
  pricingDate: '2026-11-20',
  currency: 'USD',
  customerTier: 'GOLD',
  maxManualDiscountBps: 2_000,
};

export function rule(overrides: Partial<PricingRule> & Pick<PricingRule, 'id'>): PricingRule {
  return {
    name: overrides.id,
    category: 'VOLUME',
    priority: 10,
    effectiveFrom: '2026-01-01',
    effectiveUntil: null,
    conditions: {},
    action: { type: 'PERCENT_DISCOUNT', bps: 500 },
    maxDiscountBps: 5_000,
    ...overrides,
  };
}

export const VOLUME_200_SEATS = rule({
  id: 'r-volume-200',
  name: '200+ endpoint seats',
  category: 'VOLUME',
  priority: 20,
  conditions: { productIds: ['EPS-SEAT'], minQuantity: 200 },
  action: { type: 'PERCENT_DISCOUNT', bps: 800 },
  maxDiscountBps: 1_500,
});

export const GOLD_TIER = rule({
  id: 'r-tier-gold',
  name: 'Gold customer',
  category: 'CUSTOMER_TIER',
  priority: 10,
  conditions: { customerTiers: ['GOLD'] },
  action: { type: 'PERCENT_DISCOUNT', bps: 300 },
  maxDiscountBps: 500,
});

export const SEAT_LINE: QuoteLineInput = {
  lineId: 'l1',
  productId: 'EPS-SEAT',
  productCategory: 'SECURITY',
  priceType: 'RECURRING',
  quantity: 200,
  billingTermMonths: 12,
  options: [
    {
      optionId: 'opt-premium',
      label: 'Premium support',
      unitPriceDeltaMinor: 300,
      unitCostDeltaMinor: 150,
    },
  ],
  manualDiscountBps: 700,
};

export const IMPL_LINE: QuoteLineInput = {
  lineId: 'l2',
  productId: 'IMPL-SVC',
  productCategory: 'SERVICES',
  priceType: 'ONE_TIME',
  quantity: 40,
  billingTermMonths: null,
  manualDiscountBps: 700,
};
