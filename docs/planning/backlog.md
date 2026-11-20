# Backlog

Machine-readable copy: [backlog.json](backlog.json) (used to create GitHub issues; must stay identical to this table).

Estimates are focused engineering hours. Status: ✅ Done / ⏳ Pending. Milestones are described in [roadmap.md](roadmap.md).

## M0: Foundation

Monorepo, launcher, auth, tenancy, audit, roles, docs and development seed.

| ID     | Title                                                                   | Milestone | PRD refs     | Estimate (h) | Status     | Depends on                                     |
| ------ | ----------------------------------------------------------------------- | --------- | ------------ | -----------: | ---------- | ---------------------------------------------- |
| DF-001 | Bootstrap monorepo, run.sh launcher and CI pipeline                     | M0        | §2           |            4 | ✅ Done    | -                                              |
| DF-002 | Implement session authentication with scrypt, CSRF and rate limiting    | M0        | §2           |            4 | ✅ Done    | DF-001                                         |
| DF-003 | Add migration runner, append-only audit table and health checks         | M0        | §2, FR-10    |            3 | ✅ Done    | DF-001                                         |
| DF-004 | Define DealForge role model, permission matrix and role CHECK migration | M0        | §3           |            2 | ✅ Done    | DF-003                                         |
| DF-005 | Write engineering documentation set and ADRs                            | M0        | §11          |            4 | ✅ Done    | -                                              |
| DF-006 | Seed development organizations, demo users per role and sample products | M0        | §8           |            2 | ✅ Done    | DF-004                                         |
| DF-007 | Load the full PRD section 8 demonstration dataset                       | M0        | §8           |            5 | ⏳ Pending | DF-019, DF-024, DF-026, DF-030, DF-032, DF-042 |
| DF-008 | Support multi-role memberships and organization selection at login      | M0        | §3, §4.1     |            5 | ⏳ Pending | DF-004                                         |
| DF-009 | Build user administration API and screen                                | M0        | §3, §4.20    |            4 | ⏳ Pending | DF-008                                         |
| DF-010 | Build organization pricing settings API and screen                      | M0        | FR-01, §4.20 |            4 | ⏳ Pending | DF-004                                         |

## M1: Catalog and configuration

Products, CSV import, configurable options, incompatibilities and bundles (FR-01, FR-03, FR-04).

| ID     | Title                                                                   | Milestone | PRD refs          | Estimate (h) | Status     | Depends on     |
| ------ | ----------------------------------------------------------------------- | --------- | ----------------- | -----------: | ---------- | -------------- |
| DF-011 | Implement products catalog list, create and get API                     | M1        | FR-01             |            4 | ✅ Done    | DF-004         |
| DF-012 | Build product catalog list and create screen                            | M1        | FR-01, §4.3       |            3 | ✅ Done    | DF-011         |
| DF-013 | Edit and archive products with immutable quote snapshots                | M1        | FR-01, D-17       |            3 | ⏳ Pending | DF-011         |
| DF-014 | Add catalog search and status/category filters                          | M1        | FR-01, §4.3       |            2 | ⏳ Pending | DF-011         |
| DF-015 | Import products from CSV with preview, errors and SKU conflict handling | M1        | FR-01             |            5 | ⏳ Pending | DF-011         |
| DF-016 | Build option groups and product options API                             | M1        | FR-03             |            4 | ⏳ Pending | DF-011         |
| DF-017 | Implement option incompatibility rules and configuration validator      | M1        | FR-03, D-02, D-03 |            4 | ⏳ Pending | DF-016         |
| DF-018 | Build product option and compatibility editor screen                    | M1        | FR-03, §4.5       |            4 | ⏳ Pending | DF-016, DF-017 |
| DF-019 | Build bundles API with one-level components and bundle discount         | M1        | FR-04             |            5 | ⏳ Pending | DF-016         |
| DF-020 | Build bundle builder and bundle detail screens                          | M1        | FR-04, §4.6       |            4 | ⏳ Pending | DF-019         |

## M2: Pricing

Money primitives, pricing engine, approval policy, price books and pricing rules (FR-02, FR-05, FR-07).

| ID     | Title                                                                          | Milestone | PRD refs           | Estimate (h) | Status     | Depends on     |
| ------ | ------------------------------------------------------------------------------ | --------- | ------------------ | -----------: | ---------- | -------------- |
| DF-021 | Implement money module with integer minor units and basis points               | M2        | §2, FR-07          |            3 | ✅ Done    | -              |
| DF-022 | Implement pricing engine with rule selection, stacking, caps and margin        | M2        | FR-05, FR-07, D-05 |            5 | ✅ Done    | DF-021         |
| DF-023 | Implement approval policy evaluator                                            | M2        | FR-08, D-07, D-08  |            2 | ✅ Done    | DF-022         |
| DF-024 | Build price books API with draft/publish, versions and effective windows       | M2        | FR-02              |            5 | ⏳ Pending | DF-011         |
| DF-025 | Build price-book editor screen                                                 | M2        | FR-02, §4.7        |            4 | ⏳ Pending | DF-024         |
| DF-026 | Build pricing rules API with declarative schema validation                     | M2        | FR-05              |            4 | ⏳ Pending | DF-024         |
| DF-027 | Build discount and price-rule policy editor screen                             | M2        | FR-05, §4.8        |            3 | ⏳ Pending | DF-026         |
| DF-028 | Add pricing simulation endpoint                                                | M2        | FR-05              |            2 | ⏳ Pending | DF-024, DF-026 |
| DF-029 | Add configured-option adjustments and illustrative tax estimate to calculation | M2        | FR-03, FR-07       |            3 | ⏳ Pending | DF-017, DF-022 |

## M3: Customers and quotes

Customer directory, quote families, immutable versions, server-side calculation and lifecycle (FR-06, FR-07).

| ID     | Title                                                                | Milestone | PRD refs           | Estimate (h) | Status     | Depends on             |
| ------ | -------------------------------------------------------------------- | --------- | ------------------ | -----------: | ---------- | ---------------------- |
| DF-030 | Build customers and contacts API                                     | M3        | §4.9               |            4 | ⏳ Pending | DF-004                 |
| DF-031 | Build customer and contact directory screen                          | M3        | §4.9               |            3 | ⏳ Pending | DF-030                 |
| DF-032 | Build quote families, code allocator, versions schema and create API | M3        | FR-06, D-01        |            5 | ⏳ Pending | DF-024, DF-030         |
| DF-033 | Build quote list screen                                              | M3        | FR-06, §4.10       |            3 | ⏳ Pending | DF-032                 |
| DF-034 | Build new-quote wizard screen                                        | M3        | FR-06, §4.11       |            3 | ⏳ Pending | DF-032                 |
| DF-035 | Persist quote lines and server-side calculate endpoint               | M3        | FR-07, D-05, D-06  |            5 | ⏳ Pending | DF-022, DF-029, DF-032 |
| DF-036 | Build quote builder screen                                           | M3        | FR-07, §4.12       |            6 | ⏳ Pending | DF-035                 |
| DF-037 | Implement quote state machine and server-clock expiry                | M3        | FR-06, D-15        |            4 | ⏳ Pending | DF-032                 |
| DF-038 | Clone revisions and reprice into a new version with diff             | M3        | FR-02, FR-06, D-10 |            4 | ⏳ Pending | DF-035, DF-037         |
| DF-039 | Build quote revision compare page                                    | M3        | FR-06, §4.13       |            3 | ⏳ Pending | DF-038                 |
| DF-040 | Add bundle lines to quotes with component breakdown                  | M3        | FR-04, D-04        |            3 | ⏳ Pending | DF-019, DF-035         |

## M4: Approvals

Sequential approval steps, decisions with optimistic locking, inbox and decision screens (FR-08).

| ID     | Title                                                                               | Milestone | PRD refs          | Estimate (h) | Status     | Depends on             |
| ------ | ----------------------------------------------------------------------------------- | --------- | ----------------- | -----------: | ---------- | ---------------------- |
| DF-041 | Submit for approval and create sequential approval steps                            | M4        | FR-08, D-07, D-08 |            4 | ⏳ Pending | DF-023, DF-035, DF-037 |
| DF-042 | Record approval decisions with idempotency, optimistic locking and no self-approval | M4        | FR-08, D-09, D-11 |            5 | ⏳ Pending | DF-041                 |
| DF-043 | Build approval inbox screen                                                         | M4        | FR-08, §4.14      |            3 | ⏳ Pending | DF-041                 |
| DF-044 | Build approver decision detail screen                                               | M4        | FR-08, §4.15      |            3 | ⏳ Pending | DF-042                 |

## M5: Proposal and customer portal

Printable proposal, explicit customer grants and acknowledgment (FR-09).

| ID     | Title                                                                      | Milestone | PRD refs                      | Estimate (h) | Status     | Depends on |
| ------ | -------------------------------------------------------------------------- | --------- | ----------------------------- | -----------: | ---------- | ---------- |
| DF-045 | Share approved versions with customer contacts through explicit grants     | M5        | FR-09, D-12                   |            3 | ⏳ Pending | DF-037     |
| DF-046 | Build printable proposal HTML view and terms                               | M5        | FR-09, D-18                   |            4 | ⏳ Pending | DF-035     |
| DF-047 | Build customer portal API with redaction, expiry and single acknowledgment | M5        | FR-09, D-13, D-14, D-15, D-16 |            5 | ⏳ Pending | DF-045     |
| DF-048 | Build customer quote view and accept/reject screen                         | M5        | FR-09, §4.17                  |            3 | ⏳ Pending | DF-047     |

## M6: Reporting, notifications and audit

Dashboard, reports, CSV export, notifications, expiry job and audit timeline (FR-10).

| ID     | Title                                              | Milestone | PRD refs           | Estimate (h) | Status     | Depends on             |
| ------ | -------------------------------------------------- | --------- | ------------------ | -----------: | ---------- | ---------------------- |
| DF-049 | Build sales dashboard API and screen               | M6        | FR-10, §4.2        |            5 | ⏳ Pending | DF-041, DF-047         |
| DF-050 | Build quote reports API                            | M6        | FR-10, D-21        |            5 | ⏳ Pending | DF-041, DF-047         |
| DF-051 | Build reports screen with filters and CSV export   | M6        | FR-10, §4.18, D-21 |            4 | ⏳ Pending | DF-050                 |
| DF-052 | Deliver in-app notifications and background worker | M6        | FR-10              |            5 | ⏳ Pending | DF-041, DF-042, DF-047 |
| DF-053 | Build audit log API and timeline screen            | M6        | FR-10, §4.19       |            3 | ⏳ Pending | DF-003                 |
| DF-054 | Add scheduled quote expiry job                     | M6        | FR-06, FR-10       |            2 | ⏳ Pending | DF-037, DF-052         |

## M7: Acceptance and release

PRD section 9 Playwright acceptance suite, accessibility, branding uploads and deployment packaging.

| ID     | Title                                                                                    | Milestone | PRD refs                                 | Estimate (h) | Status     | Depends on             |
| ------ | ---------------------------------------------------------------------------------------- | --------- | ---------------------------------------- | -----------: | ---------- | ---------------------- |
| DF-055 | Automate acceptance tests D-01 to D-04 (quote creation and configuration)                | M7        | D-01, D-02, D-03, D-04                   |            4 | ⏳ Pending | DF-036, DF-040         |
| DF-056 | Automate acceptance tests D-05 to D-11 (pricing, tampering and approval gates)           | M7        | D-05, D-06, D-07, D-08, D-09, D-10, D-11 |            5 | ⏳ Pending | DF-042                 |
| DF-057 | Automate acceptance tests D-12 to D-16 (sharing and customer portal)                     | M7        | D-12, D-13, D-14, D-15, D-16             |            4 | ⏳ Pending | DF-048                 |
| DF-058 | Automate acceptance tests D-17 to D-21 (history, print, isolation, persistence, reports) | M7        | D-17, D-18, D-19, D-20, D-21             |            4 | ⏳ Pending | DF-046, DF-051         |
| DF-059 | Support organization logo upload for proposal branding                                   | M7        | §2, FR-09                                |            3 | ⏳ Pending | DF-010, DF-046         |
| DF-060 | Run accessibility and responsive audit (WCAG 2.1 AA)                                     | M7        | §4                                       |            3 | ⏳ Pending | DF-036, DF-044, DF-048 |
| DF-061 | Package production container image and deployment pipeline                               | M7        | §11                                      |            4 | ⏳ Pending | DF-001                 |

## Totals

| Metric                |  Value |
| --------------------- | -----: |
| Tickets               |     61 |
| Done tickets          |     11 |
| Pending tickets       |     50 |
| Done hours            |     36 |
| Pending hours         |    194 |
| Total hours           |    230 |
| % complete (by hours) | 15.7 % |
