# Glossary

| Term                      | Definition                                                                                                                                                                |
| ------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| **Acknowledgment**        | A customer's in-app acceptance or rejection of a shared quote version, with timestamp and optional note. A demo acknowledgment, not a legal electronic signature (FR-09). |
| **Approval step**         | One sequential review (sales manager or finance) required for a specific quote version, with status, decider and rationale (FR-08).                                       |
| **Approval policy**       | Organization thresholds (manager discount threshold, margin floor) evaluated by `evaluateApprovalPolicy()` to decide which steps a version needs (ADR-0017).              |
| **Basis points (bps)**    | Integer hundredths of a percent; 10 000 bps = 100 %. All percentages (discounts, margins, tax) are stored as bps (ADR-0013).                                              |
| **Billing term**          | Number of months a recurring line is committed for (1-120). Recurring totals are shown per month plus contract value = monthly net × term.                                |
| **Bundle**                | Reusable collection of products with mandatory and optional components and an optional bundle discount; one nesting level in the MVP (FR-04).                             |
| **Calculation snapshot**  | The full pricing breakdown stored on a quote version so totals can be reproduced exactly later.                                                                           |
| **Contract value**        | Sum of recurring monthly net × billing term across recurring lines.                                                                                                       |
| **CPQ**                   | Configure, price, quote: building a priced offer from a catalog with configuration rules and discount policy.                                                             |
| **Customer tier**         | Commercial tier of a customer (for example GOLD) used by CUSTOMER_TIER pricing rules.                                                                                     |
| **Customer quote grant**  | Explicit permission for one customer contact to view one quote version (ADR-0018).                                                                                        |
| **Deal desk**             | The team or process that reviews non-standard discounts and margins before a quote goes to the customer.                                                                  |
| **Effective dates**       | Inclusive `effectiveFrom`/`effectiveUntil` calendar dates during which a rule or price book applies.                                                                      |
| **Gross margin**          | `gross_profit / net_revenue` in bps; `null` (shown as n/a) when net revenue is zero (FR-07).                                                                              |
| **Gross profit**          | Net revenue minus cost snapshot, in minor units.                                                                                                                          |
| **List price**            | Catalog or price-book unit price before any discount.                                                                                                                     |
| **Manual discount**       | Discount requested by a rep, applied last to the post-automatic price and capped by the organization maximum.                                                             |
| **Margin floor**          | Minimum acceptable gross margin; quotes below it need finance approval.                                                                                                   |
| **Minor units**           | Smallest currency unit as an integer (cents for USD, yen for JPY). All money is stored and computed in minor units (ADR-0013).                                            |
| **One-time line**         | A line billed once (hardware, implementation services). Totals are kept separate from recurring lines.                                                                    |
| **Optimistic locking**    | Rejecting an update when the row's version counter changed since it was read (409), used for edits and approval decisions.                                                |
| **Option group / option** | A named set of selectable configuration choices on a product, each with price and cost deltas (FR-03).                                                                    |
| **Pending endpoint**      | An API route from the contract that is registered, guarded, and answers 501 with its backlog ticket until built.                                                          |
| **Price book**            | Versioned, effective-dated list of per-product prices in one currency; immutable once published (ADR-0014).                                                               |
| **Pricing breakdown**     | Ordered steps (base, options, volume, customer tier, bundle, manual) showing each delta and running amount.                                                               |
| **Pricing rule**          | Declarative discount definition: category, priority, conditions, dates, action and cap (ADR-0015).                                                                        |
| **Quote family**          | All versions of one quote, sharing a quote code, customer and owner.                                                                                                      |
| **Quote version**         | An immutable revision of a quote once it leaves DRAFT, with its own lines, totals and approval history (ADR-0016).                                                        |
| **Quoted revenue**        | Value of quotes issued; never presented as realized revenue (FR-10).                                                                                                      |
| **Recurring line**        | A line billed monthly over a billing term (managed services, support).                                                                                                    |
| **Rounding rule**         | Half away from zero to the minor unit, once per discount stage per line (ADR-0013).                                                                                       |
| **SKU**                   | Stock keeping unit; product code unique per organization.                                                                                                                 |
| **Stacking policy**       | At most one automatic rule per category; highest priority wins; ties resolve by ascending rule id (ADR-0015).                                                             |
| **Tenant / organization** | A selling company using DealForge; all data is scoped by `organization_id` (ADR-0003).                                                                                    |
