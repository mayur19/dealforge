# ADR-0015: Pricing rule engine and stacking policy

- **Status:** Accepted
- **Date:** 2026-11-20
- **Deciders:** DealForge engineering

## Context

FR-05 requires rules as data with a restricted declarative schema (never
user-entered code), a deterministic order (base -> options -> volume -> customer ->
bundle -> manual -> tax display), at most one rule per category with the
highest-priority eligible rule winning, the manual discount applied last to the
post-automatic price, caps on all discounts, non-negative prices and a visible
step-by-step breakdown.

## Decision Drivers

- Determinism: identical inputs always produce identical breakdowns.
- Explainability: each step names its rule, requested and applied percentage, and
  whether a cap applied.
- Safety: no expression evaluation; invalid rules rejected before use.
- Server authority: the browser may preview, the server decides (D-06).

## Considered Options

1. A pure function `priceQuote(input)` over immutable snapshots with a fixed
   category order and a "best rule per category" policy.
2. A general rules engine with user-defined expressions.
3. Stackable rules with combinable discounts per category.

## Decision Outcome

Chosen option: **pure, fixed-order engine** in `packages/shared/src/domain/pricing/`.

- **Input:** lines (product, category, price type, quantity, billing term, option
  deltas, bundle code, requested manual bps), a price-book snapshot, rule snapshots
  and a context (server pricing date, currency, customer tier, organization manual
  cap).
- **Rule schema:** category `VOLUME | CUSTOMER_TIER | BUNDLE`; integer priority
  0-10 000; inclusive `effectiveFrom`/`effectiveUntil` dates; conditions limited to
  product ids, product categories, min/max quantity, customer tiers and bundle codes
  (all present conditions must match); action `PERCENT_DISCOUNT` (1-10 000 bps) or
  `FIXED_DISCOUNT` (per-unit minor amount × quantity); `maxDiscountBps` cap.
  `ruleIssues()` rejects anything else.
- **Selection:** per category, filter eligible rules (effective on the pricing
  date, conditions match; customer-tier rules need a tier; bundle rules need a
  bundle line), sort by priority descending then id ascending, take the first.
  The PRD's per-rule `stacking_mode` is stored for forward compatibility; the only
  supported mode in the MVP is one rule per category.
- **Application:** each step discounts the running amount; percentage rules apply
  `min(bps, maxDiscountBps)`; fixed rules are capped at `maxDiscountBps` of the
  running amount and at the amount itself (never negative). Manual discount is
  `min(requested, organization cap)` of the post-automatic amount, applied once.
- **Output:** per line, steps with signed deltas and running results, gross,
  automatic and manual discounts, net, cost, profit and margin; segment totals kept
  separate for one-time and recurring (monthly, plus contract value = net × term).
- **Rounding:** per ADR-0013, once per stage per line.

### Consequences

- Positive: the golden scenario is pinned in `pricing-engine.test.ts`
  (240 000 + 60 000 -> 276 000 -> 267 720 -> 248 980 for the seat line).
- Positive: tie-break by id makes results independent of database row order.
- Negative: no combinable discounts within a category in the MVP; documented as a
  product decision.
- Follow-up: persistence and editor (DF-026, DF-027), option validation (DF-017),
  tax estimate (DF-029), simulation endpoint (DF-028).

## Links

- [ADR-0013 Integer money](0013-integer-money-and-rounding-policy.md)
- [ADR-0014 Price-book versions](0014-effective-dated-immutable-price-book-versions.md)
