/**
 * Small Seed Configuration (50 Works).
 *
 * Fast dataset for unit/integration tests and quick local development.
 */

import type { SeedConfig } from './generator.js';

export const smallSeedConfig: SeedConfig = {
  name: 'small',
  workCount: 50,
  stateCounts: {
    reading: 20,
    planned: 8,
    waiting: 7,
    stalled: 5,
    completed: 4,
    dropped: 3,
    rereading: 3,
  },
  contentTypeRatios: {
    manga: 0.4,
    manhwa: 0.25,
    light_novel: 0.15,
    anime: 0.1,
    other: 0.1,
  },
  memoryCount: 30,
  captureCount: 15,
  updateCount: 15,
  privateRatio: 0.05,
  brokenSourceRatio: 0.06,
  seed: 12345,
};
