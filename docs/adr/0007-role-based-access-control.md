# ADR-0007: Role-based access control

- **Status:** Accepted
- **Date:** 2026-11-20
- **Deciders:** DealForge engineering

## Context

PRD §3 defines six actors with distinct powers and explicit restrictions: a sales
rep cannot change list or cost prices, a sales manager cannot bypass finance on
margin-critical quotes, a finance approver cannot change lines, and a customer
viewer may only see explicitly shared, approved versions without cost or margin.

## Decision Drivers

- Authorization enforced by the API, never only by the UI.
- One matrix shared by API guards and web navigation.
- Object-level checks (own drafts, step role, customer grants) close to the data.

## Considered Options

1. Coarse roles mapped to named permissions in a shared matrix, plus object-level
   checks in services.
2. Per-route role lists.
3. Attribute-based policies evaluated by a policy engine.

## Decision Outcome

Chosen option: **roles -> permissions matrix** (`packages/shared/src/permissions.ts`)
enforced by `requirePermission()` middleware, with object-level rules in services.

| Permission         | SALES_ADMIN | PRICING_MANAGER | SALES_REP | SALES_MANAGER | FINANCE_APPROVER | CUSTOMER_VIEWER |
| ------------------ | :---------: | :-------------: | :-------: | :-----------: | :--------------: | :-------------: |
| catalog:read       |      ✓      |        ✓        |     ✓     |       ✓       |        ✓         |                 |
| catalog:write      |      ✓      |        ✓        |           |               |                  |                 |
| pricing:read       |      ✓      |        ✓        |     ✓     |       ✓       |        ✓         |                 |
| pricing:write      |      ✓      |        ✓        |           |               |                  |                 |
| customers:read     |      ✓      |                 |     ✓     |       ✓       |        ✓         |                 |
| customers:write    |      ✓      |                 |     ✓     |       ✓       |                  |                 |
| quotes:read        |      ✓      |                 |     ✓     |       ✓       |        ✓         |                 |
| quotes:write       |             |                 |     ✓     |               |                  |                 |
| approvals:read     |      ✓      |                 |           |       ✓       |        ✓         |                 |
| approvals:decide   |             |                 |           |       ✓       |        ✓         |                 |
| proposals:share    |             |                 |     ✓     |               |                  |                 |
| portal:access      |             |                 |           |               |                  |        ✓        |
| reports:read       |      ✓      |                 |           |       ✓       |        ✓         |                 |
| audit:read         |      ✓      |                 |           |               |        ✓         |                 |
| notifications:read |      ✓      |        ✓        |     ✓     |       ✓       |        ✓         |        ✓        |
| users:manage       |      ✓      |                 |           |               |                  |                 |
| settings:manage    |      ✓      |                 |           |               |                  |                 |

Object-level rules (services, pending with their tickets): reps see only their own
drafts and managers their team (DF-032); the quote owner can never approve their
own version and a decision must match the step's `approval_role` (DF-042); finance
decisions never modify lines (DF-042); customers read only versions with an active
grant to their contact, through a redacted DTO (DF-047, ADR-0018).

`users.role` holds one role today (CHECK constraint in migration 0002). PRD §3
allows several roles per tenant; `sales_memberships` arrives with DF-008 and the
guard will evaluate the union of membership roles.

### Consequences

- Positive: `apps/api/test/pending-routes.http.test.ts` proves guards run (403)
  before pending endpoints answer 501, so authorization is fixed before features land.
- Negative: single-role users until DF-008.

## Links

- [Threat model](../security/threat-model.md)
- [ADR-0017 Approval routing](0017-approval-policy-routing.md)
