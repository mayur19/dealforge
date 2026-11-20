# ADR-0003: Multi-tenancy by row-level organization scoping

- **Status:** Accepted
- **Date:** 2026-11-20
- **Deciders:** DealForge engineering

## Context

Each sales organization (tenant) holds confidential list prices, internal costs,
margins and customer lists. PRD acceptance test D-19 requires that Org B can never
read Org A's quotes. The demo dataset deliberately includes an unrelated tenant
(Corvid Industrial Supply) next to Helix Managed Services.

## Decision Drivers

- Zero cross-tenant data exposure, including through guessed ids.
- Simple operations on a single PostgreSQL database.
- Testable isolation at the HTTP level.

## Considered Options

1. Shared schema; every tenant-owned table has `organization_id`; every query
   filters by the session's organization.
2. Schema per tenant.
3. Database per tenant.
4. Option 1 plus PostgreSQL row-level security (RLS) policies.

## Decision Outcome

Chosen option: **shared schema with mandatory `organization_id` scoping** in every
repository statement. The organization id is taken from the server-side session,
never from request bodies or query strings. Records of other tenants are
indistinguishable from non-existent records (404, not 403). Composite uniqueness
includes the tenant key, for example `UNIQUE (organization_id, sku)` on products.
RLS (option 4) is recorded as a hardening follow-up.

### Consequences

- Positive: proven by `apps/api/test/products.db.test.ts` (direct id read from
  another tenant returns 404; lists never include foreign rows).
- Positive: cheap to operate and back up.
- Negative: a forgotten `WHERE organization_id = $1` is a data leak; mitigated by
  repository-only SQL, code review and one isolation test per vertical slice.

## Links

- [Threat model](../security/threat-model.md)
- [Data model](../design/data-model.md)
