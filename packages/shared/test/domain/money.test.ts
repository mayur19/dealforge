import { describe, expect, it } from 'vitest';
import {
  BPS_SCALE,
  MAX_MINOR,
  MoneyError,
  addMinor,
  assertBps,
  assertMinor,
  assertQuantity,
  isMinor,
  multiplyMinor,
  percentOfMinor,
  ratioBps,
  roundHalfAwayFromZero,
  subtractMinor,
  sumMinor,
} from '../../src/domain/money.js';

describe('integer guards', () => {
  it('accepts safe integers only', () => {
    expect(isMinor(0)).toBe(true);
    expect(isMinor(-5)).toBe(true);
    expect(isMinor(MAX_MINOR)).toBe(true);
    expect(isMinor(1.5)).toBe(false);
    expect(isMinor(Number.NaN)).toBe(false);
    expect(isMinor(MAX_MINOR + 1)).toBe(false);
    expect(isMinor('10')).toBe(false);
  });

  it('assertMinor throws a labelled MoneyError', () => {
    expect(() => assertMinor(0.1, 'price')).toThrow(MoneyError);
    expect(() => assertMinor(0.1, 'price')).toThrow(/price/);
    expect(assertMinor(42, 'price')).toBe(42);
  });

  it('assertBps enforces integer range', () => {
    expect(assertBps(0, 'd')).toBe(0);
    expect(assertBps(BPS_SCALE, 'd')).toBe(BPS_SCALE);
    expect(() => assertBps(-1, 'd')).toThrow(/between 0 and 10000/);
    expect(() => assertBps(10_001, 'd')).toThrow(MoneyError);
    expect(() => assertBps(12.5, 'd')).toThrow(MoneyError);
    expect(assertBps(-20_000, 'margin', { min: -1_000_000, max: 10_000 })).toBe(-20_000);
  });

  it('assertQuantity requires a positive integer within bounds', () => {
    expect(assertQuantity(1)).toBe(1);
    expect(() => assertQuantity(0)).toThrow(/quantity/);
    expect(() => assertQuantity(2.5)).toThrow(MoneyError);
    expect(() => assertQuantity(1_000_001)).toThrow(MoneyError);
  });

  it('MoneyError carries a stable code', () => {
    try {
      assertMinor(Number.POSITIVE_INFINITY, 'x');
    } catch (error) {
      expect(error).toBeInstanceOf(MoneyError);
      expect((error as MoneyError).code).toBe('INVALID_AMOUNT');
    }
  });
});

describe('overflow-guarded arithmetic', () => {
  it('adds, subtracts and sums exactly', () => {
    expect(addMinor(10, 32)).toBe(42);
    expect(subtractMinor(10, 32)).toBe(-22);
    expect(sumMinor([1, 2, 3, 4])).toBe(10);
    expect(sumMinor([])).toBe(0);
  });

  it('rejects results beyond the safe integer range', () => {
    expect(() => addMinor(MAX_MINOR, 1)).toThrow(/overflow/);
    expect(() => subtractMinor(-MAX_MINOR, 1)).toThrow(MoneyError);
    expect(() => sumMinor([MAX_MINOR, 1])).toThrow(MoneyError);
  });

  it('multiplies by integer quantities', () => {
    expect(multiplyMinor(1999, 3)).toBe(5997);
    expect(multiplyMinor(-250, 4)).toBe(-1000);
    expect(() => multiplyMinor(MAX_MINOR, 2)).toThrow(/overflow/);
    expect(() => multiplyMinor(10, 1.5)).toThrow(MoneyError);
  });

  it('rejects non-integer operands', () => {
    expect(() => addMinor(0.1, 0.2)).toThrow(MoneyError);
    expect(() => subtractMinor(1, 0.5)).toThrow(MoneyError);
  });
});

describe('roundHalfAwayFromZero', () => {
  it.each([
    [5n, 2n, 3n],
    [4n, 2n, 2n],
    [7n, 2n, 4n],
    [1n, 3n, 0n],
    [2n, 3n, 1n],
    [-5n, 2n, -3n],
    [-1n, 3n, 0n],
    [-2n, 3n, -1n],
    [0n, 7n, 0n],
  ])('%s / %s -> %s', (numerator, denominator, expected) => {
    expect(roundHalfAwayFromZero(numerator, denominator)).toBe(expected);
  });

  it('rejects a non-positive denominator', () => {
    expect(() => roundHalfAwayFromZero(1n, 0n)).toThrow(MoneyError);
    expect(() => roundHalfAwayFromZero(1n, -2n)).toThrow(MoneyError);
  });
});

describe('percentOfMinor (documented rounding rule)', () => {
  it('computes exact basis-point fractions', () => {
    expect(percentOfMinor(10_000, 800)).toBe(800);
    expect(percentOfMinor(123_456, 0)).toBe(0);
    expect(percentOfMinor(123_456, BPS_SCALE)).toBe(123_456);
  });

  it('rounds exactly-half results up to the next minor unit', () => {
    // 1 cent at 50% = 0.5 cent -> 1 cent
    expect(percentOfMinor(1, 5_000)).toBe(1);
    // 25 cents at 10% = 2.5 cents -> 3 cents
    expect(percentOfMinor(25, 1_000)).toBe(3);
    // 15 cents at 10% = 1.5 cents -> 2 cents
    expect(percentOfMinor(15, 1_000)).toBe(2);
  });

  it('rounds below-half down and above-half up', () => {
    // 0.49 cents -> 0, 0.51 cents -> 1
    expect(percentOfMinor(49, 100)).toBe(0);
    expect(percentOfMinor(51, 100)).toBe(1);
  });

  it('avoids floating point artefacts', () => {
    // 0.1 + 0.2 style trap: 3 * 10% of 10 cents
    expect(percentOfMinor(30, 1_000)).toBe(3);
    expect(percentOfMinor(1_005, 5_000)).toBe(503);
  });

  it('stays exact for large amounts where amount × bps exceeds 2^53', () => {
    const big = 900_719_925_474_099; // ~9.0e14 minor units
    expect(percentOfMinor(big, 9_999)).toBe(900_629_853_481_552);
  });

  it('rejects negative amounts and out-of-range bps', () => {
    expect(() => percentOfMinor(-1, 100)).toThrow(/non-negative/);
    expect(() => percentOfMinor(100, 10_001)).toThrow(MoneyError);
  });
});

describe('ratioBps', () => {
  it('returns null for a zero denominator instead of a fake margin', () => {
    expect(ratioBps(0, 0)).toBeNull();
    expect(ratioBps(-500, 0)).toBeNull();
  });

  it('computes rounded basis points, including negatives', () => {
    expect(ratioBps(2_500, 10_000)).toBe(2_500);
    expect(ratioBps(1, 3)).toBe(3_333);
    expect(ratioBps(2, 3)).toBe(6_667);
    expect(ratioBps(-1, 3)).toBe(-3_333);
    expect(ratioBps(-15_000, 10_000)).toBe(-15_000);
  });

  it('rejects negative denominators', () => {
    expect(() => ratioBps(1, -3)).toThrow(MoneyError);
  });
});
