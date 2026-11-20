# ADR-0009: Configuration and secrets management

- **Status:** Accepted
- **Date:** 2026-11-20
- **Deciders:** DealForge engineering

## Context

The repository is public. Developers need a one-command start; production needs
secrets from a managed store and must refuse unsafe defaults.

## Decision Drivers

- No secret ever committed.
- Fail fast on missing or unsafe configuration.
- Zero manual steps for local development.

## Considered Options

1. Environment variables validated by a zod schema at boot; `.env.example` with
   placeholders; `run.sh` generates a random local secret.
2. Config files per environment committed to the repository.
3. A configuration service.

## Decision Outcome

Chosen option: **validated environment variables**. `apps/api/src/config/env.ts`
parses `process.env` once, applies defaults (API port 4104), freezes the result
and aborts startup on invalid values. The placeholder `SESSION_SECRET` is rejected
in production. `run.sh` copies `.env.example` to an untracked `.env` (mode 600) and
replaces the placeholder with 32 random bytes. CI runs gitleaks. Production reads
variables from a secrets manager (see deployment plan).

### Consequences

- Positive: misconfiguration fails at boot with a readable list of issues.
- Negative: every new setting must be added to the schema, `.env.example` and the
  runbook configuration table.

## Links

- [Runbook](../operations/runbook.md)
- [Deployment plan](../operations/deployment.md)
