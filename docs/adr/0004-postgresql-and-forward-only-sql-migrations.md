# ADR-0004: PostgreSQL and forward-only SQL migrations

- **Status:** Accepted
- **Date:** 2026-11-20
- **Deciders:** DealForge engineering

## Context

DealForge needs strict foreign keys, CHECK constraints on money and states,
transactional DDL, `bigint` minor-unit columns, `jsonb` calculation snapshots and
unique constraints for `(family_id, version_number)`. The PRD names PostgreSQL with
the `pg` driver.

## Decision Drivers

- Integrity enforced in the database as defence in depth.
- Reproducible schema across developer machines, CI and production.
- No ORM-generated surprises in financial queries.

## Considered Options

1. PostgreSQL with hand-written SQL migrations applied by a small runner.
2. PostgreSQL with an ORM migration tool.
3. SQLite (allowed by PRD as a fallback).

## Decision Outcome

Chosen option: **PostgreSQL 17 with forward-only SQL files** in
`apps/api/migrations/NNNN_description.sql`, applied in lexical order, each in its
own transaction, recorded in `schema_migrations` with a SHA-256 checksum. Editing an
applied migration aborts the run. Repositories use parameterized SQL through `pg`.

Current migrations: `0001_foundation.sql` (organizations, users, sessions,
audit_events) and `0002_roles_and_products.sql` (role CHECK, organization
currency, products).

### Consequences

- Positive: money bounds and state values are enforced even if application code is
  wrong (the products test proves a negative price is rejected by the database).
- Negative: rollbacks are new forward migrations; destructive changes need
  expand/contract steps (see deployment plan).

## Links

- [Data model](../design/data-model.md)
- [Runbook](../operations/runbook.md)
