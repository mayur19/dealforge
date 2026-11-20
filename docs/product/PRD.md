# DealForge — B2B Sales Quoting & Pricing Rules SaaS

**Document type:** Implementation-ready product requirements document (PRD)  
**Version:** 1.0 · 20 November 2026  
**Delivery target:** Working MVP (see docs/planning/roadmap.md for phased estimates).  
**Primary delivery:** A SQL-backed configure-price-quote (CPQ) and deal-approval web app, complete with quote versioning, margin controls, printable proposals and automated tests.

## 1. Product brief

DealForge is a focused CPQ and deal-desk platform for B2B suppliers, managed service providers and equipment resellers that build quotes from a product catalog, configure bundles, apply pricing rules and negotiate discounts. Sales representatives create draft proposals; the system calculates exact totals and gross margin; excessive discounts or low-margin deals route to managers/finance for approval; approved quotes become customer-facing proposals.

**One-sentence promise:** Produce accurate B2B sales quotes quickly, with consistent pricing and a clear approval trail.

**Initial target buyer:** SMB with 5–30 sales reps, a catalog of 100–5,000 SKUs/services, nontrivial bundle/volume pricing, and frequent discount exceptions.  
**Commercial category reference:** DealHub is an established paid CPQ/deal management product; competing in this category is not the same as proving demand for this implementation.  
**Proposed pricing hypothesis:** $49–99/month per small sales team, optionally by seat or quote volume after validation.

### Problems addressed

- Spreadsheet quotes contain inconsistent pricing, missing items or broken formulas.
- Reps discount without visibility into gross margin and approval policy.
- Product dependencies and bundle configurations are easy to get wrong.
- Managers spend time manually reviewing offers without context or version comparison.
- Teams cannot reliably reconstruct which quote version a customer accepted.

### Non-goals

No real payment/checkout flow, live tax calculation service, Stripe integration, CRM sync, electronic signatures, customer credit checks, real-time inventory synchronization, automated proposal copywriting, contract-law compliance, external email sending, multi-currency FX conversion or production-grade e-signature.

## 2. Sandbox and technical requirements

- Support Linux + Node.js 22 + npm mirror + SQL server + Chrome/Playwright, with **no general internet, Docker, GPU, apt-get or paid APIs**.
- React + Vite frontend, Express backend, PostgreSQL with `pg`. A documented verified SQLite path is acceptable if the available local Postgres instance cannot be started.
- Use locally bundled CSS/fonts/icons. No CDN requests or hidden network calls.
- Store accounts, sessions, catalog, price books, rules, quotes, approval decisions and audit trail in SQL. Local filesystem only for logo uploads and generated attachments.
- Local hashed-password authentication, HTTP-only session cookies, CSRF protection, input validation and API-enforced role permissions.
- **All monetary calculations must be performed on the server** using integer minor currency units (e.g., cents/paise), integer quantity for stock-like items, and integer basis points for discount/tax percentages; do not use raw floating-point math for price totals.
- Every persisted quote has an explicit currency and effective price-book version. The MVP supports **one currency per quote**, without FX conversion.
- For PDF output, a print-optimized quote HTML view using Chrome print/save-as-PDF is sufficient. Do not require an external PDF API or fragile headless-browser package at runtime.
- Provide local seed accounts, data migrations, reset scripts, README, Playwright tests and start commands. Packages must come only from the mirror; gracefully replace unavailable libraries.

## 3. Actors and permissions

| Role                               | Permissions                                                                                                        | Restrictions                                                             |
| ---------------------------------- | ------------------------------------------------------------------------------------------------------------------ | ------------------------------------------------------------------------ |
| Sales Organization Admin           | Manage users, settings, price books, discount policies, all reports                                                | Cannot access other tenant organizations                                 |
| Pricing Manager                    | Manage catalog, option compatibility, bundles, list/cost prices and price rules                                    | Cannot self-approve their own quote exception                            |
| Sales Representative               | Create/edit own draft quotes, configure products, propose discounts, request approval, share a local customer view | Cannot directly modify list/cost prices or bypass approval               |
| Sales Manager                      | See team quotes, approve permitted discount exceptions, return for revision                                        | Cannot bypass finance approval on margin-critical quotes                 |
| Finance Approver                   | Approve or reject low-margin exceptions, see costs and margin                                                      | Cannot change quote lines during approval                                |
| Customer Viewer (local demo login) | Read a specifically shared, approved quote version and indicate acceptance/rejection in-app                        | Cannot read internal costs, manager notes, other quotes or pricing rules |

A user may have more than one role within a tenant. Object-level permission checks must be performed server-side; a sales rep should not automatically see another rep's private draft. Customer access uses an explicit quote-version grant rather than guessing opaque IDs.

## 4. Required screens

1. Login and account/organization selection.
2. Sales dashboard: pipeline quote stages, pending approvals, expiring quotes and value by stage.
3. Product catalog list and filters.
4. Product editor: price/cost, SKU, attributes, active status.
5. Configurable product option/compatibility editor.
6. Bundle builder and bundle detail page.
7. Price-book editor with effective dates and versions.
8. Discount/price-rule policy editor.
9. Customer account and contact directory.
10. Quote list with owner, stage, expiry, total and approval status.
11. New-quote wizard: customer, currency, price book and validity.
12. Quote builder: line items, configuration, quantity, discounts and calculation summary.
13. Quote revision/compare versions page.
14. Approval inbox with margin and exception explanations.
15. Approver decision detail.
16. Approved proposal preview, print view and terms.
17. Customer-specific quote view and accept/reject action.
18. Reports for conversion, discounts, gross margin and product mix.
19. Audit timeline and in-app notifications.
20. Organization pricing settings and user administration.

Prioritize a clean and fast quote-builder interaction, responsive layout, understandable cost warnings and explicit status indicators; a functional workflow is more important than animated charts.

## 5. Functional requirements

### FR-01 — Organization and catalog (P0)

- Organization settings include currency code, default quote expiry, sales tax rate policy (manual, not jurisdiction-verified), minimum gross-margin threshold and discount approval thresholds.
- Product has SKU, name, category, description, type (`ONE_TIME` or `RECURRING`), unit, list price, internal unit cost, active flag and optional image.
- Support flat services, one-time hardware/products and recurring services. For MVP, a quote may contain recurring and one-time lines but **must display these totals separately**; do not incorrectly merge an annual subscription into a one-time amount.
- Create/edit/archive catalog products; historical quotes retain immutable price/cost snapshots.
- Catalog search, status/category filters and CSV import with preview/error reporting; conflict handling by SKU.

### FR-02 — Price books and effective versions (P0)

- Price book defines currency, description, start/end validity and per-product list prices.
- Draft/editable and published/immutable price book states.
- Quotes lock to one published price book version upon creation; a manual reprice action creates a new quote version with visible before/after differences.
- Enforce no invalid overlapping active price-book windows when a customer segment requires unique active pricing.
- Preserve prices even after catalog products are archived.

### FR-03 — Product configuration (P0)

- Configurable products have named option groups, selectable options and additive price/cost adjustments.
- Example: managed security package has `Endpoints` tier, `Support SLA`, and `Managed Detection` option.
- Validations include required options, one-of selections, allowed/min/max quantities and mutually incompatible option pairs.
- Configurations must be deterministic and validated on server; the browser only previews calculations.
- Store configuration selections and their price/cost adjustments as a snapshot on each quote line.

### FR-04 — Bundles (P0)

- Bundle represents a reusable collection of products/configurations with mandatory and optional components.
- Configure optional components with quantity rules, inclusion conditions and fixed or percentage bundle discounts.
- Bundle edits apply to future quotes, not existing quote revisions.
- Prevent circular bundle nesting by supporting **one level only** in MVP.
- Sales rep can add bundle to quote; pricing breakdown remains visible per component and consolidated in the quote total.

### FR-05 — Pricing rules engine (P0)

- Rules are data records with a **restricted declarative schema**, not user-entered JavaScript or unrestricted expression evaluation.
- Minimum supported rules: quantity-based discount tiers, customer-tier discount, and bundle discount (explicitly configured).
- Rule properties: scope, conditions, priority, effective dates, action (`PERCENT_DISCOUNT` or `FIXED_DISCOUNT`), stacking mode and maximum allowed discount.
- Deterministic order: base price → option price adjustments → applicable volume discount → applicable customer discount → permitted bundle discount → manually requested discount → tax display.
- MVP stacking policy: at most one rule in each category; highest-priority eligible rule wins; manual discount applied last to the post-automatic-discount price. Show each step in a pricing breakdown.
- All discounts must be capped and prices must not go negative. Invalid rules are rejected by server validation.
- Quote calculation always reads rule snapshots tied to a published price-book/rule-set version; no silent retroactive repricing.

### FR-06 — Quote creation, revisions and lifecycle (P0)

- Quote contains customer, contact, rep owner, title, currency, validity date, scope notes, payment terms text, price book version, lines and totals.
- States: `DRAFT → SUBMITTED_FOR_APPROVAL → APPROVED → SENT → ACCEPTED / REJECTED / EXPIRED`; support `WITHDRAWN`, with reason and audit.
- Drafts are editable; submission freezes a version until decision. Revisions create a **new immutable version record** linked to the quote family.
- On any material change to line items, quantities, discounts, currency, price book or terms after approval, previous approval is invalid for the new version.
- Customer sees only approved, explicitly shared versions. A quote should not appear as accepted merely because someone printed it.
- Server enforces transitions and expiration against its own clock, not client-side time.

### FR-07 — Financial calculation and margin controls (P0)

- `line_base_minor = unit_list_minor × integer_quantity` for one-time lines; option adjustments contribute to effective unit price.
- Apply percentage discounts in basis points using a documented per-line rounding policy (round half up to minor unit at each discount stage), with no double application.
- `line_net_minor = max(0, discounted_line_amount)`; `quote_subtotal_minor = Σ line_net_minor` for relevant one-time or recurring category.
- `gross_profit_minor = net_revenue_minor − cost_minor_snapshot`; `gross_margin_bps = gross_profit_minor / net_revenue_minor × 10,000`, with explicit handling of zero revenue (not an infinite or fake margin).
- One-time and recurring revenue/cost/margin are shown separately; recurring lines display a `per_month` amount with term (e.g., 12 months). Do not label a recurring monthly price as an annual one.
- Taxes: optional manually configured illustrative rate, excluded from gross-margin calculation; label tax amounts as estimates and **not tax-compliance advice**.
- All totals are recalculated server-side and cannot be overridden with tampered client JSON.
- Display warning badges for unusually low margin, high discount and expired quote.

### FR-08 — Approval workflow (P0)

- Policies: sales rep can self-submit standard quotes; discount above an organization-defined threshold requires sales-manager approval; projected gross margin below floor requires finance approval **in addition to** sales manager when both triggers apply.
- Support sequential approval steps, assignment, comments, approve/reject/request-changes actions and final state.
- No self-approval by quote owner, and approving an old quote version must not approve a newer revision.
- An approval action is idempotent and uses optimistic locking to reject stale duplicate decisions.
- On rejection, rep creates a revised draft version. Approval history remains attached to the version it reviewed.

### FR-09 — Proposal output and customer acceptance (P0)

- Generate branded printable HTML quote showing buyer contact, seller details, product descriptions/options, quantities, unit/net pricing, separate recurring and one-time totals, validity, terms and a unique quote ID/version.
- Internal gross margin and cost must **never** appear on the customer proposal or customer API responses.
- Customer portal can view only a version specifically shared to them and record `ACCEPTED` or `REJECTED` with timestamp and optional note.
- Explicitly label acceptance as a **demo application acknowledgment**, not a verified legal electronic signature.
- If quote expires before acceptance, require rep to renew via new version rather than changing history.

### FR-10 — Reporting, alerts and audit (P0)

- Dashboard: draft value, pending approvals, approved vs accepted quote count, discount exception rate, average approved gross margin, quotes expiring soon.
- Reports: revenue quoted by month, win rate based on accepted/rejected with clear denominator, discount trend, frequently quoted SKUs, approval turnaround.
- Separate `quoted revenue` from **realized revenue**; no actual revenue/payment data exists in MVP.
- Filters by date, customer, owner and status; CSV exports reflect real filtered SQL data.
- In-app notifications for approval request, decision, quote expiry and customer acknowledgment.
- Append-only audit history for prices, rules, revisions, approvals, sharing and acceptance actions.

## 6. Data model (minimum)

- `sales_organizations(id, name, currency_code, timezone, margin_floor_bps, manager_discount_threshold_bps, default_tax_bps, created_at)`
- `users(id, email_normalized UNIQUE, password_hash, name)`
- `sales_memberships(id, organization_id, user_id, role, active)`
- `customers(id, organization_id, name, tier, billing_address_text, status)`
- `customer_contacts(id, organization_id, customer_id, name, email, status)`
- `products(id, organization_id, sku, name, type, category, unit, active, default_list_minor, default_cost_minor, UNIQUE(organization_id,sku))`
- `option_groups(id, organization_id, product_id, name, required, min_selections, max_selections)`
- `product_options(id, organization_id, option_group_id, label, price_delta_minor, cost_delta_minor, active)`
- `option_incompatibilities(id, organization_id, option_id_a, option_id_b)`
- `bundles(id, organization_id, code, name, status, version)`
- `bundle_components(id, organization_id, bundle_id, product_id, quantity, required, options_snapshot_json)`
- `price_books(id, organization_id, name, currency, status, version, active_from, active_until)`
- `price_book_lines(id, organization_id, price_book_id, product_id, unit_list_minor, unit_cost_minor)`
- `pricing_rules(id, organization_id, price_book_id, category, priority, conditions_json, action_type, action_value_int, stacking_mode, effective_from, effective_until)`
- `quote_families(id, organization_id, quote_code, customer_id, owner_id, current_version, created_at)`
- `quote_versions(id, organization_id, family_id, version_number, customer_contact_id, price_book_id, status, currency, valid_until, terms_text, submitted_at, approved_at, shared_at, accepted_at, one_time_subtotal_minor, recurring_monthly_subtotal_minor, calculation_snapshot_json, optimistic_version)`
- `quote_lines(id, organization_id, quote_version_id, product_id NULL, bundle_code NULL, quantity_int, price_type, billing_term_months NULL, unit_list_minor_snapshot, unit_cost_minor_snapshot, options_json, discounts_json, net_minor, cost_minor, sort_order)`
- `approval_steps(id, organization_id, quote_version_id, sequence, approval_role, assigned_user_id NULL, status, decided_by NULL, decided_at NULL, rationale)`
- `customer_quote_grants(id, organization_id, quote_version_id, customer_contact_id, granted_at, revoked_at NULL)`
- `customer_acknowledgments(id, organization_id, quote_version_id, customer_contact_id, outcome, note, decided_at)`
- `notifications(id, organization_id, user_id, event_type, read_at NULL, created_at)`
- `audit_logs(id, organization_id, actor_id, subject_type, subject_id, action, payload_json, created_at)`

Use strict FKs, indexes on org/owner/status/customer/date, immutable historical line snapshots, DB transactions for quote submission/approval/acceptance, and uniqueness for `(family_id, version_number)` plus a controlled quote-code allocator. Protect every record by organization and explicit role/customer grant.

## 7. API contract (illustrative)

- Auth `/api/auth/login`, `/api/auth/me`, `/api/auth/logout`
- Catalog `/api/products`, `/api/products/import`, `/api/products/:id/options`, `/api/bundles`
- Pricing `/api/price-books`, `/api/price-books/:id/publish`, `/api/pricing-rules`, `/api/pricing/simulate`
- Customers `/api/customers`, `/api/customers/:id/contacts`
- Quotes `/api/quotes`, `/api/quotes/:id/versions`, `/api/quote-versions/:id`, `/api/quote-versions/:id/calculate`, `/api/quote-versions/:id/submit`, `/api/quote-versions/:id/clone-revision`
- Approvals `/api/approvals`, `/api/approvals/:id/decision`
- Proposal `/api/quote-versions/:id/print`, `/api/quote-versions/:id/share`
- Customer portal `/api/customer/quotes`, `/api/customer/quotes/:id`, `/api/customer/quotes/:id/acknowledge`
- Reports `/api/reports/quotes`, `/api/reports/export.csv`, `/api/notifications`, `/api/audit-logs`

Use explicit 422 validation errors for invalid configurations, 409 for stale versions, 403/404 for forbidden access and API authorization on all POST/PATCH requests.

## 8. Demo data and golden workflow

Demo company: **Helix Managed Services**, selling managed endpoint security, network support and deployment services. Seed 100 catalog items, 8 configurable products, 4 bundles, 2 published price books, 8 pricing rules, 40 customers, 60 quotes across states and realistic approval history. Include a separate unrelated sales organization for tenant isolation.

**Golden demo scenario:**

1. Sales rep creates a quote for **Atlas Manufacturing** using the current price book.
2. Rep adds 200 endpoint security seats, a premium support option and one-time implementation services.
3. Quantity rule yields 8% discount; customer tier yields an additional 3% on the eligible remaining amount; the pricing breakdown is transparent.
4. Rep requests another 7% manual discount; quote falls below required margin threshold.
5. System creates sequential sales-manager and finance approval steps.
6. Manager approves; finance requests changes; the rep creates version 2 with a smaller discount.
7. Both required approvers approve version 2; version 1 remains rejected and immutable.
8. Rep shares approved version with customer viewer; customer acknowledges acceptance in-app.
9. Print-friendly quote shows pricing and terms but **never cost/margin**; dashboards reflect the accepted quote.

## 9. Playwright acceptance matrix

| Test ID | Scenario                                            | Expected result                                                    |
| ------- | --------------------------------------------------- | ------------------------------------------------------------------ |
| D-01    | Sales rep signs in and creates customer quote       | Draft saved, quote ID allocated, owner recorded                    |
| D-02    | Add configured product with required option missing | Server rejects invalid configuration                               |
| D-03    | Select mutually incompatible options                | Server rejects with clear reason                                   |
| D-04    | Add a bundle and change quantities                  | Accurate component prices and costs                                |
| D-05    | Apply volume/customer/manual discounts              | Totals match reference integer arithmetic                          |
| D-06    | Change client JSON totals to understate quote       | Server ignores/rejects tampered totals                             |
| D-07    | Manual discount exceeds threshold                   | Approval required; cannot send                                     |
| D-08    | Gross margin below configured floor                 | Finance approval required                                          |
| D-09    | Quote owner attempts own approval                   | Denied by backend                                                  |
| D-10    | Reject version 1, clone to version 2                | Version 1 unchanged, v2 editable, no reused approval               |
| D-11    | Approve stale version while new revision current    | Cannot grant approval to new version                               |
| D-12    | Share unapproved quote with customer                | Denied                                                             |
| D-13    | Customer views shared proposal                      | No internal cost, margin, audit-only notes or unrelated quote data |
| D-14    | Customer tries to access different customer quote   | Denied even via direct API                                         |
| D-15    | Customer accepts expired quote                      | Rejected with renewal instruction                                  |
| D-16    | Customer accepts approved unexpired version         | Acknowledgment recorded once, status updated                       |
| D-17    | Archive catalog product used in older quote         | Historical quote continues to display its snapshot                 |
| D-18    | Print quote                                         | Branded, legible, one-time and recurring totals separate           |
| D-19    | Org B accesses Org A quote                          | Cross-tenant access denied                                         |
| D-20    | Reload and restart                                  | Catalog, approvals, quote versions and acknowledgments persist     |
| D-21    | Reporting date filter/export                        | Accurate authorized results, no fabricated realized revenue        |

Also unit-test rounding boundaries, zero-revenue margin, discount stacking, billing terms, configuration rules, rule precedence and state transition gates. Use browser-driven E2E tests with real SQL data, not mocked API results.

## 10. Delivery milestones and effort

| Phase                                     | Estimated effort | Deliverable                                        |
| ----------------------------------------- | ---------------: | -------------------------------------------------- |
| App foundation/auth/database              |            4–6 h | Users, tenancy, navigation, seed/migrations        |
| Catalog, configuration, bundle management |           7–10 h | Working products/options and compatibility         |
| Price books and rules engine              |            6–9 h | Versioned pricing, deterministic calculations      |
| Quote builder and revisions               |            6–9 h | Accurate quote lines, version snapshots, summaries |
| Approvals and customer proposal           |            5–8 h | Approval state machine, safe customer view, print  |
| Reports, tests and polishing              |            4–8 h | Live dashboards, Playwright suite, README          |

If the build exceeds the target, simplify bundle options or reporting, **not** pricing correctness, version isolation or approval integrity.

## 11. Definition of done

- Reps can create, revise and submit accurate quotes entirely from the browser.
- Price, discount, option and margin logic is server-authoritative and unit-tested.
- A rejected/approved quote version remains immutable and has its own approval history.
- Customer proposal reveals no internal cost or gross-margin information.
- Approvals, quote expiry and customer access restrictions cannot be bypassed using API calls.
- Real SQL provides all dashboard and quote data; refresh/restart preserves state.
- Seed accounts and at least 20 acceptance scenarios are executable with Playwright.
- The app starts with documented local commands, without remote dependencies or Docker.
- No nonfunctional buttons or misleading claims of integrated payment, CRM, tax or e-signature functionality.

## 12. Post-MVP roadmap

CRM/ERP synchronization; multi-currency and managed FX rates; customer self-service quote revisions; electronic signatures; contract generation; tax localization; subscriptions/renewals; billing and payments; inventory availability; guided-selling questionnaires; quote-to-order conversion; formal forecasting; enterprise approvals and SSO.

---

**Engineering guidance:** Treat DealForge as a financial-calculation system, not just a quote form. Build money/rule calculations and immutable versions first, then approvals, customer views and reports. Verify arithmetic, role access and all approval gates through automated tests before polishing the UI.
