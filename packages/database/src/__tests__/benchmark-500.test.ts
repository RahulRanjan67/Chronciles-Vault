/**
 * Cycle 13 — 500-Work Database & Vault Benchmark Suite
 *
 * Verifies all quantitative performance budgets in docs/PERFORMANCE.md §2
 * and docs/IMPLEMENTATION_PLAN.md Cycle 13 against a real better-sqlite3
 * database seeded with the 500-work medium benchmark dataset:
 *  - Benchmark-1 (Library Load): < 8ms target (< 100ms Cycle 13 gate)
 *  - Benchmark-2 (FTS5 Search):  < 12ms target (< 150ms Cycle 13 gate)
 *  - Benchmark-3 (Memory Timeline for 500-entry book): < 15ms target
 *  - Benchmark-4 (Vault Decrypt Burst — 50 AES-GCM items): < 45ms target
 */

import { describe, it, expect, beforeAll, afterAll } from 'vitest';
import { webcrypto } from 'node:crypto';
import type Database from 'better-sqlite3';
import {
  createDatabase,
  closeDatabase,
  WorkRepositoryImpl,
  MemoryRepositoryImpl,
  SearchRepositoryImpl,
  seedDatabase,
  mediumSeedConfig,
} from '../index.js';
import {
  MemoryType,
  PrivacyState,
  SpoilerLevel,
  type WorkId,
} from '@chronicles-vault/domain';
import { newId, type MemoryId } from '@chronicles-vault/shared';

describe('Cycle 13: 500-Work SQLite, FTS5 & Vault Benchmark Suite', () => {
  let db: Database.Database;
  let workRepo: WorkRepositoryImpl;
  let memoryRepo: MemoryRepositoryImpl;
  let searchRepo: SearchRepositoryImpl;
  let targetBookId: WorkId;

  beforeAll(() => {
    db = createDatabase({
      filename: ':memory:',
      runMigrations: true,
    });
    workRepo = new WorkRepositoryImpl(db);
    memoryRepo = new MemoryRepositoryImpl(db);
    searchRepo = new SearchRepositoryImpl(db);

    // Clear default seed if any and run the 500-work medium benchmark seed
    db.prepare('DELETE FROM update_entries').run();
    db.prepare('DELETE FROM captures').run();
    db.prepare('DELETE FROM capture_batches').run();
    db.prepare('DELETE FROM memories').run();
    db.prepare('DELETE FROM access_paths').run();
    db.prepare('DELETE FROM reading_relationships').run();
    db.prepare('DELETE FROM works').run();
    db.prepare('DELETE FROM search_fts').run();

    const stats = seedDatabase(db, mediumSeedConfig);
    expect(stats.worksCreated).toBe(500);

    // Pick the first work and add 500 chronological memory highlights to simulate a heavily annotated 500-page book
    const firstRow = db.prepare('SELECT id FROM works LIMIT 1').get() as { id: string };
    targetBookId = firstRow.id as WorkId;

    const insertMem = db.prepare(`
      INSERT INTO memories (
        id, work_id, type, title, body, privacy_state, spoiler_level,
        show_in_global_gallery, access_path_id, progress_anchor, created_at, updated_at
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    `);

    const baseTime = Date.now() - 500 * 60_000;
    const seed500Memories = db.transaction(() => {
      for (let i = 0; i < 500; i++) {
        const ts = new Date(baseTime + i * 60_000).toISOString();
        insertMem.run(
          newId() as MemoryId,
          targetBookId,
          MemoryType.Quote,
          `Page ${i + 1} Highlight`,
          `Cyberpunk matrix resonance note on page ${i + 1}: ontological boundary analysis.`,
          PrivacyState.Public,
          SpoilerLevel.SpoilerFree,
          1,
          null,
          JSON.stringify({ type: 'page', page: i + 1, totalPages: 500 }),
          ts,
          ts,
        );
      }
    });
    seed500Memories();
  });

  afterAll(() => {
    closeDatabase();
    try {
      db.close();
    } catch {
      // ignore
    }
  });

  it('Benchmark-1 (Library Load): loads top 50 active works from 500-work DB in < 8ms (and full 500 shelf in < 100ms)', async () => {
    // Warm query planner
    db.prepare('SELECT * FROM works WHERE deleted_at IS NULL ORDER BY updated_at DESC LIMIT 50').all();

    const t0 = performance.now();
    const top50 = db
      .prepare('SELECT * FROM works WHERE deleted_at IS NULL ORDER BY updated_at DESC LIMIT 50')
      .all();
    const top50Elapsed = performance.now() - t0;

    expect(top50.length).toBe(50);
    expect(top50Elapsed).toBeLessThan(8);

    const tFull0 = performance.now();
    const allSummaries = await workRepo.list({ limit: 500 });
    const fullElapsed = performance.now() - tFull0;

    expect(allSummaries.items.length).toBeGreaterThanOrEqual(450);
    expect(fullElapsed).toBeLessThan(100);
  });

  it('Benchmark-2 (FTS5 Search): executes full-text search across 500 works + memories in < 12ms (< 150ms gate)', async () => {
    // Warm FTS5 index
    db.prepare(
      "SELECT * FROM search_fts WHERE search_fts MATCH 'manga OR fantasy OR chapter' ORDER BY rank LIMIT 20",
    ).all();

    const t0 = performance.now();
    const rows = db
      .prepare(
        "SELECT * FROM search_fts WHERE search_fts MATCH 'manga OR fantasy OR chapter' ORDER BY rank LIMIT 20",
      )
      .all();
    const rawFtsElapsed = performance.now() - t0;

    expect(rows.length).toBeGreaterThan(0);
    expect(rawFtsElapsed).toBeLessThan(12);

    const tRepo0 = performance.now();
    const repoSearch = await searchRepo.search('fantasy', undefined, 20);
    const repoSearchElapsed = performance.now() - tRepo0;

    expect(repoSearch.matches.length).toBeGreaterThan(0);
    expect(repoSearchElapsed).toBeLessThan(150);
  });

  it('Benchmark-3 (Memory Timeline): aggregates 500+ chronological highlights for a single book in < 15ms', async () => {
    // Warm statement
    db.prepare('SELECT * FROM memories WHERE work_id = ? ORDER BY created_at ASC').all(targetBookId);

    const t0 = performance.now();
    const timelineRows = db
      .prepare('SELECT * FROM memories WHERE work_id = ? ORDER BY created_at ASC')
      .all(targetBookId);
    const elapsed = performance.now() - t0;

    expect(timelineRows.length).toBeGreaterThanOrEqual(500);
    expect(elapsed).toBeLessThan(15);

    const tHydrate0 = performance.now();
    const hydrated = await memoryRepo.listByWork(targetBookId, { limit: 600 });
    const hydrateElapsed = performance.now() - tHydrate0;

    expect(hydrated.length).toBeGreaterThanOrEqual(500);
    expect(hydrateElapsed).toBeLessThan(100);
  });

  it('Benchmark-4 (Vault Decrypt Burst): decrypts 50 AES-256-GCM vault memory quotes in < 45ms', async () => {
    const subtle = webcrypto.subtle;
    const key = await subtle.generateKey({ name: 'AES-GCM', length: 256 }, false, [
      'encrypt',
      'decrypt',
    ]);
    const encoder = new TextEncoder();
    const decoder = new TextDecoder();

    // Prepare 50 encrypted vault payloads
    const encryptedPayloads: Array<{ iv: Uint8Array; ciphertext: ArrayBuffer }> = [];
    for (let i = 0; i < 50; i++) {
      const iv = webcrypto.getRandomValues(new Uint8Array(12));
      const plaintext = encoder.encode(
        JSON.stringify({
          id: `vault-quote-${i}`,
          quote: `Encrypted private vault reflection #${i} — zero plaintext leakage verified.`,
        }),
      );
      const ciphertext = await subtle.encrypt({ name: 'AES-GCM', iv }, key, plaintext);
      encryptedPayloads.push({ iv, ciphertext });
    }

    // Measure burst decryption of all 50 items
    const t0 = performance.now();
    const decrypted = await Promise.all(
      encryptedPayloads.map(async ({ iv, ciphertext }) => {
        const plainBuf = await subtle.decrypt({ name: 'AES-GCM', iv }, key, ciphertext);
        return decoder.decode(plainBuf);
      }),
    );
    const elapsed = performance.now() - t0;

    expect(decrypted.length).toBe(50);
    expect(decrypted[0]).toContain('vault-quote-0');
    expect(elapsed).toBeLessThan(45);
  });
});
