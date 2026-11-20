# ADR-0005: Session authentication with scrypt and CSRF protection

- **Status:** Accepted
- **Date:** 2026-11-20
- **Deciders:** DealForge engineering

## Context

The PRD requires local hashed-password authentication, HTTP-only session cookies,
CSRF protection and no external identity provider. The web app and API share an
origin through the Vite proxy in development and a reverse proxy in production.

## Decision Drivers

- No third-party auth dependency; works offline.
- Revocable sessions (logout, deactivation).
- Resistance to credential stuffing and CSRF.

## Considered Options

1. Opaque server-side sessions in PostgreSQL + scrypt + HMAC CSRF token.
2. Stateless JWT in local storage.
3. JWT in cookies with refresh tokens.

## Decision Outcome

Chosen option: **opaque server-side sessions**.

- Passwords hashed with Node's built-in scrypt (N=32768, r=8, p=1, 16-byte salt);
  a dummy hash equalizes timing for unknown emails.
- 256-bit random session token in an `HttpOnly; SameSite=Lax` cookie (`Secure` in
  production); only its SHA-256 is stored in `sessions`.
- CSRF: Origin/Referer must equal `APP_ORIGIN` on unsafe methods, and
  authenticated unsafe requests carry `X-CSRF-Token = HMAC(SESSION_SECRET, token)`.
- Login is rate limited (`AUTH_RATE_LIMIT_MAX` per window) and returns a generic 401.

### Consequences

- Positive: sessions are revocable and never exposed to JavaScript.
- Negative: one database lookup per request (indexed primary key).
- Follow-up: organization selection for multi-membership users (DF-008).

## Links

- [Threat model](../security/threat-model.md)
- [API conventions](../api/README.md)
