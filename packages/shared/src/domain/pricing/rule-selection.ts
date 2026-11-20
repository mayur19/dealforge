import type { PricingContext, PricingRule, QuoteLineInput, RuleCategory } from './types.js';

/**
 * Rule eligibility and the MVP stacking policy (ADR-0015): at most one rule
 * per category; highest priority wins; ties break on ascending rule id.
 */
export function isRuleEffective(rule: PricingRule, pricingDate: string): boolean {
  // ISO dates compare correctly as strings; both bounds are inclusive.
  if (pricingDate < rule.effectiveFrom) return false;
  return rule.effectiveUntil === null || pricingDate <= rule.effectiveUntil;
}

const includesOrUnset = (list: readonly string[] | undefined, value: string): boolean =>
  list === undefined || list.includes(value);

function matchesCategoryScope(
  rule: PricingRule,
  line: QuoteLineInput,
  context: PricingContext,
): boolean {
  if (rule.category === 'CUSTOMER_TIER') {
    return (
      context.customerTier !== null &&
      includesOrUnset(rule.conditions.customerTiers, context.customerTier)
    );
  }
  if (rule.category === 'BUNDLE') {
    const code = line.bundleCode ?? null;
    return code !== null && includesOrUnset(rule.conditions.bundleCodes, code);
  }
  return true;
}

export function matchesConditions(
  rule: PricingRule,
  line: QuoteLineInput,
  context: PricingContext,
): boolean {
  const { productIds, productCategories, minQuantity, maxQuantity } = rule.conditions;
  return (
    includesOrUnset(productIds, line.productId) &&
    includesOrUnset(productCategories, line.productCategory) &&
    (minQuantity === undefined || line.quantity >= minQuantity) &&
    (maxQuantity === undefined || line.quantity <= maxQuantity) &&
    matchesCategoryScope(rule, line, context)
  );
}

function compareRules(a: PricingRule, b: PricingRule): number {
  if (a.priority !== b.priority) return b.priority - a.priority;
  return a.id < b.id ? -1 : a.id > b.id ? 1 : 0;
}

export function selectRule(
  rules: readonly PricingRule[],
  category: RuleCategory,
  line: QuoteLineInput,
  context: PricingContext,
): PricingRule | null {
  const eligible = rules.filter(
    (rule) =>
      rule.category === category &&
      isRuleEffective(rule, context.pricingDate) &&
      matchesConditions(rule, line, context),
  );
  return [...eligible].sort(compareRules)[0] ?? null;
}
