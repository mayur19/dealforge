import { describe, expect, it } from 'vitest';
import { isIsoDate } from '../../src/domain/dates.js';

describe('isIsoDate', () => {
  it.each(['2026-11-20', '2028-02-29', '1999-12-31'])('accepts %s', (value) => {
    expect(isIsoDate(value)).toBe(true);
  });

  it.each(['2026-02-30', '2027-02-29', '2026-13-01', '2026-1-01', '20261120', '', 20261120, null])(
    'rejects %j',
    (value) => {
      expect(isIsoDate(value)).toBe(false);
    },
  );
});
