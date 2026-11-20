import { MAX_MINOR, MoneyError, assertMinor } from './money.js';

/**
 * Display helpers for integer money. Conversion between minor units and
 * decimal strings is done on digit strings, so no floating point value ever
 * represents an amount (ADR-0013).
 */
const CURRENCY_CODE = /^[A-Z]{3}$/;
const DECIMAL_INPUT = /^-?\d+(\.\d+)?$/;

function assertCurrency(currency: string): string {
  if (!CURRENCY_CODE.test(currency)) {
    throw new MoneyError('INVALID_CURRENCY', `Invalid ISO 4217 currency code: ${currency}`);
  }
  return currency;
}

/** Number of minor-unit digits for an ISO 4217 currency (USD 2, JPY 0, KWD 3). */
export function currencyMinorDigits(currency: string): number {
  const formatter = new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency: assertCurrency(currency),
  });
  // Intl always resolves fraction digits for style=currency; the fallback only
  // satisfies the lib typing.
  /* v8 ignore next */
  return formatter.resolvedOptions().maximumFractionDigits ?? 2;
}

/** 123456 with 2 digits -> "1234.56". */
export function toDecimalString(minor: number, digits: number): string {
  assertMinor(minor, 'amount');
  const sign = minor < 0 ? '-' : '';
  const magnitude = Math.abs(minor).toString();
  if (digits === 0) return `${sign}${magnitude}`;
  const padded = magnitude.padStart(digits + 1, '0');
  return `${sign}${padded.slice(0, -digits)}.${padded.slice(-digits)}`;
}

type StringFormatter = (value: string) => string;

/** Locale-aware currency display. Intl formats the exact decimal string. */
export function formatMoney(minor: number, currency: string, locale = 'en-US'): string {
  const digits = currencyMinorDigits(currency);
  const formatter = new Intl.NumberFormat(locale, { style: 'currency', currency });
  const format = formatter.format.bind(formatter) as unknown as StringFormatter;
  return format(toDecimalString(minor, digits));
}

/** 800 -> "8.00%"; null (undefined ratio) -> "n/a". */
export function formatBps(bps: number | null): string {
  if (bps === null) return 'n/a';
  return `${toDecimalString(bps, 2)}%`;
}

/**
 * Parse user-entered decimal text ("1,234.50") into minor units without
 * floats. Rejects more fractional digits than the currency allows.
 */
export function parseDecimalToMinor(input: string, digits: number): number {
  const normalized = input.trim().replace(/,/g, '');
  if (!DECIMAL_INPUT.test(normalized)) {
    throw new MoneyError('INVALID_DECIMAL', `"${input}" is not a valid decimal amount`);
  }
  const negative = normalized.startsWith('-');
  const [whole = '0', fraction = ''] = normalized.replace('-', '').split('.');
  if (fraction.length > digits) {
    throw new MoneyError('INVALID_DECIMAL', `At most ${digits} decimal places are allowed`);
  }
  const magnitude = BigInt(whole + fraction.padEnd(digits, '0'));
  if (magnitude > BigInt(MAX_MINOR)) {
    throw new MoneyError('ARITHMETIC_OVERFLOW', 'Amount overflow');
  }
  const value = Number(magnitude);
  return negative ? -value : value;
}
