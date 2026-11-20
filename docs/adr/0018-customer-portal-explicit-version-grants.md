# ADR-0018: Customer portal access through explicit version grants

- **Status:** Proposed
- **Date:** 2026-11-20
- **Deciders:** DealForge engineering

## Context

FR-09 and PRD §3: a customer viewer may read only a specifically shared, approved
quote version and record acceptance or rejection; internal cost, margin and manager
notes must never appear on the proposal or customer API responses (D-13). Access must
not rely on guessing opaque ids (D-14). Acceptance is a demo acknowledgment, not a
legal signature, and expired versions require renewal (D-15).

## Decision Drivers

- Least privilege for an external audience.
- Structural, not conditional, redaction of internal fields.
- Exactly-once acknowledgment.

## Considered Options

1. `customer_quote_grants(quote_version_id, customer_contact_id, revoked_at)` checked
   on every portal query, with a dedicated redacted DTO and separate routes under
   `/api/v1/customer/*`.
2. Unguessable share links (capability URLs).
3. Reuse internal quote endpoints with field filtering.

## Decision Outcome

Chosen option: **explicit grants + dedicated redacted DTO + separate routes**.

- Grants can be created only for `APPROVED` (or `SENT`) versions, by the owning rep,
  and are audited (DF-045).
- Portal queries join through an active grant for the session's contact; anything
  else is 404 (DF-047).
- The portal DTO is a separate type built from an allow-list of fields; it has no
  cost, margin, approval or note fields, so they cannot leak by omission.
- `customer_acknowledgments` has `UNIQUE (quote_version_id)`; accepting an expired
  version (server clock) returns 409 with renewal instructions.

### Consequences

- Positive: redaction is verifiable by inspecting response JSON in acceptance tests.
- Negative: customer viewers are users of the selling organization in the MVP;
  separate customer identities are post-MVP.

## Links

- [Threat model](../security/threat-model.md)
