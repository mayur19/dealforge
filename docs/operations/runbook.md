# Runbook

Operational guide for running DealForge locally. Production deployment is a plan only: see
[deployment.md](deployment.md).

## Local setup

Requirements: Node.js ≥ 22 with npm, PostgreSQL (17 recommended) running locally and
reachable by the current OS user (or via credentials in `DATABASE_URL`), `psql` on the PATH.

```bash
git clone <repo-url> dealforge
cd dealforge
./run.sh            # install, create .env + database, migrate, seed, start API and web
```

Open http://localhost:5174 and sign in with a demo login below. The API listens on
http://127.0.0.1:4104 and the Vite dev server proxies `/api` to it.

## Demo logins (development only)

All accounts use the password `DemoPassword!2026`. They are created by the development seed,
which refuses to run with `NODE_ENV=production`. Never reuse them anywhere else.

| Email                  | Role             | Organization                                         |
| ---------------------- | ---------------- | ---------------------------------------------------- |
| admin@helix.example    | SALES_ADMIN      | Helix Managed Services                               |
| pricing@helix.example  | PRICING_MANAGER  | Helix Managed Services                               |
| rep@helix.example      | SALES_REP        | Helix Managed Services                               |
| manager@helix.example  | SALES_MANAGER    | Helix Managed Services                               |
| finance@helix.example  | FINANCE_APPROVER | Helix Managed Services                               |
| customer@atlas.example | CUSTOMER_VIEWER  | Helix Managed Services (Atlas Manufacturing contact) |
| admin@corvid.example   | SALES_ADMIN      | Corvid Industrial Supply (tenant-isolation check)    |

## run.sh command reference

| Command                       | What it does                                                                                                                                    |
| ----------------------------- | ----------------------------------------------------------------------------------------------------------------------------------------------- |
| `./run.sh` / `./run.sh start` | Checks prerequisites, creates `.env` (random `SESSION_SECRET`), installs deps, creates the database, migrates, seeds if empty, starts API + web |
| `./run.sh setup`              | Everything `start` does, without launching                                                                                                      |
| `./run.sh migrate`            | Applies pending migrations from `apps/api/migrations`                                                                                           |
| `./run.sh seed`               | Applies the development seed (idempotent upserts)                                                                                               |
| `./run.sh reset [--yes]`      | Drops and recreates the `public` schema, migrates and seeds; asks for confirmation unless `--yes`; refuses with `NODE_ENV=production`           |
| `./run.sh test`               | Unit + integration tests against `<database>_test` (created if missing)                                                                         |
| `./run.sh e2e`                | Prepares the database, installs Playwright Chromium if possible, runs Playwright                                                                |
| `./run.sh check`              | Lint, format check, typecheck and tests (mirrors CI)                                                                                            |
| `./run.sh build`              | Production build of API (`apps/api/dist`) and web (`apps/web/dist`)                                                                             |
| `./run.sh help`               | Lists commands                                                                                                                                  |

## Configuration

All variables live in `.env` (created from `.env.example`; never commit `.env`). The API
validates them at boot and refuses to start on invalid values.

| Variable               | Default                                   | Purpose                                                                                             |
| ---------------------- | ----------------------------------------- | --------------------------------------------------------------------------------------------------- |
| `NODE_ENV`             | `development`                             | `development`, `test` or `production`; production forbids the placeholder secret, seeding and reset |
| `LOG_LEVEL`            | `info`                                    | pino level (`fatal`..`trace`, `silent`)                                                             |
| `API_HOST`             | `127.0.0.1`                               | API bind address                                                                                    |
| `API_PORT`             | `4104`                                    | API port                                                                                            |
| `WEB_PORT`             | `5174`                                    | Vite dev server port                                                                                |
| `APP_ORIGIN`           | `http://localhost:5174`                   | Browser origin; used for CSRF origin checks                                                         |
| `DATABASE_URL`         | `postgres://localhost:5432/dealforge_dev` | PostgreSQL connection string; `run.sh` creates the database                                         |
| `DATABASE_POOL_MAX`    | `10`                                      | Max pool connections                                                                                |
| `SESSION_SECRET`       | placeholder, replaced by `run.sh`         | HMAC key for CSRF tokens; ≥ 32 characters                                                           |
| `SESSION_TTL_MINUTES`  | `480`                                     | Session lifetime                                                                                    |
| `SESSION_COOKIE_NAME`  | `sid`                                     | Session cookie name                                                                                 |
| `UPLOAD_DIR`           | `./uploads`                               | Local file storage (logos, DF-059)                                                                  |
| `UPLOAD_MAX_BYTES`     | `10485760`                                | Upload size limit                                                                                   |
| `RATE_LIMIT_WINDOW_MS` | `60000`                                   | Rate-limit window                                                                                   |
| `RATE_LIMIT_MAX`       | `300`                                     | Requests per window per IP on `/api`                                                                |
| `AUTH_RATE_LIMIT_MAX`  | `10`                                      | Login attempts per window per IP                                                                    |
| `TEST_DATABASE_URL`    | derived: `<DATABASE_URL>_test`            | Disposable database for integration tests (schema is dropped)                                       |

## Health checks

| Endpoint                | Meaning                                                         |
| ----------------------- | --------------------------------------------------------------- |
| `GET /api/health/live`  | Process is up; never touches the database                       |
| `GET /api/health/ready` | Database reachable; returns 503 `SERVICE_UNAVAILABLE` otherwise |

```bash
curl -s localhost:4104/api/health/ready
```

## Logs

The API writes structured JSON (pino) to stdout, one line per request with a request id that
is also returned in `X-Request-Id` and in error bodies. Cookies, `Authorization`,
`X-CSRF-Token`, `Set-Cookie` and password fields are redacted. Use `LOG_LEVEL=debug` for more
detail; pipe through `npx pino-pretty` for readable output.

## Common failures

| Symptom                                           | Cause                                                          | Fix                                                                                                            |
| ------------------------------------------------- | -------------------------------------------------------------- | -------------------------------------------------------------------------------------------------------------- |
| `Cannot reach PostgreSQL` from `run.sh`           | Server not running or wrong URL                                | Start PostgreSQL (`brew services start postgresql@17` / `sudo service postgresql start`), check `DATABASE_URL` |
| `EADDRINUSE` / Vite "Port 5174 is in use"         | A previous run is still alive                                  | `lsof -ti tcp:4104 -ti tcp:5174 \| xargs kill`                                                                 |
| Login returns 429 `RATE_LIMITED`                  | More than 10 logins per minute (common with repeated E2E runs) | Wait one minute; raise `AUTH_RATE_LIMIT_MAX` locally only if needed                                            |
| `Migration NNNN was modified after being applied` | An applied migration file was edited                           | Revert the edit and add a new migration; in development only, `./run.sh reset --yes`                           |
| `Invalid environment configuration`               | Missing/invalid variable or stale `.env` after an upgrade      | Compare with `.env.example`; delete `.env` and rerun `./run.sh` to regenerate                                  |
| 403 `CSRF_FAILED` from scripts                    | Missing `Origin` or `X-CSRF-Token` header                      | Send `Origin: http://localhost:5174` and the `csrfToken` from the login response                               |
| Integration tests skipped                         | `TEST_DATABASE_URL` unset                                      | Use `./run.sh test`                                                                                            |

## Backup and restore (local)

```bash
# Backup (custom format, compressed)
pg_dump --format=custom --file=dealforge-$(date +%Y%m%d).dump "postgres://localhost:5432/dealforge_dev"

# Restore into a fresh database
createdb dealforge_restore
pg_restore --no-owner --dbname=postgres://localhost:5432/dealforge_restore dealforge-YYYYMMDD.dump
```

Point `DATABASE_URL` at the restored database to use it. Production targets (RPO 15 min,
RTO 1 h) are described in [deployment.md](deployment.md).

## Resetting demo data

```bash
./run.sh reset          # asks for confirmation
./run.sh reset --yes    # non-interactive
```

This drops the schema of the database in `DATABASE_URL`, reapplies all migrations and the
development seed. It refuses to run with `NODE_ENV=production`. The full PRD §8 demo dataset
is tracked as DF-007.
