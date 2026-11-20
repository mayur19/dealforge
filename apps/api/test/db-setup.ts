import { runMigrations } from '../src/db/migrate.js';
import { createPool, type Db } from '../src/db/pool.js';
import { seed } from '../src/db/seed.js';
import { silentLogger } from './helpers.js';

/**
 * Real-PostgreSQL test database. Enabled when TEST_DATABASE_URL points at a
 * disposable database (run.sh test sets this up). The schema is dropped and
 * rebuilt, so files using it run sequentially (fileParallelism: false).
 */
export const TEST_DATABASE_URL = process.env.TEST_DATABASE_URL;

export async function freshDatabase(): Promise<Db> {
  const db = createPool({ DATABASE_URL: TEST_DATABASE_URL!, DATABASE_POOL_MAX: 4 });
  await db.query('DROP SCHEMA public CASCADE; CREATE SCHEMA public;');
  await runMigrations(db, silentLogger);
  await seed(db, silentLogger);
  return db;
}
