# ADR-0011: Local file attachment storage

- **Status:** Proposed
- **Date:** 2026-11-20
- **Deciders:** DealForge engineering

## Context

The PRD allows the local filesystem only for organization logo uploads and
generated attachments; everything else lives in SQL. No object storage or external
API may be required.

## Decision Drivers

- Works offline and in the sandbox environment.
- Uploaded files must not become an execution or XSS vector.
- Simple path to object storage later.

## Considered Options

1. Local directory (`UPLOAD_DIR`) behind a storage interface, metadata in SQL.
2. Files as `bytea` in PostgreSQL.
3. Object storage from day one.

## Decision Outcome

Chosen option: **local directory behind a `FileStore` interface**. Files are stored
under random names (no user-controlled paths), with content type sniffed and limited
to PNG/JPEG (SVG only after sanitization), size capped by `UPLOAD_MAX_BYTES`, served
with `Content-Disposition` and `X-Content-Type-Options: nosniff`. Metadata and
ownership live in SQL and every upload is audited. Implemented in DF-059.

### Consequences

- Positive: no external dependency; easy to swap for object storage.
- Negative: single-node only; backups must include `UPLOAD_DIR`.

## Links

- [Deployment plan](../operations/deployment.md)
