# ADR-0012: In-app notifications and background worker

- **Status:** Proposed
- **Date:** 2026-11-20
- **Deciders:** DealForge engineering

## Context

FR-10 requires in-app notifications for approval requests, decisions, quote expiry
and customer acknowledgment. External email is a non-goal. Quote expiry must be
evaluated against the server clock (FR-06).

## Decision Drivers

- Notifications must not be lost or duplicated when a transaction rolls back.
- No message broker for the MVP.
- Expiry must run even when nobody opens the quote.

## Considered Options

1. Insert `notifications` rows in the business transaction; an in-process interval
   worker handles scheduled work (expiry) using `SELECT ... FOR UPDATE SKIP LOCKED`.
2. A message broker with consumers.
3. Client polling only, no scheduled work.

## Decision Outcome

Chosen option: **transactional notification rows plus an in-process worker**. The
worker runs in the API process (as the session sweeper already does), is idempotent,
and can move to a separate process with the same code. Delivered in DF-052 (notifications)
and DF-054 (expiry job).

### Consequences

- Positive: exactly-once creation semantics tied to commits.
- Negative: in-process scheduling needs a leader or `SKIP LOCKED` once more than
  one API instance runs.

## Links

- [System design](../design/system-design.md)
