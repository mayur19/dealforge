# Changelog

All notable changes to this project are documented here. The format follows
[Keep a Changelog](https://keepachangelog.com/en/1.1.0/) and the project uses
[Semantic Versioning](https://semver.org/).

## [Unreleased]

### Added

- Monorepo foundation: Express + PostgreSQL API, React + Vite web, shared zod package,
  single launcher `run.sh`, GitHub Actions CI with secret scanning (DF-001).
- Session authentication with scrypt password hashing, CSRF protection, rate limiting,
  forward-only migrations, append-only audit trail and health checks (DF-002, DF-003).
- DealForge actor model (Sales Organization Admin, Pricing Manager, Sales
  Representative, Sales Manager, Finance Approver, Customer Viewer), shared permission
  matrix and `users.role` CHECK constraint (DF-004).
- Money module with integer minor units, basis points, overflow guards, the documented
  half-away-from-zero rounding rule and exact display formatting/parsing (DF-021).
- Pricing engine: effective-dated, condition-based rule selection, one rule per
  category by priority with deterministic tie-break, capped discounts, manual discount
  applied last, step-by-step breakdown, separate one-time and recurring totals and
  gross margin with explicit zero-revenue handling (DF-022).
- Approval policy evaluator routing quotes to sales manager and/or finance with
  reasons (DF-023).
- Product catalog: tenant-scoped, permission-gated, audited and paginated list,
  create and get endpoints with unique SKU per organization, plus the catalog screen
  with a create form (DF-011, DF-012).
- Every remaining PRD API endpoint registered as a guarded pending route (501 with
  ticket id) and every PRD screen present in navigation with role visibility.
- Development seed for Helix Managed Services and an unrelated tenant (DF-006).
- Engineering documentation: architecture, ADRs 0001-0018, design, data model,
  OpenAPI contract, threat model, test strategy, operations, roadmap, backlog and
  risks (DF-005).
