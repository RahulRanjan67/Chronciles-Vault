/**
 * Medium Seed Configuration (500 Works).
 *
 * Full production-like benchmark dataset matching the exact specification:
 * - 500 Works
 * - Reading distribution: 200 reading, 70 planned, 65 waiting, 55 stalled, 40 completed, 35 dropped, 35 rereading
 * - Content types: Manga 40%, Manhwa 25%, Light Novel 15%, Anime 10%, Other 10%
 * - ~500+ access paths with ~5% broken/degraded sources
 * - ~300 memories
 * - ~100 captures across multiple batches
 * - ~100 update records
 * - Realistic duplicates and private/vault items
 */

import type { SeedConfig } from './generator.js';

export const mediumSeedConfig: SeedConfig = {
  name: 'medium',
  workCount: 500,
  stateCounts: {
    reading: 200,
    planned: 70,
    waiting: 65,
    stalled: 55,
    completed: 40,
    dropped: 35,
    rereading: 35,
  },
  contentTypeRatios: {
    manga: 0.4,
    manhwa: 0.25,
    light_novel: 0.15,
    anime: 0.1,
    other: 0.1,
  },
  memoryCount: 300,
  captureCount: 100,
  updateCount: 100,
  privateRatio: 0.05,
  brokenSourceRatio: 0.06,
  seed: 987654321,
};
