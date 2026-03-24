import { drizzle } from 'drizzle-orm/postgres-js';
import postgres from 'postgres';
import * as schema from './schema';

const connectionString = process.env.DATABASE_URL || '';

// Lazy connection — only opens when DATABASE_URL is set and first query runs
let queryClient: ReturnType<typeof postgres> | null = null;
let _db: ReturnType<typeof drizzle> | null = null;

function getQueryClient() {
  if (!connectionString) throw new Error('DATABASE_URL not configured');
  if (!queryClient) {
    queryClient = postgres(connectionString, { max: 10 });
  }
  return queryClient;
}

export function getDb() {
  if (!_db) {
    _db = drizzle(getQueryClient(), { schema });
  }
  return _db;
}

// Legacy export — throws if DATABASE_URL not set
export const db = new Proxy({} as ReturnType<typeof drizzle>, {
  get(_target, prop) {
    return (getDb() as any)[prop];
  },
});

export function isDatabaseConfigured(): boolean {
  return !!connectionString;
}

// Set tenant context for RLS
export async function withTenant<T>(tenantId: string, fn: () => Promise<T>): Promise<T> {
  const client = getQueryClient();
  await client`SELECT set_config('app.current_tenant_id', ${tenantId}, true)`;
  return fn();
}

// Migration client (single connection)
export function getMigrationClient() {
  if (!connectionString) throw new Error('DATABASE_URL not configured');
  const migrationClient = postgres(connectionString, { max: 1 });
  return drizzle(migrationClient, { schema });
}
