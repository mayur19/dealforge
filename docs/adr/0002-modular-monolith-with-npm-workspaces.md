# ADR-0002: Modular monolith with npm workspaces

- **Status:** Accepted
- **Date:** 2026-11-20
- **Deciders:** DealForge engineering

## Context

The MVP targets SMB sales teams (5-30 reps, up to 5 000 SKUs). The domain has
strongly coupled consistency needs: a quote submission recalculates prices, freezes
a version, creates approval steps and writes audit rows atomically. The browser
must preview the same money arithmetic the server uses, without duplicating it.

## Decision Drivers

- Transactional consistency across catalog, pricing, quotes and approvals.
- One deployable unit and one database for a small team.
- Share validation schemas and pure pricing code between API and web.
- Clear module boundaries so the system can be split later if needed.

## Considered Options

1. Modular monolith: `apps/api`, `apps/web`, `packages/shared` as npm workspaces.
2. Separate services (catalog, pricing, quotes, approvals) with their own stores.
3. Single package with no internal boundaries.

## Decision Outcome

Chosen option: **modular monolith with npm workspaces**.

- `packages/shared`: zod schemas, role and permission matrix, and the pure domain
  (`src/domain`: money, pricing engine, approval policy). No I/O.
- `apps/api`: Express. Each module (`catalog`, `pricing`, `quotes`, `approvals`,
  `proposals`, `customer-portal`, `reporting`, `admin`) owns routes, service and
  repository. Routes call services; services own transactions and audit;
  repositories own SQL.
- `apps/web`: React + Vite SPA consuming the API and the shared package.

### Consequences

- Positive: one transaction can span pricing, versioning and approvals.
- Positive: the web formats money with exactly the server's functions.
- Negative: module boundaries are enforced by convention and review, not by
  process isolation.
- Negative: the shared package must stay free of Node-only APIs.

## Links

- [Architecture overview](../architecture/overview.md)
- [ADR-0013 Integer money](0013-integer-money-and-rounding-policy.md)
