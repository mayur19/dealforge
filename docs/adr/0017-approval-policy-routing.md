# ADR-0017: Approval policy routing

- **Status:** Accepted
- **Date:** 2026-11-20
- **Deciders:** DealForge engineering

## Context

FR-08: standard quotes self-submit; a discount above the organization threshold
requires sales-manager approval; projected gross margin below the floor requires
finance approval, in addition to the sales manager when both triggers apply. Steps
are sequential, there is no self-approval, decisions are idempotent with optimistic
locking, and approval history stays attached to the version it reviewed. Golden
scenario step 5 creates sequential manager and finance steps.

## Decision Drivers

- Routing must be a deterministic function of server-side pricing, not of what the
  client claims.
- Approvers need human-readable reasons (approval inbox, PRD §4 screen 14).
- Edge cases (zero revenue, recurring vs one-time margins) must be explicit.

## Considered Options

1. Pure evaluator over the pricing result and organization thresholds returning
   ordered steps with reasons.
2. Configurable approval chains per organization.
3. Always route every non-standard quote through both manager and finance.

## Decision Outcome

Chosen option: **pure evaluator** `evaluateApprovalPolicy()` in
`packages/shared/src/domain/approval/approval-policy.ts`.

- **Discount trigger:** the highest applied manual discount on any line strictly
  greater than `managerDiscountThresholdBps` -> `SALES_MANAGER` step. Automatic rule
  discounts are pre-approved by pricing policy and do not trigger approval.
- **Margin trigger:** for each non-empty segment (one-time, recurring monthly),
  gross margin strictly below `marginFloorBps`, or cost with zero revenue (undefined
  margin) -> `FINANCE` step. Zero revenue with zero cost does not trigger.
- **Routing:** discount only -> manager; margin only -> finance; both -> manager
  (sequence 1) then finance (sequence 2). Finance can therefore never be bypassed by
  a manager decision.
- **Output:** `{ required, steps[{ sequence, level, approvalRole, reasons }],
reasons[] }`, each reason with code, segment, observed and threshold bps and a
  message such as "Recurring gross margin 30.00% is below the 35.00% floor".

Considered and rejected for the MVP: requiring a manager step whenever finance is
required. PRD wording ties the manager to the discount trigger; organizations that
want both can set the discount threshold low.

Workflow pieces still pending: step persistence on submit (DF-041), decisions with
idempotency, optimistic locking, owner and stale-version checks (DF-042), screens
(DF-043, DF-044), thresholds from organization settings (DF-010).

### Consequences

- Positive: D-07 and D-08 logic is unit tested now; golden routing is pinned.
- Negative: chains are fixed (manager, finance); configurable chains are post-MVP.

## Links

- [ADR-0015 Pricing engine](0015-pricing-rule-engine-and-stacking-policy.md)
- [ADR-0016 Immutable quote revisions](0016-immutable-quote-revisions.md)
