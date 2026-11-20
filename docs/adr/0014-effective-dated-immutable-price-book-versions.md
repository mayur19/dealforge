# ADR-0014: Effective-dated, immutable price-book versions

- **Status:** Proposed
- **Date:** 2026-11-20
- **Deciders:** DealForge engineering

## Context

FR-02: a price book defines currency, validity window and per-product list prices;
it is editable while draft and immutable once published. Quotes lock to one
published version at creation; repricing creates a new quote version with visible
differences. Prices must survive product archiving, and calculations must never
reprice retroactively (FR-05).

## Decision Drivers

- Historical quotes must reproduce their totals forever.
- Pricing managers need to prepare next quarter's prices in advance.
- Avoid ambiguous pricing from overlapping active windows.

## Considered Options

1. Price books with `status (DRAFT|PUBLISHED|RETIRED)`, `version`, and
   `[active_from, active_until]`; publishing freezes lines and rules; edits create a
   new draft version copied from the latest.
2. Mutable prices with an audit history table.
3. Prices stored only on quote lines.

## Decision Outcome

Chosen option: **immutable published versions with effective windows**.

- Publishing is a one-way transition guarded by validation (all lines priced,
  rules valid via `ruleIssues`, no overlap with another published book of the same
  currency and segment). Overlap is checked in the publish transaction with an
  exclusion constraint on `daterange(active_from, active_until, '[]')`.
- Published `price_book_lines` and `pricing_rules` are never updated; a change is a
  new version.
- Quote versions store `price_book_id` plus line snapshots (`unit_list_minor_snapshot`,
  `unit_cost_minor_snapshot`) and a `calculation_snapshot_json`, so recalculation is
  reproducible even if catalog defaults change (D-17).
- Effective dates are inclusive calendar dates in the organization timezone; the
  pricing engine already treats rule windows as inclusive (`isRuleEffective`).

Implementation: DF-024 (API), DF-025 (editor), DF-038 (reprice).

### Consequences

- Positive: no silent retroactive repricing; reprice diffs are explicit.
- Negative: storage grows with versions (bounded: 5 000 SKUs × a few versions/year).

## Links

- [ADR-0016 Immutable quote revisions](0016-immutable-quote-revisions.md)
- [Data model](../design/data-model.md)
