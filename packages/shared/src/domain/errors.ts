/**
 * Errors raised by pure domain code. They carry a stable machine-readable
 * code; the API maps them to 422 responses at the boundary.
 */
export type DomainErrorCode =
  | 'INVALID_AMOUNT'
  | 'INVALID_BPS'
  | 'INVALID_QUANTITY'
  | 'INVALID_CURRENCY'
  | 'INVALID_DECIMAL'
  | 'ARITHMETIC_OVERFLOW'
  | 'PRICE_NOT_FOUND'
  | 'CURRENCY_MISMATCH'
  | 'INVALID_LINE'
  | 'INVALID_RULE'
  | 'INVALID_POLICY';

export class DomainError extends Error {
  readonly code: DomainErrorCode;
  readonly details?: Readonly<Record<string, unknown>>;

  constructor(code: DomainErrorCode, message: string, details?: Readonly<Record<string, unknown>>) {
    super(message);
    this.name = 'DomainError';
    this.code = code;
    this.details = details;
  }
}
