import { addMinor, multiplyMinor, ratioBps, subtractMinor, sumMinor } from '../money.js';
import type { PricedLine, RecurringTotals, SegmentTotals } from './types.js';

const sumOf = (lines: readonly PricedLine[], pick: (line: PricedLine) => number): number =>
  sumMinor(lines.map(pick));

/** Aggregate already-rounded line amounts; totals are never re-rounded. */
export function segmentTotals(lines: readonly PricedLine[]): SegmentTotals {
  const grossMinor = sumOf(lines, (l) => l.grossMinor);
  const automaticDiscountMinor = sumOf(lines, (l) => l.automaticDiscountMinor);
  const manualDiscountMinor = sumOf(lines, (l) => l.manualDiscountMinor);
  const netMinor = sumOf(lines, (l) => l.netMinor);
  const costMinor = sumOf(lines, (l) => l.costMinor);
  const grossProfitMinor = subtractMinor(netMinor, costMinor);
  return {
    lineCount: lines.length,
    grossMinor,
    automaticDiscountMinor,
    manualDiscountMinor,
    netMinor,
    costMinor,
    grossProfitMinor,
    grossMarginBps: ratioBps(grossProfitMinor, netMinor),
    discountBps: ratioBps(addMinor(automaticDiscountMinor, manualDiscountMinor), grossMinor),
  };
}

/** Recurring lines always carry a validated billing term (see priceLine). */
export function recurringTotals(lines: readonly PricedLine[]): RecurringTotals {
  const contractValueMinor = sumOf(lines, (l) =>
    multiplyMinor(l.netMinor, l.billingTermMonths as number),
  );
  return { ...segmentTotals(lines), contractValueMinor };
}
