# ADR-0006: API conventions

- **Status:** Accepted
- **Date:** 2026-11-20
- **Deciders:** DealForge engineering

## Context

Many screens and acceptance tests depend on precise HTTP semantics: 422 for invalid
configurations, 409 for stale versions, 403/404 for forbidden access (PRD §7).
Unbuilt endpoints must be visible rather than silently missing.

## Decision Drivers

- One predictable response shape for the SPA and tests.
- Explicit, stable error codes.
- Contract-first: the full PRD §7 surface is registered from day one.

## Considered Options

1. JSON envelope `{ success, data, error, meta }` with stable error codes, URL
   versioning, zod validation at the boundary.
2. Bare resources with RFC 7807 problem details.
3. GraphQL.

## Decision Outcome

Chosen option: **envelope + stable codes + `/api/v1`**.

- Success: `{ success: true, data, error: null, meta? }`; lists add
  `meta: { total, page, limit }` (`limit` max 100).
- Failure: `{ success: false, data: null, error: { code, message, details?, requestId } }`.
- Codes: `VALIDATION_FAILED` 422, `UNAUTHENTICATED` 401, `FORBIDDEN` 403,
  `NOT_FOUND` 404, `CONFLICT` 409, `INVALID_STATE_TRANSITION` 409, `RATE_LIMITED`
  429, `CSRF_FAILED` 403, `NOT_IMPLEMENTED` 501, `SERVICE_UNAVAILABLE` 503,
  `INTERNAL_ERROR` 500. Pure domain errors map to 422 with `details.domainCode`.
- Request bodies and queries are parsed with shared zod schemas; unknown body
  fields are rejected (`.strict()`).
- Pending endpoints are registered with `pendingRouter`, run their real guards,
  then answer 501 with `details.ticket`.

### Consequences

- Positive: the OpenAPI contract and the running API list the same endpoints.
- Negative: an envelope adds a few bytes per response.

## Links

- [API README](../api/README.md)
- [OpenAPI](../api/openapi.yaml)
