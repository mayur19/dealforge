# ADR-0010: Testing strategy

- **Status:** Accepted
- **Date:** 2026-11-20
- **Deciders:** DealForge engineering

## Context

The PRD's guidance is to treat DealForge as a financial-calculation system and to
verify arithmetic, role access and approval gates through automated tests before
polishing the UI. PRD §9 lists 21 browser-driven acceptance tests that must use real
SQL data, not mocked APIs.

## Decision Drivers

- Exactness of money arithmetic is non-negotiable.
- Tenant isolation and authorization must be proven, not assumed.
- Fast feedback locally; same gates in CI.

## Considered Options

1. Pyramid: exhaustive unit tests on the pure domain, HTTP tests with supertest,
   integration tests on real PostgreSQL, Playwright end to end.
2. Mostly end-to-end tests.
3. Unit tests with a mocked database only.

## Decision Outcome

Chosen option: **test pyramid with real PostgreSQL**.

- Vitest unit tests; the pure domain (`packages/shared/src/domain`) must keep
  100 % line, branch, function and statement coverage (enforced thresholds).
- supertest HTTP tests with a database double for guards and validation.
- Integration tests against a disposable `<db>_test` database (schema dropped and
  rebuilt; files run sequentially).
- Playwright smoke test now; the D-01..D-21 acceptance suite in DF-055..DF-058.
- Overall coverage gate 80 %. TDD: tests are written first.

### Consequences

- Positive: rounding, stacking, caps and approval routing are pinned by tests.
- Negative: integration tests need a local PostgreSQL server.

## Links

- [Test strategy](../testing/test-strategy.md)
