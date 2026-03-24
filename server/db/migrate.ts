import { migrate } from 'drizzle-orm/postgres-js/migrator';
import { getMigrationClient } from './connection';

/**
 * Run all pending Drizzle migrations.
 * Usage: npx tsx server/db/migrate.ts
 */
async function main() {
  console.log('Running migrations...');
  const db = getMigrationClient();

  await migrate(db, { migrationsFolder: './drizzle' });

  console.log('Migrations complete.');
  process.exit(0);
}

main().catch((err) => {
  console.error('Migration failed:', err);
  process.exit(1);
});
