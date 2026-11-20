/**
 * pg returns bigint columns as strings. Money columns are bounded by CHECK
 * constraints, so values always fit a safe integer; anything else is a bug.
 */
export function toSafeInteger(value: string | number, column: string): number {
  const parsed = typeof value === 'number' ? value : Number(value);
  if (!Number.isSafeInteger(parsed)) {
    throw new Error(`Column ${column} does not hold a safe integer`);
  }
  return parsed;
}

const UNIQUE_VIOLATION = '23505';

export function isUniqueViolation(error: unknown, constraint: string): boolean {
  return (
    typeof error === 'object' &&
    error !== null &&
    (error as { code?: unknown }).code === UNIQUE_VIOLATION &&
    (error as { constraint?: unknown }).constraint === constraint
  );
}

export function offsetFor(page: number, limit: number): number {
  return (page - 1) * limit;
}
