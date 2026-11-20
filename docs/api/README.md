# DealForge API conventions

The machine-readable contract is [openapi.yaml](openapi.yaml) (OpenAPI 3.1). Every operation
carries `x-status` (`implemented` or `pending`), `x-ticket` (backlog id) and `x-permission`
(entry in the permission matrix, [ADR-0007](../adr/0007-role-based-access-control.md)).

## Status by endpoint group

| Group                        | Paths                                                                | Status      | Tickets                |
| ---------------------------- | -------------------------------------------------------------------- | ----------- | ---------------------- |
| Health                       | `/api/health/live`, `/api/health/ready`                              | Implemented | DF-003                 |
| Auth                         | `/auth/login`, `/auth/session`, `/auth/logout`, `/me`                | Implemented | DF-002                 |
| Organization selection       | `/auth/organizations`                                                | Pending     | DF-008                 |
| Products (list, create, get) | `/products`, `/products/{id}`                                        | Implemented | DF-011                 |
| Catalog extensions           | product edit/archive, import, options, incompatibilities, `/bundles` | Pending     | DF-013 - DF-019        |
| Pricing                      | `/price-books`, `/pricing-rules`, `/pricing/simulate`                | Pending     | DF-024 - DF-028        |
| Customers                    | `/customers`, `/customers/{id}/contacts`                             | Pending     | DF-030                 |
| Quotes                       | `/quotes`, `/quote-versions/{id}` and its actions                    | Pending     | DF-032 - DF-041        |
| Approvals                    | `/approvals`, `/approvals/{id}/decision`                             | Pending     | DF-041 - DF-042        |
| Proposals                    | `/quote-versions/{id}/print`, `/quote-versions/{id}/share`           | Pending     | DF-045 - DF-046        |
| Customer portal              | `/customer/quotes`                                                   | Pending     | DF-047                 |
| Reporting                    | `/reports/*`, `/notifications`, `/audit-logs`                        | Pending     | DF-049 - DF-053        |
| Admin                        | `/users`, `/organization/settings`, `/organization/logo`             | Pending     | DF-009, DF-010, DF-059 |

The contract has 67 operations: 9 implemented, 58 pending. Pending routes are registered with
`pendingRouter`; they run authentication and permission guards exactly as the finished endpoint
will, then answer `501 NOT_IMPLEMENTED` with `details.ticket`.

The pricing calculation (`priceQuote`) and approval routing (`evaluateApprovalPolicy`) are already
implemented and unit tested in `packages/shared/src/domain/`; the pending pricing, quote and approval
endpoints will call them rather than re-implement any arithmetic.

## Versioning

- All product endpoints live under `/api/v1`. Health probes live under `/api/health` so load
  balancers do not depend on the API version.
- Additive changes (new fields, new endpoints) stay in `v1`. Breaking changes require `/api/v2`
  and an ADR superseding [ADR-0006](../adr/0006-api-conventions.md).
- Clients must ignore unknown response fields.

## Envelope

Every JSON response uses the same shape:

```json
{
  "success": true,
  "data": { "...": "..." },
  "error": null,
  "meta": { "total": 7, "page": 1, "limit": 25 }
}
```

```json
{
  "success": false,
  "data": null,
  "error": {
    "code": "VALIDATION_FAILED",
    "message": "Request validation failed",
    "details": [
      { "path": "listPriceMinor", "message": "Must be an integer amount in minor units" }
    ],
    "requestId": "5f0c6c1e-6f0e-4b8e-9d1a-2a6f3c9f6c11"
  }
}
```

`meta` is present only on paginated collections. `requestId` echoes the `X-Request-Id` response
header; quote it when reporting a problem.

## Error codes

| Code                       | HTTP | Meaning                                                                                                                                                                                                                                                                                                                                            |
| -------------------------- | ---: | -------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `VALIDATION_FAILED`        |  422 | Body, query or path failed schema validation; `details` lists `{ path, message }`. Also used for pure domain rule failures (money, pricing, approval policy): `details.domainCode` carries the `DomainError` code, e.g. `PRICE_NOT_FOUND`, `INVALID_RULE`, `INVALID_LINE`, `CURRENCY_MISMATCH`, `ARITHMETIC_OVERFLOW`. Malformed JSON is also 422. |
| `UNAUTHENTICATED`          |  401 | No valid session, or login failed (always the same generic message).                                                                                                                                                                                                                                                                               |
| `FORBIDDEN`                |  403 | The session role lacks the required permission.                                                                                                                                                                                                                                                                                                    |
| `CSRF_FAILED`              |  403 | Origin mismatch or missing/invalid `X-CSRF-Token` on an unsafe method.                                                                                                                                                                                                                                                                             |
| `NOT_FOUND`                |  404 | Unknown route or record. Records of other organizations and malformed ids also return 404, so ids cannot be probed across tenants.                                                                                                                                                                                                                 |
| `CONFLICT`                 |  409 | Uniqueness violation (e.g. duplicate SKU in the organization) or stale optimistic version.                                                                                                                                                                                                                                                         |
| `INVALID_STATE_TRANSITION` |  409 | Quote or approval state machine rejected the transition (DF-037).                                                                                                                                                                                                                                                                                  |
| `RATE_LIMITED`             |  429 | Too many requests in the window.                                                                                                                                                                                                                                                                                                                   |
| `NOT_IMPLEMENTED`          |  501 | Endpoint is in the contract but not built; `details.ticket` names the backlog item.                                                                                                                                                                                                                                                                |
| `SERVICE_UNAVAILABLE`      |  503 | Readiness probe cannot reach PostgreSQL.                                                                                                                                                                                                                                                                                                           |
| `INTERNAL_ERROR`           |  500 | Unexpected failure; details are logged server-side, never returned.                                                                                                                                                                                                                                                                                |

## Pagination

- Query parameters `page` (default 1, minimum 1) and `limit` (default 25, maximum 100). Values
  outside the range return 422.
- Responses include `meta: { total, page, limit }`. A page past the end returns `data: []` with
  the real `total`.
- Ordering is deterministic per endpoint (products: by SKU).

## Money and percentages

Per [ADR-0013](../adr/0013-integer-money-and-rounding-policy.md):

- Amounts are integers in **minor units** of the organization or quote currency, with the suffix
  `Minor` (`listPriceMinor: 1200` is USD 12.00). Strings, negative values and fractional numbers are
  rejected with 422.
- Percentages are integer **basis points** with the suffix `Bps` (`800` = 8.00 %).
- The server computes all totals. Client-supplied totals are ignored (D-06).
- Margins over zero revenue are `null`, never a fabricated value.

## Idempotency and concurrency (planned)

- Approval decisions (DF-042) require an `Idempotency-Key` header. Replaying the same key returns
  the original result; a decision against a superseded version or a stale
  `expectedOptimisticVersion` returns 409.
- Quote versions carry `optimisticVersion`; `PATCH /quote-versions/{id}` must send it and receives
  409 when another change landed first (DF-035).
- Customer acknowledgment is recorded once per version (DF-047); repeats return 409.

## Authentication and CSRF

1. `POST /api/v1/auth/login` with `{ email, password }` sets the HTTP-only `sid` cookie
   (SameSite=Lax) and returns `data.csrfToken`.
2. Every unsafe request (`POST`, `PATCH`, `PUT`, `DELETE`) on an authenticated session must send
   `X-CSRF-Token: <csrfToken>` and an `Origin` header equal to `APP_ORIGIN`
   (`http://localhost:5174` in development). Browsers send `Origin` automatically.
3. `GET /api/v1/auth/session` returns the current user and a fresh copy of the token after a page
   reload.

See [ADR-0005](../adr/0005-session-authentication-scrypt-and-csrf.md).

## Rate limits

| Scope                            | Default      | Setting                                  |
| -------------------------------- | ------------ | ---------------------------------------- |
| All `/api` requests per IP       | 300 per 60 s | `RATE_LIMIT_MAX`, `RATE_LIMIT_WINDOW_MS` |
| `POST /api/v1/auth/login` per IP | 10 per 60 s  | `AUTH_RATE_LIMIT_MAX`                    |

Responses include draft-7 `RateLimit` and `RateLimit-Policy` headers.

## curl examples

Development only: the demo accounts and `DemoPassword!2026` exist only in the local seed. Start
the app with `./run.sh` and use the web proxy so the `Origin` check matches.

```bash
BASE=http://localhost:5174/api/v1
ORIGIN=http://localhost:5174

# Sign in as the sales rep and keep the cookie
CSRF=$(curl -s -c rep.jar -H "Origin: $ORIGIN" -H 'Content-Type: application/json' \
  -d '{"email":"rep@helix.example","password":"DemoPassword!2026"}' \
  "$BASE/auth/login" | node -pe 'JSON.parse(require("fs").readFileSync(0)).data.csrfToken')

# List products (paginated)
curl -s -b rep.jar "$BASE/products?page=1&limit=5"

# A rep cannot change the catalog: 403 FORBIDDEN
curl -s -b rep.jar -H "Origin: $ORIGIN" -H "X-CSRF-Token: $CSRF" -H 'Content-Type: application/json' \
  -d '{"sku":"REP-TRY","name":"x","category":"x","type":"ONE_TIME","unit":"u","listPriceMinor":100,"unitCostMinor":50}' \
  "$BASE/products"

# A pending endpoint: 501 with its ticket
curl -s -b rep.jar "$BASE/quotes"
# {"success":false,"data":null,"error":{"code":"NOT_IMPLEMENTED","message":"Not implemented yet (tracked as DF-032)","details":{"ticket":"DF-032"},...}}
```

Create a product as the pricing manager:

```bash
CSRF=$(curl -s -c pricing.jar -H "Origin: $ORIGIN" -H 'Content-Type: application/json' \
  -d '{"email":"pricing@helix.example","password":"DemoPassword!2026"}' \
  "$BASE/auth/login" | node -pe 'JSON.parse(require("fs").readFileSync(0)).data.csrfToken')

curl -s -b pricing.jar -H "Origin: $ORIGIN" -H "X-CSRF-Token: $CSRF" -H 'Content-Type: application/json' \
  -d '{"sku":"soc-review","name":"Quarterly SOC review","category":"Security","type":"ONE_TIME","unit":"review","listPriceMinor":450000,"unitCostMinor":275050}' \
  "$BASE/products"
# 201, SKU normalised to SOC-REVIEW; repeating the call returns 409 CONFLICT
```

Delete the `*.jar` files afterwards; they contain live session cookies.
