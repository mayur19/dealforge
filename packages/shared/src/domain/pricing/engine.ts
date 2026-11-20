import { DomainError } from '../errors.js';
import { isIsoDate } from '../dates.js';
import { assertBps } from '../money.js';
import { priceLine } from './line-pricing.js';
import { assertValidRule } from './rule-validation.js';
import { recurringTotals, segmentTotals } from './totals.js';
import type { PriceBookPrice, QuotePricingInput, QuotePricingResult } from './types.js';

function assertContext(input: QuotePricingInput): void {
  const { context, priceBook } = input;
  if (!isIsoDate(context.pricingDate)) {
    throw new DomainError('INVALID_LINE', 'pricingDate must be a YYYY-MM-DD date');
  }
  if (context.currency !== priceBook.currency) {
    throw new DomainError('CURRENCY_MISMATCH', 'Quote currency must match the price book', {
      quoteCurrency: context.currency,
      priceBookCurrency: priceBook.currency,
    });
  }
  assertBps(context.maxManualDiscountBps, 'maxManualDiscountBps');
}

function assertUniqueLineIds(input: QuotePricingInput): void {
  const ids = input.lines.map((line) => line.lineId);
  if (new Set(ids).size !== ids.length) {
    throw new DomainError('INVALID_LINE', 'Line ids must be unique within a quote');
  }
}

function priceLookup(input: QuotePricingInput): (productId: string) => PriceBookPrice {
  const prices = new Map(input.priceBook.prices.map((p) => [p.productId, p] as const));
  return (productId) => {
    const price = prices.get(productId);
    if (!price) {
      throw new DomainError('PRICE_NOT_FOUND', 'Product has no price in the price book', {
        productId,
        priceBookId: input.priceBook.id,
      });
    }
    return price;
  };
}

/**
 * Server-authoritative quote pricing (FR-05, FR-07). Pure and deterministic:
 * the result depends only on the input snapshot, never on the clock or DB.
 */
export function priceQuote(input: QuotePricingInput): QuotePricingResult {
  assertContext(input);
  assertUniqueLineIds(input);
  input.rules.forEach(assertValidRule);
  const lookup = priceLookup(input);
  const lines = input.lines.map((line) =>
    priceLine(line, lookup(line.productId), input.rules, input.context),
  );
  return {
    currency: input.context.currency,
    priceBookId: input.priceBook.id,
    pricingDate: input.context.pricingDate,
    lines,
    oneTime: segmentTotals(lines.filter((l) => l.priceType === 'ONE_TIME')),
    recurringMonthly: recurringTotals(lines.filter((l) => l.priceType === 'RECURRING')),
    maxManualDiscountBps: Math.max(0, ...lines.map((l) => l.manualDiscountBps)),
  };
}
