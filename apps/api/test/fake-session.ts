import type { Role } from '@dealforge/shared';
import type { Db } from '../src/db/pool.js';
import { deriveCsrfToken } from '../src/security/tokens.js';
import { testEnv } from './helpers.js';

export const FAKE_TOKEN = 'fake-session-token-for-http-tests';

/**
 * A database double that answers the session lookup with a user of the
 * given role, so HTTP-level tests can exercise auth and permission guards
 * without PostgreSQL. Every other query returns no rows.
 */
export function sessionDb(role: Role | null): Db {
  return {
    query: async (sql: string) => {
      if (role && sql.includes('FROM sessions')) {
        return {
          rows: [
            {
              user_id: '00000000-0000-4000-8000-000000000001',
              organization_id: '00000000-0000-4000-8000-0000000000aa',
              organization_name: 'Helix Managed Services',
              currency_code: 'USD',
              email: 'user@helix.example',
              display_name: 'Test User',
              role,
            },
          ],
          rowCount: 1,
        };
      }
      return { rows: [], rowCount: 0 };
    },
  } as unknown as Db;
}

export function authHeaders(): Record<string, string> {
  const env = testEnv();
  return {
    Cookie: `${env.SESSION_COOKIE_NAME}=${FAKE_TOKEN}`,
    'X-CSRF-Token': deriveCsrfToken(FAKE_TOKEN, env.SESSION_SECRET),
    Origin: env.APP_ORIGIN,
  };
}
