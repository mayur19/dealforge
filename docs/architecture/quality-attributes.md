# Quality attributes

Non-functional requirements for DealForge with measurable targets. "Now"
describes what the current code guarantees; "Planned" names the ticket that
closes the gap. Targets assume the MVP sizing in PRD §1: 5-30 sales reps per
tenant, up to 5,000 SKUs and quotes of up to 200 lines.

## Correctness of money (highest priority)

DealForge is a financial-calculation system first. If scope must be cut,
correctness, version isolation and approval integrity are never traded away
(PRD §10).

| ID    | Requirement                  | Target                                                      | Now                                                                                                                            | Planned                                      |
| ----- | ---------------------------- | ----------------------------------------------------------- | ------------------------------------------------------------------------------------------------------------------------------ | -------------------------------------------- |
| QA-M1 | No floating point in amounts | 0 float operations on money in domain code                  | Integer minor units, BigInt intermediates, safe-integer guards ([ADR-0013](../adr/0013-integer-money-and-rounding-policy.md))  | Lint rule for `parseFloat` in domain, DF-035 |
| QA-M2 | Deterministic pricing        | Same input snapshot gives byte-identical breakdown          | `priceQuote` is pure; tie-break priority desc then id asc ([ADR-0015](../adr/0015-pricing-rule-engine-and-stacking-policy.md)) | Snapshot stored per version, DF-035          |
| QA-M3 | Domain test coverage         | 100 % lines and branches on `packages/shared/src/domain/**` | Enforced by Vitest thresholds                                                                                                  | none                                         |
| QA-M4 | Server authority             | Client-supplied totals never persisted                      | Engine exists; no quote persistence yet                                                                                        | DF-035, acceptance D-06 (DF-056)             |

## Security

| ID    | Requirement              | Target                                                                   | Now                                                                             | Planned                                    |
| ----- | ------------------------ | ------------------------------------------------------------------------ | ------------------------------------------------------------------------------- | ------------------------------------------ |
| QA-S1 | Verification standard    | OWASP ASVS 4.0 Level 2 for in-scope chapters                             | See [threat-model.md](../security/threat-model.md)                              | Full mapping review before release         |
| QA-S2 | Tenant isolation         | 0 cross-tenant reads; foreign ids return 404                             | Products repository scoped; integration test proves 404                         | Same test per new entity; D-19 (DF-058)    |
| QA-S3 | Authorization            | Every `/api/v1` route except login declares a guard                      | `requireAuth` + `requirePermission` on implemented and pending routes; tested   | Record-level checks DF-032, DF-042, DF-047 |
| QA-S4 | Credentials              | scrypt N=32768, r=8, p=1; session token 256 bits; only hashes stored     | Implemented ([ADR-0005](../adr/0005-session-authentication-scrypt-and-csrf.md)) | none                                       |
| QA-S5 | Brute force              | Login limited to `AUTH_RATE_LIMIT_MAX` (default 10) per minute per IP    | Implemented                                                                     | Per-account lockout after review           |
| QA-S6 | Customer redaction       | Customer API and proposal contain 0 cost, margin or internal note fields | Not yet exposed                                                                 | DF-046, DF-047, D-13                       |
| QA-S7 | Dependencies and secrets | 0 committed secrets; CI secret scan on every push                        | gitleaks in CI                                                                  | Dependency audit gate DF-061               |

## Performance

Measured server-side (request received to response sent) on the reference
environment: 2 vCPU, 4 GB RAM, PostgreSQL on the same network, warm caches.

| ID    | Operation                                                                       | p95 target | p99 target |
| ----- | ------------------------------------------------------------------------------- | ---------- | ---------- |
| QA-P1 | `GET /api/v1/products` (25 per page, 5,000 SKUs)                                | 80 ms      | 200 ms     |
| QA-P2 | `POST /api/v1/products`                                                         | 120 ms     | 300 ms     |
| QA-P3 | `POST /api/v1/quote-versions/:id/calculate` (200 lines, 8 rules)                | 250 ms     | 500 ms     |
| QA-P4 | `POST /api/v1/quote-versions/:id/submit` (recalculate + steps, one transaction) | 400 ms     | 800 ms     |
| QA-P5 | `POST /api/v1/approvals/:id/decision`                                           | 200 ms     | 400 ms     |
| QA-P6 | `GET /api/v1/reports/quotes` (12 months, 10,000 versions)                       | 800 ms     | 1,500 ms   |
| QA-P7 | Login (dominated by scrypt)                                                     | 300 ms     | 600 ms     |
| QA-P8 | Web first contentful paint on broadband, production build                       | 1.5 s      | 2.5 s      |

The pure engine prices a 200-line quote in well under 10 ms; database round
trips dominate. Load tests are part of DF-061.

## Availability and resilience

| ID    | Requirement                               | Target                                                                                                  |
| ----- | ----------------------------------------- | ------------------------------------------------------------------------------------------------------- |
| QA-A1 | Monthly availability (planned production) | 99.5 % excluding announced maintenance                                                                  |
| QA-A2 | Liveness                                  | `/api/health/live` never touches dependencies                                                           |
| QA-A3 | Readiness                                 | `/api/health/ready` returns 503 within 5 s when PostgreSQL is unreachable (pool connection timeout 5 s) |
| QA-A4 | Graceful shutdown                         | SIGTERM drains HTTP within 10 s, then closes the pool (implemented)                                     |
| QA-A5 | Zero-downtime deploys                     | Expand-then-contract migrations; see [deployment.md](../operations/deployment.md)                       |

## Scalability

| Dimension                          | MVP target                               | Path beyond                                                      |
| ---------------------------------- | ---------------------------------------- | ---------------------------------------------------------------- |
| Tenants per database               | 500                                      | Partition hot tables by `organization_id`                        |
| Concurrent users per tenant        | 50                                       | Stateless API behind a load balancer; sessions are in PostgreSQL |
| SKUs per tenant                    | 5,000                                    | Indexed search; trigram index for name search (DF-014)           |
| Quote versions per tenant per year | 20,000                                   | Reporting read replica and materialized monthly aggregates       |
| API instances                      | 1 (development), 2+ (planned production) | Horizontal; background worker runs as a single leader (DF-052)   |

## Observability

| ID    | Requirement        | Target                                                               | Now                                                   |
| ----- | ------------------ | -------------------------------------------------------------------- | ----------------------------------------------------- |
| QA-O1 | Structured logs    | 100 % of requests logged as JSON with request id, status and latency | pino-http                                             |
| QA-O2 | Sensitive data     | Cookies, CSRF tokens, passwords and hashes redacted                  | Logger redaction paths                                |
| QA-O3 | Correlation        | `X-Request-Id` echoed and included in error bodies and audit rows    | Implemented                                           |
| QA-O4 | Metrics            | RED metrics per route and pool saturation                            | Planned, [deployment.md](../operations/deployment.md) |
| QA-O5 | Audit completeness | Every state change has an audit row in the same transaction          | Products and logins; all modules as built             |

## Accessibility and usability

| ID    | Requirement      | Target                                                                                                  |
| ----- | ---------------- | ------------------------------------------------------------------------------------------------------- |
| QA-U1 | Conformance      | WCAG 2.1 AA on all screens (audit DF-060)                                                               |
| QA-U2 | Keyboard         | Every action reachable by keyboard with visible focus (focus ring implemented in `styles.css`)          |
| QA-U3 | Semantics        | Tables use captions and `scope`; forms use labels; errors use `role="alert"` (catalog screen does)      |
| QA-U4 | Responsive       | Usable at 360 px width; navigation collapses to a horizontal bar below 760 px                           |
| QA-U5 | Status clarity   | Money badges for low margin, high discount and expired quotes (DF-033, DF-036)                          |
| QA-U6 | Honest labelling | Tax shown as estimate; acceptance labelled as demo acknowledgment; quoted revenue never called realized |

## Data retention and privacy

| Data                                              | Retention                                         | Notes                                                                           |
| ------------------------------------------------- | ------------------------------------------------- | ------------------------------------------------------------------------------- |
| Quote versions, lines, approvals, acknowledgments | Life of the tenant                                | Immutable once submitted ([ADR-0016](../adr/0016-immutable-quote-revisions.md)) |
| Audit events                                      | Minimum 7 years                                   | Append-only ([ADR-0008](../adr/0008-append-only-audit-trail.md))                |
| Sessions                                          | Until expiry (`SESSION_TTL_MINUTES`, default 480) | Swept every 15 minutes                                                          |
| Notifications                                     | 180 days after read                               | Purge job with DF-052                                                           |
| Logs                                              | 30 days                                           | Contains no passwords, cookies or tokens                                        |
| Customer contact data                             | Until the customer is archived plus 1 year        | Export on request                                                               |

## Backup and restore

| Objective       | Target                  | Mechanism (planned production)                                                          |
| --------------- | ----------------------- | --------------------------------------------------------------------------------------- |
| RPO             | 15 minutes              | Managed PostgreSQL point-in-time recovery with WAL archiving                            |
| RTO             | 1 hour                  | Restore to a new instance, run `db:migrate` (no-op on matching schema), repoint the API |
| Logical backups | Daily, 35-day retention | `pg_dump --format=custom`, see [runbook.md](../operations/runbook.md)                   |
| Restore drill   | Quarterly               | Restore into staging and run the integration suite                                      |

## Maintainability

- Files under 400 lines, functions under 50 lines, no `any`, strict TypeScript.
- Coverage gate: 80 % overall, 100 % for the shared domain ([ADR-0010](../adr/0010-testing-strategy.md)).
- `./run.sh check` mirrors CI and must be green before merge.
