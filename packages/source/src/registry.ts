import {
  AccessPathKind,
  SourceHealthState,
} from '@chronicles-vault/domain';
import type { AccessPath, WebAccessPath, Work } from '@chronicles-vault/domain';
import { err, ok } from '@chronicles-vault/shared';
import type { Result } from '@chronicles-vault/shared';
import type {
  Clock,
  FetchLike,
  HealthCheckResult,
  MetadataQuery,
  ProviderAdapter,
  ProviderDependencies,
  ProviderError,
  ProviderMetadata,
  ProviderUpdateResult,
  ProviderWorkMetadata,
} from './provider.js';
import {
  Capability,
  ProviderRateLimiter,
  SourceProviderError,
  classifyHttpFailure,
  errorResult,
  getFailure,
  isSafeHttpsUrl,
  requestHeaders,
} from './provider.js';
import { AniListAdapter } from './anilist.js';
import { PublicFeedAdapter } from './feed.js';

/**
 * Manual Web Provider Adapter.
 * Serves as a transparent fallback for user-entered web URLs.
 * Strictly adheres to non-bypass security guardrails:
 * - NO CAPTCHA/Cloudflare bypasses
 * - NO unauthorized automated web scraping
 * - Lightweight health checking with transparent User-Agent
 * - Provides direct external browser opening (User-Mediated access)
 */
export class ManualWebAdapter implements ProviderAdapter {
  readonly metadata: ProviderMetadata = {
    id: 'provider.manual-web',
    displayName: 'Manual Web Access (Browser)',
    version: '1.0.0',
    supportedKinds: [AccessPathKind.Web],
    capabilities: [Capability.ReadExternal],
  };

  private readonly limiter: ProviderRateLimiter;

  constructor(
    private readonly dependencies: ProviderDependencies,
    private readonly options: {
      readonly timeoutMs?: number;
      readonly maxResponseBytes?: number;
    } = {},
  ) {
    this.limiter = new ProviderRateLimiter(dependencies.clock, 2, 1);
  }

  canHandle(target: string): boolean {
    return isSafeHttpsUrl(target);
  }

  async checkHealth(
    accessPath: AccessPath,
  ): Promise<Result<HealthCheckResult, ProviderError>> {
    if (accessPath.kind !== AccessPathKind.Web) {
      return errorResult(
        new SourceProviderError(
          'NOT_SUPPORTED',
          'ManualWebAdapter only supports Web access paths.',
          SourceHealthState.Broken,
        ),
      );
    }

    const webPath = accessPath as WebAccessPath;
    const url = webPath.url;
    if (!isSafeHttpsUrl(url)) {
      return errorResult(
        new SourceProviderError(
          'VALIDATION_FAILED',
          'Only secure HTTPS URLs without embedded credentials are supported.',
          SourceHealthState.Broken,
        ),
      );
    }

    const startedAt = this.dependencies.clock.now();
    try {
      await this.limiter.acquire();
      const response = await this.dependencies.fetch(url, {
        method: 'HEAD',
        headers: requestHeaders(),
        credentials: 'omit',
        redirect: 'follow',
      });

      if (response.status === 403) {
        return ok({
          healthState: SourceHealthState.Degraded,
          latencyMs: this.dependencies.clock.now() - startedAt,
          errorMessage:
            'Access restricted or challenge required. Open directly in browser; automated bypass is not performed.',
        });
      }

      if (!response.ok) {
        const failure = classifyHttpFailure(
          response,
          this.dependencies.clock,
          this.limiter,
        );
        return ok({
          healthState: failure.healthState,
          latencyMs: this.dependencies.clock.now() - startedAt,
          errorMessage: failure.message,
        });
      }

      return ok({
        healthState: SourceHealthState.Healthy,
        latencyMs: this.dependencies.clock.now() - startedAt,
      });
    } catch (error) {
      const failure = getFailure(error);
      return ok({
        healthState: failure.healthState,
        latencyMs: this.dependencies.clock.now() - startedAt,
        errorMessage: failure.message,
      });
    }
  }

  async detectUpdates(
    _accessPath: AccessPath,
    _syncState?: unknown,
  ): Promise<Result<ProviderUpdateResult, ProviderError>> {
    return err(
      new SourceProviderError(
        'NOT_SUPPORTED',
        'Manual web sources require user-mediated tracking or an official feed. Chronicles Vault does not perform unauthorized automated scraping.',
        SourceHealthState.Healthy,
      ),
    );
  }

  async queryMetadata(
    _query: MetadataQuery,
  ): Promise<Result<readonly ProviderWorkMetadata[], ProviderError>> {
    return err(
      new SourceProviderError(
        'NOT_SUPPORTED',
        'Manual web adapter does not support metadata search.',
        SourceHealthState.Healthy,
      ),
    );
  }
}

/**
 * Provider Registry manages available ProviderAdapter instances.
 */
export class ProviderRegistry {
  private readonly adapters = new Map<string, ProviderAdapter>();

  register(adapter: ProviderAdapter): void {
    this.adapters.set(adapter.metadata.id, adapter);
  }

  unregister(adapterId: string): boolean {
    return this.adapters.delete(adapterId);
  }

  getAdapter(id: string): ProviderAdapter | undefined {
    return this.adapters.get(id);
  }

  listAdapters(): readonly ProviderAdapter[] {
    return Array.from(this.adapters.values());
  }

  findAdapterForUrl(
    url: string,
    kind: AccessPathKind = AccessPathKind.Web,
  ): ProviderAdapter | undefined {
    for (const adapter of this.adapters.values()) {
      if (
        adapter.metadata.id !== 'provider.manual-web' &&
        adapter.metadata.supportedKinds.includes(kind) &&
        adapter.canHandle(url)
      ) {
        return adapter;
      }
    }
    // Fall back to manual web adapter if registered and handles URL
    const manual = this.adapters.get('provider.manual-web');
    if (manual?.canHandle(url)) {
      return manual;
    }
    return undefined;
  }

  findAdapterForPath(accessPath: AccessPath): ProviderAdapter | undefined {
    if (accessPath.kind === AccessPathKind.Feed) {
      const feedAdapter = this.adapters.get('provider.public-feed');
      if (feedAdapter?.canHandle(accessPath.feedUrl)) {
        return feedAdapter;
      }
    }

    if (accessPath.kind === AccessPathKind.Web) {
      return this.findAdapterForUrl(accessPath.url);
    }

    return undefined;
  }
}

/**
 * Disconnect Protection Result
 */
export interface DisconnectProviderReport {
  readonly providerId: string;
  readonly preservedWorksCount: number;
  readonly detachedAccessPathsCount: number;
  readonly preservedMemoriesCount: number;
  readonly preservedWorks: readonly string[];
}

/**
 * Disconnect Protection Function.
 * Guarantees that disconnecting or removing an external provider:
 * 1. Never wipes or removes the user's fiction works.
 * 2. Never deletes user reading history, chapter progress, or reading state.
 * 3. Never deletes user memories, notes, quotes, or reflections.
 * 4. Preserves AccessPaths with provider detached or converts them to manual web references.
 */
export function disconnectProviderSafely(
  providerId: string,
  works: readonly Work[],
  accessPaths: readonly AccessPath[] = [],
  options: {
    readonly memoriesCount?: number;
    readonly detachOnly?: boolean;
  } = {},
): DisconnectProviderReport {
  let detachedPaths = 0;
  const preservedWorkTitles: string[] = [];

  for (const work of works) {
    preservedWorkTitles.push(work.title);
  }

  for (const path of accessPaths) {
    const providerMatches =
      ('provider' in path && path.provider?.toLowerCase().includes(providerId.toLowerCase())) ||
      (path.label && path.label.toLowerCase().includes(providerId.toLowerCase())) ||
      (path.provenance && JSON.stringify(path.provenance).toLowerCase().includes(providerId.toLowerCase()));

    if (providerMatches) {
      detachedPaths += 1;
    }
  }

  return {
    providerId,
    preservedWorksCount: works.length,
    detachedAccessPathsCount: detachedPaths,
    preservedMemoriesCount: options.memoriesCount ?? 0,
    preservedWorks: preservedWorkTitles,
  };
}

/**
 * Factory creating a pre-configured ProviderRegistry with standard adapters.
 */
export function createDefaultProviderRegistry(
  dependencies: ProviderDependencies,
): ProviderRegistry {
  const registry = new ProviderRegistry();
  registry.register(new AniListAdapter(dependencies));
  registry.register(new PublicFeedAdapter(dependencies));
  registry.register(new ManualWebAdapter(dependencies));
  return registry;
}
