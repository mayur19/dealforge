import { DomainError } from '../errors.js';
import {
  addMinor,
  assertBps,
  assertMinor,
  assertQuantity,
  multiplyMinor,
  ratioBps,
  subtractMinor,
  sumMinor,
} from '../money.js';
import { manualDiscount, ruleDiscount, type DiscountOutcome } from './discounts.js';
import { selectRule } from './rule-selection.js';
import {
  RULE_CATEGORIES,
  type PriceBookPrice,
  type PricedLine,
  type PricingContext,
  type PricingRule,
  type PricingStep,
  type QuoteLineInput,
} from './types.js';

export const MAX_BILLING_TERM_MONTHS = 120;

function invalidLine(line: QuoteLineInput, message: string): DomainError {
  return new DomainError('INVALID_LINE', message, { lineId: line.lineId });
}

function assertBillingTerm(line: QuoteLineInput): void {
  const term = line.billingTermMonths;
  if (line.priceType === 'ONE_TIME') {
    if (term !== null) throw invalidLine(line, 'One-time lines must not have a billing term');
    return;
  }
  if (term === null || !Number.isSafeInteger(term) || term < 1 || term > MAX_BILLING_TERM_MONTHS) {
    throw invalidLine(line, `Recurring lines need a billing term of 1-${MAX_BILLING_TERM_MONTHS}`);
  }
}

function effectiveUnits(line: QuoteLineInput, price: PriceBookPrice) {
  const options = line.options ?? [];
  const priceDelta = sumMinor(options.map((o) => o.unitPriceDeltaMinor));
  const costDelta = sumMinor(options.map((o) => o.unitCostDeltaMinor));
  const unitPrice = addMinor(assertMinor(price.unitListMinor, 'unit list price'), priceDelta);
  const unitCost = addMinor(assertMinor(price.unitCostMinor, 'unit cost'), costDelta);
  if (unitPrice < 0 || unitCost < 0) {
    throw invalidLine(line, 'Option adjustments must not make the unit price or cost negative');
  }
  return { unitPrice, unitCost, hasOptions: options.length > 0 };
}

function discountStep(
  kind: PricingStep['kind'],
  rule: PricingRule | null,
  running: number,
  outcome: DiscountOutcome,
): PricingStep {
  return {
    kind,
    ruleId: rule?.id ?? null,
    label: rule?.name ?? 'Manual discount',
    requestedBps: outcome.requestedBps,
    appliedBps: outcome.appliedBps,
    deltaMinor: -outcome.discountMinor,
    resultMinor: subtractMinor(running, outcome.discountMinor),
    capped: outcome.capped,
  };
}

function baseSteps(
  line: QuoteLineInput,
  price: PriceBookPrice,
  unitPrice: number,
  hasOptions: boolean,
) {
  const base = multiplyMinor(price.unitListMinor, line.quantity);
  const gross = multiplyMinor(unitPrice, line.quantity);
  const steps: PricingStep[] = [
    {
      kind: 'BASE',
      ruleId: null,
      label: 'List price × quantity',
      requestedBps: null,
      appliedBps: null,
      deltaMinor: base,
      resultMinor: base,
      capped: false,
    },
  ];
  if (hasOptions) {
    steps.push({
      kind: 'OPTIONS',
      ruleId: null,
      label: 'Option adjustments',
      requestedBps: null,
      appliedBps: null,
      deltaMinor: subtractMinor(gross, base),
      resultMinor: gross,
      capped: false,
    });
  }
  return { gross, steps };
}

function automaticSteps(
  line: QuoteLineInput,
  rules: readonly PricingRule[],
  context: PricingContext,
  gross: number,
) {
  const steps: PricingStep[] = [];
  let running = gross;
  for (const category of RULE_CATEGORIES) {
    const rule = selectRule(rules, category, line, context);
    if (rule === null) continue;
    const step = discountStep(category, rule, running, ruleDiscount(rule, running, line.quantity));
    steps.push(step);
    running = step.resultMinor;
  }
  return { afterAutomatic: running, steps };
}

/** Price a single line through the deterministic FR-05 step order. */
export function priceLine(
  line: QuoteLineInput,
  price: PriceBookPrice,
  rules: readonly PricingRule[],
  context: PricingContext,
): PricedLine {
  assertQuantity(line.quantity);
  assertBillingTerm(line);
  const requestedManual = assertBps(line.manualDiscountBps ?? 0, 'manual discount');
  const { unitPrice, unitCost, hasOptions } = effectiveUnits(line, price);
  const base = baseSteps(line, price, unitPrice, hasOptions);
  const automatic = automaticSteps(line, rules, context, base.gross);
  const manual = manualDiscount(
    automatic.afterAutomatic,
    requestedManual,
    context.maxManualDiscountBps,
  );
  const manualSteps =
    requestedManual > 0 ? [discountStep('MANUAL', null, automatic.afterAutomatic, manual)] : [];
  const netMinor = subtractMinor(automatic.afterAutomatic, manual.discountMinor);
  const costMinor = multiplyMinor(unitCost, line.quantity);
  const grossProfitMinor = subtractMinor(netMinor, costMinor);
  return {
    lineId: line.lineId,
    productId: line.productId,
    priceType: line.priceType,
    quantity: line.quantity,
    billingTermMonths: line.billingTermMonths,
    unitListMinor: price.unitListMinor,
    unitCostMinor: price.unitCostMinor,
    effectiveUnitMinor: unitPrice,
    grossMinor: base.gross,
    automaticDiscountMinor: subtractMinor(base.gross, automatic.afterAutomatic),
    manualDiscountMinor: manual.discountMinor,
    manualDiscountBps: manual.appliedBps,
    netMinor,
    costMinor,
    grossProfitMinor,
    grossMarginBps: ratioBps(grossProfitMinor, netMinor),
    appliedRuleIds: automatic.steps.map((step) => step.ruleId as string),
    steps: [...base.steps, ...automatic.steps, ...manualSteps],
  };
}
