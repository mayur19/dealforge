import { DomainError, type DomainErrorCode } from './errors.js';

/**
 * Money primitives (ADR-0013).
 *
 * - Amounts are integer **minor units** (cents, paise, yen) held in JS numbers
 *   and guarded to the IEEE-754 safe integer range. No floats are ever used
 *   for money; intermediate products that could exceed 2^53 use BigInt.
 * - Percentages are integer **basis points** (1 bps = 0.01 %, 10 000 = 100 %).
 * - Rounding rule: a fraction of a minor unit is rounded **half away from
 *   zero** (for the non-negative amounts the pricing engine discounts this is
 *   identical to "round half up"). Rounding happens once per discount stage
 *   per line, never on aggregated totals.
 */
export const BPS_SCALE = 10_000;
export const MAX_MINOR = Number.MAX_SAFE_INTEGER;
export const MAX_QUANTITY = 1_000_000;

export class MoneyError extends DomainError {
  constructor(code: DomainErrorCode, message: string) {
    super(code, message);
    this.name = 'MoneyError';
  }
}

export function isMinor(value: unknown): value is number {
  return typeof value === 'number' && Number.isSafeInteger(value);
}

export function assertMinor(value: number, label: string): number {
  if (!isMinor(value)) {
    throw new MoneyError('INVALID_AMOUNT', `${label} must be an integer amount of minor units`);
  }
  return value;
}

export interface BpsRange {
  readonly min: number;
  readonly max: number;
}

export function assertBps(
  value: number,
  label: string,
  range: BpsRange = { min: 0, max: BPS_SCALE },
): number {
  if (!Number.isSafeInteger(value) || value < range.min || value > range.max) {
    throw new MoneyError(
      'INVALID_BPS',
      `${label} must be integer basis points between ${range.min} and ${range.max}`,
    );
  }
  return value;
}

export function assertQuantity(value: number, label = 'quantity'): number {
  if (!Number.isSafeInteger(value) || value < 1 || value > MAX_QUANTITY) {
    throw new MoneyError(
      'INVALID_QUANTITY',
      `${label} must be an integer between 1 and ${MAX_QUANTITY}`,
    );
  }
  return value;
}

function checked(result: number, operation: string): number {
  if (!Number.isSafeInteger(result)) {
    throw new MoneyError('ARITHMETIC_OVERFLOW', `Money ${operation} overflow`);
  }
  return result;
}

export function addMinor(a: number, b: number): number {
  return checked(assertMinor(a, 'augend') + assertMinor(b, 'addend'), 'addition');
}

export function subtractMinor(a: number, b: number): number {
  return checked(assertMinor(a, 'minuend') - assertMinor(b, 'subtrahend'), 'subtraction');
}

export function sumMinor(values: readonly number[]): number {
  return values.reduce((total, value) => addMinor(total, value), 0);
}

/** amount × integer multiplier (e.g. unit price × quantity). */
export function multiplyMinor(amount: number, multiplier: number): number {
  assertMinor(amount, 'amount');
  if (!Number.isSafeInteger(multiplier)) {
    throw new MoneyError('INVALID_QUANTITY', 'multiplier must be an integer');
  }
  return checked(amount * multiplier, 'multiplication');
}

/** Exact integer division of BigInts, rounding half away from zero. */
export function roundHalfAwayFromZero(numerator: bigint, denominator: bigint): bigint {
  if (denominator <= 0n) {
    throw new MoneyError('ARITHMETIC_OVERFLOW', 'denominator must be positive');
  }
  const magnitude = numerator < 0n ? -numerator : numerator;
  const rounded = (magnitude * 2n + denominator) / (denominator * 2n);
  return numerator < 0n ? -rounded : rounded;
}

/** `bps` of a non-negative amount, rounded per the documented rule. */
export function percentOfMinor(amount: number, bps: number): number {
  assertMinor(amount, 'amount');
  if (amount < 0) {
    throw new MoneyError('INVALID_AMOUNT', 'amount must be non-negative');
  }
  assertBps(bps, 'percentage');
  const result = roundHalfAwayFromZero(BigInt(amount) * BigInt(bps), BigInt(BPS_SCALE));
  return checked(Number(result), 'percentage');
}

/**
 * numerator / denominator expressed in basis points, rounded half away from
 * zero. Returns `null` when the denominator is zero: a ratio over zero revenue
 * is undefined and must never be shown as an infinite or fake margin.
 */
export function ratioBps(numerator: number, denominator: number): number | null {
  assertMinor(numerator, 'numerator');
  assertMinor(denominator, 'denominator');
  if (denominator < 0) {
    throw new MoneyError('INVALID_AMOUNT', 'denominator must be non-negative');
  }
  if (denominator === 0) return null;
  const result = roundHalfAwayFromZero(BigInt(numerator) * BigInt(BPS_SCALE), BigInt(denominator));
  return checked(Number(result), 'ratio');
}
