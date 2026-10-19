/**
 * @grimoire/database
 *
 * SQLite database layer for Grimoire using better-sqlite3.
 * Exports database connection management, migrations, repositories, and seed utilities.
 */

// Connection & Transactions
export {
  createDatabase,
  getDatabase,
  closeDatabase,
  applyPragmas,
  runInTransaction,
  runInTransactionAsync,
  type DatabaseOptions,
} from './connection.js';

// Migrations
export {
  runMigrations,
  listAppliedMigrations,
  type MigrationResult,
  type MigrationRecord,
} from './migrations/runner.js';

// Repository Implementations
export { WorkRepositoryImpl } from './repositories/WorkRepositoryImpl.js';
export { ReadingRepositoryImpl } from './repositories/ReadingRepositoryImpl.js';
export { AccessPathRepositoryImpl } from './repositories/AccessPathRepositoryImpl.js';
export { MemoryRepositoryImpl } from './repositories/MemoryRepositoryImpl.js';
export { CaptureRepositoryImpl } from './repositories/CaptureRepositoryImpl.js';
export { SearchRepositoryImpl } from './repositories/SearchRepositoryImpl.js';
export { UpdateRepositoryImpl } from './repositories/UpdateRepositoryImpl.js';

// Seed Utilities & Configs
export {
  seedDatabase,
  generateSeedData,
  type SeedConfig,
  type SeedStats,
} from './seed/generator.js';
export { smallSeedConfig } from './seed/small.js';
export { mediumSeedConfig } from './seed/medium.js';

// Export & Import
export {
  exportVaultToJson,
  type VaultExportDataV1,
  type VaultExportOptions,
} from './export/vault-export.js';
export {
  importVaultFromJson,
  type ImportSummary,
  type VaultImportOptions,
} from './export/vault-import.js';
