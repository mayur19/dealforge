import { describe, expect, it } from 'vitest';
import {
  currencyMinorDigits,
  formatMoney,
  formatBps,
  parseDecimalToMinor,
  toDecimalString,
} from '../../src/domain/money-format.js';
import { MoneyError } from '../../src/domain/money.js';

describe('currencyMinorDigits', () => {
  it('uses ISO 4217 minor unit digits', () => {
    expect(currencyMinorDigits('USD')).toBe(2);
    expect(currencyMinorDigits('JPY')).toBe(0);
    expect(currencyMinorDigits('KWD')).toBe(3);
  });

  it('rejects malformed currency codes', () => {
    expect(() => currencyMinorDigits('usd')).toThrow(MoneyError);
    expect(() => currencyMinorDigits('US')).toThrow(MoneyError);
  });
});

describe('toDecimalString', () => {
  it.each([
    [0, 2, '0.00'],
    [5, 2, '0.05'],
    [123_456, 2, '1234.56'],
    [-7, 2, '-0.07'],
    [-123_456, 2, '-1234.56'],
    [1234, 0, '1234'],
    [1, 3, '0.001'],
  ])('%s with %s digits -> %s', (minor, digits, expected) => {
    expect(toDecimalString(minor, digits)).toBe(expected);
  });

  it('rejects non-integer input', () => {
    expect(() => toDecimalString(1.5, 2)).toThrow(MoneyError);
  });
});

describe('formatMoney', () => {
  it('formats with currency symbol and grouping, without float conversion', () => {
    expect(formatMoney(123_456, 'USD')).toBe('$1,234.56');
    expect(formatMoney(0, 'USD')).toBe('$0.00');
    expect(formatMoney(-50, 'USD')).toBe('-$0.50');
    expect(formatMoney(1234, 'JPY')).toBe('¥1,234');
    expect(formatMoney(900_719_925_474_099, 'USD')).toBe('$9,007,199,254,740.99');
  });

  it('respects the requested locale', () => {
    expect(formatMoney(123_456, 'EUR', 'de-DE')).toBe('1.234,56 €');
  });
});

describe('formatBps', () => {
  it('renders basis points as a percentage string', () => {
    expect(formatBps(800)).toBe('8.00%');
    expect(formatBps(-1_234)).toBe('-12.34%');
    expect(formatBps(null)).toBe('n/a');
  });
});

describe('parseDecimalToMinor', () => {
  it.each([
    ['12.34', 2, 1234],
    ['12', 2, 1200],
    ['12.3', 2, 1230],
    ['0.05', 2, 5],
    [' 1,234.50 ', 2, 123_450],
    ['-3.10', 2, -310],
    ['7', 0, 7],
  ])('%s with %s digits -> %s', (input, digits, expected) => {
    expect(parseDecimalToMinor(input, digits)).toBe(expected);
  });

  it.each(['', 'abc', '1.234', '1..2', '1e5', '12.', '.5', '--1'])('rejects %j', (input) => {
    expect(() => parseDecimalToMinor(input, 2)).toThrow(MoneyError);
  });

  it('rejects fractional input for zero-digit currencies', () => {
    expect(() => parseDecimalToMinor('1.5', 0)).toThrow(MoneyError);
  });

  it('rejects values beyond the safe integer range', () => {
    expect(() => parseDecimalToMinor('99999999999999999', 2)).toThrow(/overflow/);
  });
});
