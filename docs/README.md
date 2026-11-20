# DealForge Documentation

Each document states what exists today and what is planned, with backlog ticket ids.

## Product

- [PRD.md](product/PRD.md): product requirements (source of truth).
- [user-stories.md](product/user-stories.md): user stories per role with acceptance criteria and FR references.
- [requirements-traceability.md](product/requirements-traceability.md): FR and acceptance test to tickets, ADRs, test files and status.

## Architecture

- [overview.md](architecture/overview.md): C4 context, container and component diagrams, module boundaries, request lifecycle.
- [quality-attributes.md](architecture/quality-attributes.md): measurable non-functional requirements.
- [adr/README.md](adr/README.md): index of architecture decision records 0001-0018.

## Design

- [system-design.md](design/system-design.md): module design, key flows, state machines, jobs, concurrency, error handling.
- [data-model.md](design/data-model.md): entity-relationship model of the full PRD schema and migration status.

## API

- [api/README.md](api/README.md): conventions, envelope, error codes, pagination, CSRF, curl examples.
- [openapi.yaml](api/openapi.yaml): OpenAPI 3.1 contract with `x-status` and `x-ticket` per operation.

## Security

- [threat-model.md](security/threat-model.md): assets, trust boundaries, STRIDE, mitigations, tenant-isolation test plan.

## Testing

- [test-strategy.md](testing/test-strategy.md): pyramid, coverage gates, acceptance test mapping, how to run each layer.

## Operations

- [runbook.md](operations/runbook.md): local setup, commands, configuration, troubleshooting, backup and restore.
- [deployment.md](operations/deployment.md): planned production topology and release process.

## Planning

- [roadmap.md](planning/roadmap.md): milestones, exit criteria, estimates and schedule.
- [backlog.md](planning/backlog.md): ticket table with estimates and status ([backlog.json](planning/backlog.json) is the machine-readable copy).
- [risks.md](planning/risks.md): risk register.

## Reference

- [glossary.md](glossary.md): domain terms.
