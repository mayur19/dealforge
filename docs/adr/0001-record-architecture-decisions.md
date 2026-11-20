# ADR-0001: Record architecture decisions

- **Status:** Accepted
- **Date:** 2026-11-20
- **Deciders:** DealForge engineering

## Context

DealForge is a financial-calculation system: pricing, rounding, approval and
tenancy decisions must stay explainable months later, when a customer disputes a
quote total or an auditor asks why a discount was approved. Decisions made only in
chat threads or pull-request comments are lost.

## Decision Drivers

- Traceability from requirement (PRD FR-xx) to decision to code and tests.
- Low ceremony, reviewable in pull requests.
- New contributors can understand why the system is shaped the way it is.

## Considered Options

1. Markdown Architecture Decision Records (MADR) in `docs/adr/`.
2. A wiki page per decision.
3. No formal record; rely on commit history.

## Decision Outcome

Chosen option: **MADR files in `docs/adr/`**, numbered sequentially, one decision
per file, reviewed like code. Every ADR has Status, Date, Context, Decision
Drivers, Considered Options, Decision Outcome, Consequences and Links. A change
that contradicts an accepted ADR requires a new ADR that supersedes it.

### Consequences

- Positive: decisions are versioned with the code they govern; code comments can
  cite ADR numbers (for example `ADR-0013` in the money module).
- Positive: the requirements traceability matrix can link FRs to ADRs.
- Negative: authors must keep ADR status current (Proposed to Accepted) as
  tickets land.

## Links

- [ADR index](README.md)
- [Requirements traceability](../product/requirements-traceability.md)
