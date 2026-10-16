/**
 * Seed runner CLI script.
 *
 * Usage:
 *   tsx src/seed/run.ts [--config small|medium] [--db ./vault.db]
 */

import path from 'node:path';
import { createDatabase, closeDatabase } from '../connection.js';
import { seedDatabase } from './generator.js';
import { smallSeedConfig } from './small.js';
import { mediumSeedConfig } from './medium.js';

function parseArgs(): { configName: 'small' | 'medium'; dbPath: string } {
  const args = process.argv.slice(2);
  let configName: 'small' | 'medium' = 'medium';
  let dbPath = process.env.CHRONICLES_DB_PATH || path.resolve(process.cwd(), 'chronicles-vault.db');

  for (let i = 0; i < args.length; i++) {
    if (args[i] === '--config' && args[i + 1]) {
      configName = args[i + 1] === 'small' ? 'small' : 'medium';
      i++;
    } else if (args[i] === '--db' && args[i + 1]) {
      dbPath = path.resolve(args[i + 1]!);
      i++;
    }
  }

  return { configName, dbPath };
}

async function main() {
  const { configName, dbPath } = parseArgs();
  const config = configName === 'small' ? smallSeedConfig : mediumSeedConfig;

  console.log(`[seed] Starting ${config.name} seed (${config.workCount} works)...`);
  console.log(`[seed] Target Database: ${dbPath}`);

  const db = createDatabase({
    filename: dbPath,
    runMigrations: true,
  });

  try {
    const stats = seedDatabase(db, config);
    console.log(`[seed] Successfully seeded database in ${stats.durationMs}ms:`);
    console.log(`  - Works:                 ${stats.worksCreated}`);
    console.log(`  - Reading Relationships: ${stats.readingRelationshipsCreated}`);
    console.log(`  - Access Paths:          ${stats.accessPathsCreated}`);
    console.log(`  - Memories:              ${stats.memoriesCreated}`);
    console.log(`  - Captures:              ${stats.capturesCreated}`);
    console.log(`  - Updates:               ${stats.updatesCreated}`);
  } finally {
    closeDatabase();
    db.close();
  }
}

main().catch((err) => {
  console.error('[seed] Fatal error during seeding:', err);
  process.exit(1);
});
