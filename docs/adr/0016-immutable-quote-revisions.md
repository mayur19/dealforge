# ADR-0016: Immutable quote revisions

- **Status:** Proposed
- **Date:** 2026-11-20
- **Deciders:** DealForge engineering

## Context

FR-06: drafts are editable; submission freezes a version until decision; revisions
create a new immutable version linked to the quote family; any material change after
approval invalidates approval for the new version. D-10 and D-11 require that a
rejected version 1 stays unchanged and that approving a stale version can never
approve the current one. Teams must reconstruct exactly what a customer accepted.

## Decision Drivers

- History is evidence: a version that left DRAFT is never edited.
- Approvals are bound to the exact content they reviewed.
- Concurrency safety for simultaneous edits and decisions.

## Considered Options

1. `quote_families` + `quote_versions` with per-version lines, snapshots and an
   `optimistic_version` counter; only DRAFT versions are mutable.
2. A single mutable quote row with a change log.
3. Event sourcing of quote edits.

## Decision Outcome

Chosen option: **family + immutable versions**.

- `quote_families` holds the code (allocated by a per-organization counter row
  locked `FOR UPDATE`), customer and owner; `current_version` points to the latest.
- `quote_versions` has `UNIQUE (family_id, version_number)`; lines store
  `unit_list_minor_snapshot`, `unit_cost_minor_snapshot`, options and discounts JSON;
  totals and `calculation_snapshot_json` are written only by the server engine.
- Mutations require `status = 'DRAFT'` and a matching `optimistic_version`
  (`UPDATE ... WHERE id = $1 AND optimistic_version = $2`), else 409.
- `clone-revision` copies a version into `version_number + 1` as DRAFT; approval
  steps are never copied. Reprice clones against a newer price book and records the
  diff (DF-038).
- Lifecycle: `DRAFT -> SUBMITTED_FOR_APPROVAL -> APPROVED -> SENT -> ACCEPTED |
REJECTED | EXPIRED`, plus `WITHDRAWN` with reason; transitions are validated by a
  pure state machine and use the server clock (DF-037).

### Consequences

- Positive: D-10/D-11 become structural guarantees, not checks scattered in code.
- Negative: more rows per quote; compare views must diff versions (DF-039).

## Links

- [ADR-0017 Approval routing](0017-approval-policy-routing.md)
- [System design](../design/system-design.md)
