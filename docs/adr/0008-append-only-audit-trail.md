# ADR-0008: Append-only audit trail

- **Status:** Accepted
- **Date:** 2026-11-20
- **Deciders:** DealForge engineering

## Context

FR-10 requires append-only history for prices, rules, revisions, approvals, sharing
and acceptance. Teams must reconstruct which quote version a customer accepted and
who approved which discount.

## Decision Drivers

- Audit rows must never disagree with business state.
- Tamper resistance from the application path.
- Queryable by tenant and entity.

## Considered Options

1. `audit_events` table written in the same transaction as the change.
2. Asynchronous event log written after commit.
3. Database triggers capturing row diffs.

## Decision Outcome

Chosen option: **transactional `audit_events` rows** written through
`recordAudit(tx, event)` inside the service transaction. Columns: organization,
actor, action (`product.created`, later `quote.submitted`, `approval.decided`,
`grant.created`, `acknowledgment.recorded`), entity type and id, `jsonb` metadata,
request id, timestamp. The application never updates or deletes audit rows;
production grants revoke UPDATE/DELETE on the table for the application role.
The PRD's `audit_logs` entity maps to this table.

### Consequences

- Positive: a failed insert rolls back its audit row (proven by the duplicate-SKU
  test: 409 and no extra `product.created` row).
- Negative: audit writes add latency to each state change (one indexed insert).
- Follow-up: audit API and timeline screen (DF-053).

## Links

- [System design](../design/system-design.md)
