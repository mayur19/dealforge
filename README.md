# DealForge

**Configure-price-quote and deal-desk platform for B2B suppliers.** Produce accurate
B2B sales quotes quickly, with consistent pricing and a clear approval trail.

DealForge serves managed service providers, equipment resellers and B2B suppliers
that build quotes from a product catalog, configure bundles, apply pricing rules and
negotiate discounts. Sales reps build draft proposals; the server calculates exact
totals and gross margin in integer minor units; excessive discounts or low-margin
deals route to sales managers and finance; approved versions become customer-facing
proposals. See the [product requirements](docs/product/PRD.md).

> **Project status: early foundation.** The platform foundation, the money and
> pricing domain, the approval policy evaluator and the product catalog slice are
> implemented and tested. Everything else is registered in the API contract,
> visible in the UI and tracked in the [backlog](docs/planning/backlog.md):
> 36 of 230 estimated hours done (15.7 %).

## Project status

| Area                                                                         | Status         | Tickets          |
| ---------------------------------------------------------------------------- | -------------- | ---------------- |
| Monorepo, `run.sh`, CI, secrets scan                                         | ✅ Implemented | DF-001           |
| Session auth (scrypt), CSRF, rate limiting, health checks                    | ✅ Implemented | DF-002, DF-003   |
| Role model (6 PRD actors), permission matrix, audit trail                    | ✅ Implemented | DF-003, DF-004   |
| Development seed (Helix + unrelated tenant, users per role, sample products) | ✅ Implemented | DF-006           |
| Money module: integer minor units, basis points, rounding, formatting        | ✅ Implemented | DF-021           |
| Pricing engine: rule eligibility, stacking, caps, breakdown, margins         | ✅ Implemented | DF-022           |
| Approval policy evaluator (manager / finance routing with reasons)           | ✅ Implemented | DF-023           |
| Product catalog API (list/create/get) and screen                             | ✅ Implemented | DF-011, DF-012   |
| Full demo dataset, multi-role memberships, users, org settings               | ⏳ Pending     | DF-007 to DF-010 |
| Catalog edit/archive, filters, CSV import, options, bundles                  | ⏳ Pending     | DF-013 to DF-020 |
| Price books, rule persistence and editor, simulation, tax estimate           | ⏳ Pending     | DF-024 to DF-029 |
| Customers, quotes, versions, calculation, lifecycle, revisions               | ⏳ Pending     | DF-030 to DF-040 |
| Approval workflow, inbox, decisions                                          | ⏳ Pending     | DF-041 to DF-044 |
| Sharing, printable proposal, customer portal                                 | ⏳ Pending     | DF-045 to DF-048 |
| Dashboard, reports, CSV export, notifications, audit timeline, expiry job    | ⏳ Pending     | DF-049 to DF-054 |
| PRD §9 acceptance suite, logo upload, accessibility audit, deployment        | ⏳ Pending     | DF-055 to DF-061 |

Pending API endpoints are registered, authenticated and permission-checked, and
answer `501 NOT_IMPLEMENTED` with their ticket id. Pending screens show a placeholder
naming their ticket.

## Quick start

Requirements: Node.js 22+, npm, and a running local PostgreSQL server (14+; CI uses 17).

```bash
./run.sh
```

On a fresh clone this installs dependencies, creates `.env` from `.env.example` with a
random local session secret, creates the `dealforge_dev` database, applies
migrations, loads the development seed and starts:

- Web: <http://localhost:5174>
- API: <http://127.0.0.1:4104> (proxied by the web dev server under `/api`)

## Demo logins (development only)

These accounts are created by the development seed, are public, and must never exist
in a production database. The seed refuses to run when `NODE_ENV=production`.
Password for all: `DemoPassword!2026`

| Email                    | Role                                  | Organization                                |
| ------------------------ | ------------------------------------- | ------------------------------------------- |
| `admin@helix.example`    | Sales Organization Admin              | Helix Managed Services                      |
| `pricing@helix.example`  | Pricing Manager                       | Helix Managed Services                      |
| `rep@helix.example`      | Sales Representative                  | Helix Managed Services                      |
| `manager@helix.example`  | Sales Manager                         | Helix Managed Services                      |
| `finance@helix.example`  | Finance Approver                      | Helix Managed Services                      |
| `customer@atlas.example` | Customer Viewer (Atlas Manufacturing) | Helix Managed Services                      |
| `admin@corvid.example`   | Sales Organization Admin              | Corvid Industrial Supply (unrelated tenant) |

## `run.sh` commands

| Command                       | What it does                                                                  |
| ----------------------------- | ----------------------------------------------------------------------------- |
| `./run.sh` / `./run.sh start` | Install deps, prepare `.env` and database, migrate, seed, launch API and web  |
| `./run.sh setup`              | Everything `start` does, without launching                                    |
| `./run.sh migrate`            | Apply pending database migrations                                             |
| `./run.sh seed`               | Load development demo data (idempotent)                                       |
| `./run.sh reset [--yes]`      | Drop and recreate the schema, then migrate and seed (asks first)              |
| `./run.sh test`               | Unit and integration tests against a disposable `dealforge_dev_test` database |
| `./run.sh e2e`                | Playwright end-to-end tests (launches the app if needed)                      |
| `./run.sh check`              | Lint, format check, typecheck and tests (what CI runs)                        |
| `./run.sh build`              | Production build of API and web                                               |
| `./run.sh help`               | List commands                                                                 |

## Tech stack

| Layer    | Choice                                                                 |
| -------- | ---------------------------------------------------------------------- |
| Language | TypeScript (strict), Node.js 22+                                       |
| API      | Express 4, `pg`, zod, pino, helmet, express-rate-limit                 |
| Web      | React 18, React Router 6, Vite 6                                       |
| Shared   | zod schemas, permission matrix, pure money/pricing/approval domain     |
| Database | PostgreSQL with forward-only SQL migrations                            |
| Tests    | Vitest, Testing Library, supertest, real PostgreSQL, Playwright        |
| CI       | GitHub Actions (lint, format, typecheck, coverage, build) and gitleaks |

## Repository layout

```text
.
├── apps/
│   ├── api/                    Express API
│   │   ├── migrations/         Forward-only SQL (0001 foundation, 0002 roles + products)
│   │   ├── src/
│   │   │   ├── config/         Validated environment
│   │   │   ├── db/             Pool, migration runner, development seed
│   │   │   ├── lib/            Errors, envelope, validation, pending routes, SQL helpers
│   │   │   ├── middleware/     Session, CSRF, permissions, rate limit, errors
│   │   │   ├── modules/        catalog (products), pricing, customers, quotes, approvals,
│   │   │   │                   proposals, customer-portal, reporting, admin, auth, audit, health
│   │   │   └── security/       scrypt passwords, session and CSRF tokens
│   │   └── test/               HTTP, unit and PostgreSQL integration tests
│   └── web/                    React SPA (products screen, pending screens, auth)
├── packages/
│   └── shared/
│       ├── src/domain/         money, money-format, pricing engine, approval policy
│       ├── src/schemas/        zod contracts (auth, pagination, products)
│       └── src/                roles and permission matrix
├── e2e/                        Playwright smoke test
├── docs/                       Product, architecture, ADRs, design, API, security,
│                               testing, operations, planning
└── run.sh                      Single entry point for local development
```

## Documentation

Start at the [documentation index](docs/README.md). Highlights:

- [Product requirements](docs/product/PRD.md), [user stories](docs/product/user-stories.md), [traceability](docs/product/requirements-traceability.md)
- [Architecture overview](docs/architecture/overview.md), [quality attributes](docs/architecture/quality-attributes.md)
- [Architecture decision records](docs/adr/README.md), including [integer money and rounding](docs/adr/0013-integer-money-and-rounding-policy.md) and [pricing rule stacking](docs/adr/0015-pricing-rule-engine-and-stacking-policy.md)
- [System design](docs/design/system-design.md), [data model](docs/design/data-model.md)
- [API conventions](docs/api/README.md), [OpenAPI contract](docs/api/openapi.yaml)
- [Threat model](docs/security/threat-model.md), [test strategy](docs/testing/test-strategy.md)
- [Runbook](docs/operations/runbook.md), [deployment plan](docs/operations/deployment.md)
- [Roadmap](docs/planning/roadmap.md), [backlog](docs/planning/backlog.md), [risks](docs/planning/risks.md), [glossary](docs/glossary.md)

## Contributing, security and license

- [Contributing guide](CONTRIBUTING.md): workflow, commit conventions, engineering rules.
- [Security policy](SECURITY.md): private vulnerability reporting and secrets policy.
- [Changelog](CHANGELOG.md)
- License: [MIT](LICENSE)
