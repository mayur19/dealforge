# ADR-0013: Integer money and rounding policy

- **Status:** Accepted
- **Date:** 2026-11-20
- **Deciders:** DealForge engineering

## Context

PRD §2 and FR-07 require all monetary calculations on the server in integer minor
units, integer quantities and integer basis points, with a documented per-line
rounding policy ("round half up to minor unit at each discount stage") and no double
application. Golden scenario step 3 stacks 8 % volume and 3 % customer discounts and
then a 7 % manual discount; the totals must match reference integer arithmetic (D-05).
JavaScript numbers are IEEE-754 doubles: `0.1 + 0.2 !== 0.3`, and products above
2^53 lose precision silently.

## Decision Drivers

- Bit-exact, reproducible totals on server and browser.
- A rounding rule simple enough to explain to a customer.
- Overflow is an error, never a silent wrap or precision loss.
- Display without converting amounts to floating point.

## Considered Options

1. Integer minor units in JS `number`, guarded to the safe-integer range, with
   BigInt for intermediate products and an explicit rounding function.
2. A decimal library (arbitrary precision decimals).
3. Floating-point with `toFixed(2)` at the end.
4. BigInt everywhere.

## Decision Outcome

Chosen option: **integer minor units with guarded arithmetic**, implemented in
`packages/shared/src/domain/money.ts` and `money-format.ts` so the API and the web
share it.

- **Units:** amounts are integer minor units (cents, yen, fils); percentages are
  integer basis points (10 000 = 100 %); quantities are integers 1-1 000 000.
- **Guards:** every operation checks `Number.isSafeInteger` on inputs and results
  and throws `ARITHMETIC_OVERFLOW` instead of losing precision. Product prices are
  capped at 100 000 000 000 minor units (CHECK constraint and zod schema).
- **Percentages:** `percentOfMinor(amount, bps)` computes `amount × bps / 10 000`
  exactly with BigInt and rounds once.
- **Rounding rule:** a fractional minor unit is rounded **half away from zero**. For
  the non-negative amounts that discounts apply to this is identical to the PRD's
  "round half up". Example: 7 % of 267 720 = 18 740.4 -> 18 740; 10 % of 25 = 2.5 -> 3.
- **Where rounding happens:** once per discount stage per line. Line nets are summed
  into totals without re-rounding. Ratios (gross margin, discount share) use the
  same rule via `ratioBps`.
- **Undefined ratios:** `ratioBps(x, 0)` returns `null`; zero revenue yields "n/a",
  never an infinite or fabricated margin.
- **Display and input:** `toDecimalString` and `parseDecimalToMinor` work on digit
  strings; `formatMoney` passes the exact decimal string to `Intl.NumberFormat`.
  Currency minor digits come from ISO 4217 via `Intl` (USD 2, JPY 0, KWD 3).
- **Storage:** `bigint` columns with CHECK bounds; repositories convert with
  `toSafeInteger` and fail loudly on out-of-range values.

### Consequences

- Positive: 100 % branch coverage on the money module, including half-way cases,
  negative ratios, overflow and amounts where `amount × bps` exceeds 2^53.
- Positive: the browser preview and the server agree to the minor unit.
- Negative: contributors must never use `+`, `*` or `/` on amounts directly; code
  review checks for helper use.
- Negative: totals across currencies are impossible by design (one currency per
  quote, FX is a non-goal).

## Links

- [ADR-0015 Pricing engine](0015-pricing-rule-engine-and-stacking-policy.md)
- Code: `packages/shared/src/domain/money.ts`, tests in `packages/shared/test/domain/money.test.ts`
