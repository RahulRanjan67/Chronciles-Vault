import { describe, it, expect, beforeEach, afterEach } from 'vitest';
import type Database from 'better-sqlite3';
import {
  createDatabase,
  closeDatabase,
  runMigrations,
  seedDatabase,
  smallSeedConfig,
  exportVaultToJson,
  importVaultFromJson,
} from '../index.js';

describe('Vault Export & Import Engine', () => {
  let db: Database.Database;

  beforeEach(() => {
    db = createDatabase({ filename: ':memory:' });
    runMigrations(db);
    seedDatabase(db, smallSeedConfig);
  });

  afterEach(() => {
    closeDatabase(db);
  });

  it('exports all seeded records to valid VaultExportDataV1 JSON', async () => {
    const exported = await exportVaultToJson(db);

    expect(exported.version).toBe(1);
    expect(exported.source).toBe('chronicles-vault');
    expect(exported.counts.works).toBeGreaterThan(0);
    expect(exported.counts.readingRelationships).toBeGreaterThan(0);
    expect(exported.counts.accessPaths).toBeGreaterThan(0);
    expect(exported.counts.memories).toBeGreaterThan(0);
    expect(exported.counts.updateEntries).toBeGreaterThan(0);

    expect(exported.data.works.length).toBe(exported.counts.works);
    expect(exported.data.readingRelationships.length).toBe(exported.counts.readingRelationships);
    expect(exported.data.accessPaths.length).toBe(exported.counts.accessPaths);
    expect(exported.data.memories.length).toBe(exported.counts.memories);
  });

  it('omits private and vault records when scrubPrivate is true', async () => {
    // Insert a private work and memory
    db.prepare(`
      INSERT INTO works (id, title, content_type, origin, publication_state, privacy_state, created_at, updated_at)
      VALUES ('work-private', 'Secret Diary', 'novel', 'western', 'completed', 'private', datetime('now'), datetime('now'))
    `).run();

    db.prepare(`
      INSERT INTO memories (id, work_id, type, title, body, privacy_state, created_at, updated_at)
      VALUES ('mem-private', 'work-private', 'note', 'Private Thought', 'Hidden from export', 'private', datetime('now'), datetime('now'))
    `).run();

    const fullExport = await exportVaultToJson(db, { scrubPrivate: false });
    const scrubbedExport = await exportVaultToJson(db, { scrubPrivate: true });

    expect(fullExport.data.works.some((w) => w.id === 'work-private')).toBe(true);
    expect(fullExport.data.memories.some((m) => m.id === 'mem-private')).toBe(true);
    expect(scrubbedExport.data.works.some((w) => w.id === 'work-private')).toBe(false);
    expect(scrubbedExport.data.memories.some((m) => m.id === 'mem-private')).toBe(false);
    expect(scrubbedExport.counts.works).toBeLessThan(fullExport.counts.works);
  });

  it('roundtrips export -> fresh database -> import cleanly', async () => {
    const exported = await exportVaultToJson(db);

    // Create a fresh clean database
    const freshDb = createDatabase({ filename: ':memory:' });
    runMigrations(freshDb);

    // Initial fresh count should be 0
    const countBefore = (freshDb.prepare('SELECT count(*) as c FROM works').get() as { c: number }).c;
    expect(countBefore).toBe(0);

    // Import into fresh database
    const summary = await importVaultFromJson(freshDb, exported);

    expect(summary.success).toBe(true);
    expect(summary.inserted.works).toBe(exported.counts.works);
    expect(summary.inserted.readingRelationships).toBe(exported.counts.readingRelationships);
    expect(summary.inserted.accessPaths).toBe(exported.counts.accessPaths);
    expect(summary.inserted.memories).toBe(exported.counts.memories);

    // Verify record counts in freshDb
    const worksAfter = (freshDb.prepare('SELECT count(*) as c FROM works').get() as { c: number }).c;
    expect(worksAfter).toBe(exported.counts.works);

    closeDatabase(freshDb);
  });
});
