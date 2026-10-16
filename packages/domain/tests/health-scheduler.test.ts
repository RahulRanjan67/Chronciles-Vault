import { describe, it } from 'node:test';
import assert from 'node:assert/strict';
import {
  SourceHealth,
  AccessPathKind,
  AccessCapability,
  type WebAccessPath,
  type LocalFileAccessPath,
  applyHealthCheckResult,
  isEligibleForHealthCheck,
  HealthScheduler,
  createHealthMonitorState,
  type HealthProbeFn,
} from '../dist/index.js';
import type { AccessPathId, WorkId } from '@chronicles-vault/shared';

function createMockWebPath(id: string = 'path-1', health: SourceHealth = SourceHealth.Healthy): WebAccessPath {
  return {
    id: id as AccessPathId,
    workId: 'work-1' as WorkId,
    kind: AccessPathKind.Web,
    url: 'https://example.com/fiction/1',
    provider: 'ExampleProvider',
    label: 'Example Source',
    isPreferred: true,
    health,
    healthState: health,
    capabilities: [AccessCapability.Read, AccessCapability.Updates],
    lastCheckedAt: null,
    lastOpenedAt: null,
    provenance: null,
    createdAt: '2026-10-05T00:00:00.000Z',
    updatedAt: '2026-10-05T00:00:00.000Z',
  };
}

function createMockLocalPath(id: string = 'path-local'): LocalFileAccessPath {
  return {
    id: id as AccessPathId,
    workId: 'work-1' as WorkId,
    kind: AccessPathKind.LocalFile,
    filePath: '/books/fiction.epub',
    fileId: 'file-1',
    format: 'epub',
    label: 'Local EPUB',
    isPreferred: false,
    health: SourceHealth.Local,
    healthState: SourceHealth.Local,
    capabilities: [AccessCapability.Read],
    lastCheckedAt: null,
    lastOpenedAt: null,
    provenance: null,
    createdAt: '2026-10-05T00:00:00.000Z',
    updatedAt: '2026-10-05T00:00:00.000Z',
  };
}

describe('Health Scheduler & Resilience Use Cases', () => {
  describe('applyHealthCheckResult', () => {
    it('transitions to Healthy on successful probe and updates timestamps', () => {
      const path = createMockWebPath('path-1', SourceHealth.Degraded);
      const checkedAt = '2026-10-05T12:00:00.000Z';
      const { updatedPath, monitorState } = applyHealthCheckResult(
        path,
        { ok: true, status: 200 },
        checkedAt,
      );

      assert.equal(updatedPath.health, SourceHealth.Healthy);
      assert.equal(updatedPath.healthState, SourceHealth.Healthy);
      assert.equal(updatedPath.lastCheckedAt, checkedAt);
      assert.equal(monitorState.consecutiveFailures, 0);
      assert.equal(monitorState.autoPollingSuspended, false);
      assert.equal(monitorState.lastSuccessfulAt, checkedAt);
    });

    it('transitions to Degraded after 3 failures and sets backoff with jitter', () => {
      let path = createMockWebPath('path-1', SourceHealth.Healthy);
      const fixedRandom = () => 0.5; // midpoint jitter

      for (let i = 1; i <= 3; i++) {
        const time = `2026-10-05T12:0${i}:00.000Z`;
        const { updatedPath } = applyHealthCheckResult(
          path,
          { ok: false, errorMessage: 'Timeout' },
          time,
          fixedRandom,
        );
        path = updatedPath as WebAccessPath;
      }

      assert.equal(path.health, SourceHealth.Degraded);
      assert.equal(path.healthMonitorState?.consecutiveFailures, 3);
      assert.equal(path.healthMonitorState?.autoPollingSuspended, false);
      assert.ok(path.healthMonitorState?.nextCheckAt);
    });

    it('suspends auto-polling and sets Broken after 5 consecutive failures', () => {
      let path = createMockWebPath('path-1', SourceHealth.Healthy);
      const fixedRandom = () => 0.5;

      for (let i = 1; i <= 5; i++) {
        const time = `2026-10-05T12:0${i}:00.000Z`;
        const { updatedPath } = applyHealthCheckResult(
          path,
          { ok: false, errorMessage: '500 Internal Server Error' },
          time,
          fixedRandom,
        );
        path = updatedPath as WebAccessPath;
      }

      assert.equal(path.health, SourceHealth.Broken);
      assert.equal(path.healthMonitorState?.consecutiveFailures, 5);
      assert.equal(path.healthMonitorState?.autoPollingSuspended, true);
      assert.equal(path.healthMonitorState?.nextCheckAt, null);
    });
  });

  describe('isEligibleForHealthCheck', () => {
    it('returns false for local files and manual references', () => {
      const local = createMockLocalPath();
      assert.equal(isEligibleForHealthCheck(local), false);
    });

    it('returns false when auto-polling is suspended', () => {
      const path = {
        ...createMockWebPath(),
        health: SourceHealth.Broken,
        healthMonitorState: {
          ...createHealthMonitorState(SourceHealth.Broken),
          autoPollingSuspended: true,
        },
      };
      assert.equal(isEligibleForHealthCheck(path), false);
    });

    it('respects future nextCheckAt backoff time', () => {
      const path = {
        ...createMockWebPath(),
        healthMonitorState: {
          ...createHealthMonitorState(),
          nextCheckAt: '2026-10-05T13:00:00.000Z',
        },
      };

      // Checking before nextCheckAt -> ineligible
      assert.equal(isEligibleForHealthCheck(path, '2026-10-05T12:30:00.000Z'), false);
      // Checking at or after nextCheckAt -> eligible
      assert.equal(isEligibleForHealthCheck(path, '2026-10-05T13:00:00.000Z'), true);
      assert.equal(isEligibleForHealthCheck(path, '2026-10-05T13:05:00.000Z'), true);
    });
  });

  describe('HealthScheduler', () => {
    it('registers, runs checks on tick, and triggers onHealthChange', async () => {
      const path = createMockWebPath('path-test');
      const updates: any[] = [];

      const mockProbe: HealthProbeFn = async (_p, _sig, headers) => {
        return {
          ok: true,
          status: 200,
          etag: '"etag-123"',
          lastModified: 'Mon, 05 Oct 2026 12:00:00 GMT',
        };
      };

      const scheduler = new HealthScheduler({
        probe: mockProbe,
        onHealthChange: (outcome) => updates.push(outcome),
      });

      scheduler.register(path);
      assert.equal(scheduler.getRegisteredCount(), 1);

      const outcomes = await scheduler.tick('2026-10-05T12:00:00.000Z');
      assert.equal(outcomes.length, 1);
      assert.equal(outcomes[0].path.health, SourceHealth.Healthy);
      assert.equal(updates.length, 1);

      // Validators carried forward
      const validators = scheduler.getValidators(path.id);
      assert.equal(validators?.etag, '"etag-123"');
    });

    it('supports on-demand checkNow with updated state', async () => {
      const path = createMockWebPath('path-manual', SourceHealth.Unknown);

      const mockProbe: HealthProbeFn = async () => ({
        ok: true,
        status: 200,
      });

      const scheduler = new HealthScheduler({ probe: mockProbe });
      scheduler.register(path);

      const outcome = await scheduler.checkNow(path.id);
      assert.ok(outcome);
      assert.equal(outcome.path.health, SourceHealth.Healthy);
      assert.equal(outcome.previousState.health, SourceHealth.Unknown);
      assert.equal(outcome.newState.health, SourceHealth.Healthy);
    });

    it('cancels in-flight probe via AbortController', async () => {
      const path = createMockWebPath('path-slow');
      let wasAborted = false;

      const slowProbe: HealthProbeFn = async (_p, signal) => {
        return new Promise((resolve) => {
          signal.addEventListener('abort', () => {
            wasAborted = true;
            resolve({ ok: false, errorMessage: 'aborted' });
          });
        });
      };

      const scheduler = new HealthScheduler({ probe: slowProbe });
      scheduler.register(path);

      // Start check in background
      const checkPromise = scheduler.checkNow(path.id);
      assert.equal(scheduler.getActiveCheckCount(), 1);

      // Cancel check
      scheduler.cancel(path.id);
      assert.equal(scheduler.getActiveCheckCount(), 0);

      const result = await checkPromise;
      assert.equal(wasAborted, true);
      assert.ok(result);
      assert.equal(result.probeResult.ok, false);
    });

    it('stops scheduler and cancels all active checks cleanly', () => {
      const scheduler = new HealthScheduler({
        probe: async () => ({ ok: true }),
      });
      scheduler.register(createMockWebPath('p1'));
      scheduler.register(createMockWebPath('p2'));

      scheduler.start();
      scheduler.stop();
      assert.equal(scheduler.getActiveCheckCount(), 0);
    });
  });
});
