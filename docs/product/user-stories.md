# User Stories

Stories are grouped by the actors in [PRD §3](PRD.md#3-actors-and-permissions).
Each story lists acceptance criteria, PRD references and the delivering ticket.
Status: ✅ implemented, ⏳ pending.

## Sales Organization Admin

**US-01: Manage pricing settings.** As a sales organization admin, I want to set the
currency, default quote expiry, illustrative tax rate, margin floor and manager
discount threshold, so that every quote follows the same commercial policy.

- Thresholds are integer basis points; currency is an ISO 4217 code.
- Changing a threshold affects only quotes submitted afterwards.
- Changes are audited with before and after values.
- Refs: FR-01, FR-08 · Ticket: DF-010 ⏳

**US-02: Administer users.** As an admin, I want to invite users, assign roles and
deactivate accounts, so that only current staff can quote or approve.

- Only admins can manage users; deactivation ends active sessions.
- A user can hold several roles in one organization (DF-008).
- Refs: §3, §4.20 · Tickets: DF-008, DF-009 ⏳

**US-03: Read the audit trail.** As an admin, I want a filterable audit timeline of
price, rule, revision, approval, sharing and acceptance events, so that I can explain
any quote outcome.

- Audit rows are append-only and include actor, time and metadata.
- Refs: FR-10, §4.19 · Ticket: DF-053 ⏳

## Pricing Manager

**US-04: Maintain the product catalog.** As a pricing manager, I want to add
products with SKU, category, type, unit, list price and internal cost, so that reps
quote from one consistent catalog.

- Prices and costs are entered as decimals and stored as integer minor units.
- SKUs are unique per organization; a duplicate returns a clear conflict message.
- Sales reps can read but not change the catalog.
- Refs: FR-01, §4.3 · Tickets: DF-011 ✅, DF-012 ✅

**US-05: Edit, archive and import products.** As a pricing manager, I want to edit,
archive and bulk-import products from CSV with a preview, so that catalog upkeep is
fast and safe.

- Archived products still display on historical quotes (D-17).
- Import shows per-row errors before committing; SKU conflicts are resolved explicitly.
- Refs: FR-01, D-17 · Tickets: DF-013, DF-014, DF-015 ⏳

**US-06: Configure options and incompatibilities.** As a pricing manager, I want to
define option groups, options with price and cost deltas, and incompatible pairs, so
that reps cannot build invalid configurations.

- Server rejects missing required options (D-02) and incompatible pairs (D-03).
- Refs: FR-03 · Tickets: DF-016, DF-017, DF-018 ⏳

**US-07: Build bundles.** As a pricing manager, I want reusable bundles with
mandatory and optional components and an explicit bundle discount, so that common
packages are quoted consistently.

- One nesting level only; bundle edits do not change existing quote revisions.
- Refs: FR-04, D-04 · Tickets: DF-019, DF-020, DF-040 ⏳

**US-08: Publish versioned price books.** As a pricing manager, I want draft and
published price books with effective dates, so that I can prepare next period's
prices without changing quotes already issued.

- Published versions are immutable; overlapping active windows are rejected.
- Refs: FR-02 · Tickets: DF-024, DF-025 ⏳

**US-09: Define pricing rules.** As a pricing manager, I want volume, customer-tier
and bundle rules with priority, effective dates, action and cap, so that discounts
are automatic and explainable.

- Rules are declarative data validated on the server; invalid rules return 422.
- At most one rule per category applies; highest priority wins; ties resolve by id.
- Refs: FR-05 · Tickets: DF-022 ✅ (engine), DF-026, DF-027, DF-028 ⏳

## Sales Representative

**US-10: Create a quote.** As a sales rep, I want to start a quote for a customer
with a currency, price book and validity date, so that pricing is locked to the
right version from the start.

- Quote code is allocated and I am recorded as owner (D-01).
- Refs: FR-06, §4.11 · Tickets: DF-032, DF-034 ⏳

**US-11: Build and price lines.** As a sales rep, I want to add products,
configurations and bundles, set quantities and request a manual discount, and see a
step-by-step breakdown, so that I understand exactly how each total was reached.

- Order: base, options, volume, customer tier, bundle, manual; manual applies last
  to the post-automatic price and is capped (D-05). ✅ engine
- One-time and recurring (per month, with term) totals are shown separately.
- Totals are recomputed by the server; tampered client totals are ignored (D-06).
- Refs: FR-05, FR-07, §4.12 · Tickets: DF-021 ✅, DF-022 ✅, DF-035, DF-036 ⏳

**US-12: Submit for approval.** As a sales rep, I want to submit a quote and see
which approvals it needs and why, so that I can anticipate review.

- Manual discount above the threshold requires a sales manager (D-07); margin below
  the floor requires finance (D-08); both route manager then finance. ✅ evaluator
- I cannot send a quote that still needs approval.
- Refs: FR-08 · Tickets: DF-023 ✅, DF-041 ⏳

**US-13: Revise a quote.** As a sales rep, I want to clone a rejected or approved
version into a new draft, so that history stays intact while I negotiate.

- Version 1 remains unchanged; version 2 is editable and carries no approval (D-10).
- Refs: FR-06 · Tickets: DF-038, DF-039 ⏳

**US-14: Share with the customer.** As a sales rep, I want to share an approved
version with a customer contact and print a branded proposal, so that the customer
sees a clean, accurate offer.

- Unapproved versions cannot be shared (D-12).
- Proposal never shows cost or margin; one-time and recurring totals are separate (D-18).
- Refs: FR-09 · Tickets: DF-045, DF-046 ⏳

## Sales Manager

**US-15: Approve discount exceptions.** As a sales manager, I want an inbox of
quotes awaiting my decision with the reasons they were routed to me, so that I can
approve, reject or request changes quickly.

- I cannot approve my own quote (D-09) or a superseded version (D-11).
- Duplicate decisions are idempotent; stale decisions return 409.
- Refs: FR-08, §4.14, §4.15 · Tickets: DF-042, DF-043, DF-044 ⏳

**US-16: See the team pipeline.** As a sales manager, I want a dashboard of pipeline
stages, pending approvals, expiring quotes and value by stage, so that I can
prioritize coaching and reviews.

- Quoted revenue is never labelled as realized revenue.
- Refs: FR-10, §4.2 · Ticket: DF-049 ⏳

## Finance Approver

**US-17: Approve low-margin exceptions.** As a finance approver, I want to review
quotes whose gross margin falls below the floor, with costs and margins per segment,
so that unprofitable deals are deliberate.

- Finance steps follow the manager step when both apply; finance cannot change lines.
- Refs: FR-08 · Tickets: DF-023 ✅ (routing), DF-042, DF-044 ⏳

**US-18: Analyse discounts and margins.** As a finance approver, I want reports on
quoted revenue by month, win rate, discount trend, product mix and approval
turnaround, with CSV export, so that pricing policy can be tuned.

- CSV reflects the same filtered SQL data; no fabricated realized revenue (D-21).
- Refs: FR-10, §4.18 · Tickets: DF-050, DF-051 ⏳

## Customer Viewer

**US-19: Review a shared proposal.** As a customer contact, I want to view the quote
version shared with me, so that I can evaluate the offer.

- I see no internal cost, margin, notes or other quotes (D-13).
- Accessing another customer's quote is denied even through the API (D-14).
- Refs: FR-09, §4.17 · Tickets: DF-047, DF-048 ⏳

**US-20: Acknowledge acceptance.** As a customer contact, I want to accept or reject
the shared version with an optional note, so that the supplier knows my decision.

- Recorded once with timestamp; labelled as a demo acknowledgment, not an
  electronic signature (D-16).
- Expired versions cannot be accepted and show renewal guidance (D-15).
- Refs: FR-09 · Ticket: DF-047, DF-048 ⏳
