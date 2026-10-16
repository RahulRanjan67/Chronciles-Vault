import {
  AccessPathKind,
  ContentFormat,
  OriginClassification,
  PublicationStatus,
  ReadingState,
  SourceHealthState,
  Work,
} from '@chronicles-vault/domain';
import type { AccessPath, WebAccessPath } from '@chronicles-vault/domain';
import { describe, expect, it, vi } from 'vitest';
import {
  ManualWebAdapter,
  ProviderRegistry,
  createDefaultProviderRegistry,
  disconnectProviderSafely,
} from '../src/registry.js';
import type { Clock, FetchLike } from '../src/provider.js';

function makeClock() {
  let current = Date.parse('2026-10-05T00:00:00.000Z');
  const clock: Clock = {
    now: () => current,
    sleep: async (ms) => {
      current += ms;
    },
  };
  return clock;
}

function deps(fetch: FetchLike, clock = makeClock()) {
  return { fetch, clock };
}

describe('ManualWebAdapter', () => {
  it('identifies as manual web adapter with ReadExternal capability and no automated bypasses', () => {
    const adapter = new ManualWebAdapter(deps(vi.fn()));
    expect(adapter.metadata.id).toBe('provider.manual-web');
    expect(adapter.metadata.capabilities).toContain('read_external');
    expect(adapter.canHandle('https://example.com/novel/chapter-1')).toBe(true);
    expect(adapter.canHandle('http://insecure.example.com')).toBe(false);
  });

  it('reports healthy on successful HEAD ping', async () => {
    const fetch = vi.fn<FetchLike>().mockResolvedValue(new Response('', { status: 200 }));
    const adapter = new ManualWebAdapter(deps(fetch));
    const path: WebAccessPath = {
      id: 'p1' as any,
      workId: 'w1' as any,
      kind: AccessPathKind.Web,
      label: 'Web Source',
      provider: null,
      isPreferred: true,
      url: 'https://example.com/novel',
      health: SourceHealthState.Healthy,
      healthState: SourceHealthState.Healthy,
      capabilities: [],
      lastCheckedAt: null,
      lastOpenedAt: null,
      provenance: null,
      createdAt: '2026-10-05T00:00:00Z',
      updatedAt: '2026-10-05T00:00:00Z',
    };

    const result = await adapter.checkHealth(path);
    expect(result.ok).toBe(true);
    if (result.ok) {
      expect(result.value.healthState).toBe(SourceHealthState.Healthy);
    }
  });

  it('marks Degraded on 403 challenge without attempting bypass', async () => {
    const fetch = vi.fn<FetchLike>().mockResolvedValue(new Response('', { status: 403 }));
    const adapter = new ManualWebAdapter(deps(fetch));
    const path: WebAccessPath = {
      id: 'p1' as any,
      workId: 'w1' as any,
      kind: AccessPathKind.Web,
      label: 'Protected Source',
      provider: null,
      isPreferred: true,
      url: 'https://protected.example/novel',
      health: SourceHealthState.Healthy,
      healthState: SourceHealthState.Healthy,
      capabilities: [],
      lastCheckedAt: null,
      lastOpenedAt: null,
      provenance: null,
      createdAt: '2026-10-05T00:00:00Z',
      updatedAt: '2026-10-05T00:00:00Z',
    };

    const result = await adapter.checkHealth(path);
    expect(result.ok).toBe(true);
    if (result.ok) {
      expect(result.value.healthState).toBe(SourceHealthState.Degraded);
      expect(result.value.errorMessage).toContain('automated bypass is not performed');
    }
  });

  it('rejects automated update detection, requiring official feeds or manual progress', async () => {
    const adapter = new ManualWebAdapter(deps(vi.fn()));
    const path = { kind: AccessPathKind.Web, url: 'https://example.com' } as AccessPath;
    const result = await adapter.detectUpdates(path);
    expect(result.ok).toBe(false);
    if (!result.ok) {
      expect(result.error.code).toBe('NOT_SUPPORTED');
    }
  });
});

describe('ProviderRegistry', () => {
  it('registers and retrieves adapters, falling back to manual web adapter', () => {
    const registry = createDefaultProviderRegistry(deps(vi.fn()));
    expect(registry.listAdapters().length).toBe(3);

    const anilist = registry.findAdapterForUrl('https://anilist.co/manga/123');
    expect(anilist?.metadata.id).toBe('provider.anilist');

    const feed = registry.findAdapterForPath({
      kind: AccessPathKind.Feed,
      feedUrl: 'https://publisher.example/feed.xml',
    } as AccessPath);
    expect(feed?.metadata.id).toBe('provider.public-feed');

    const manual = registry.findAdapterForUrl('https://some-web-novel.example/c1');
    expect(manual?.metadata.id).toBe('provider.manual-web');
  });
});

describe('Disconnect Protection', () => {
  it('disconnecting a provider never wipes works or reading progress', () => {
    const mockWork: Work = {
      id: 'work-1' as any,
      title: 'Tower of God',
      alternativeTitles: [],
      aliases: [],
      description: 'Fantasy webtoon',
      contentType: 'webtoon' as any,
      origin: 'korean' as any,
      publicationState: 'ongoing' as any,
      privacyState: 'public' as any,
      coverRef: null,
      externalIds: [],
      genres: ['Fantasy'],
      tags: [],
      createdAt: '2026-10-05T00:00:00Z',
      updatedAt: '2026-10-05T00:00:00Z',
      deletedAt: null,
    };

    const mockPaths: AccessPath[] = [
      {
        id: 'path-1' as any,
        workId: 'work-1' as any,
        kind: AccessPathKind.Web,
        label: 'AniList Source',
        provider: 'provider.anilist',
        isPreferred: true,
        url: 'https://anilist.co/manga/1',
        health: SourceHealthState.Healthy,
        healthState: SourceHealthState.Healthy,
        capabilities: [],
        lastCheckedAt: null,
        lastOpenedAt: null,
        provenance: null,
        createdAt: '2026-10-05T00:00:00Z',
        updatedAt: '2026-10-05T00:00:00Z',
      },
    ];

    const report = disconnectProviderSafely(
      'provider.anilist',
      [mockWork],
      mockPaths,
      {
        memoriesCount: 5,
      },
    );

    expect(report.preservedWorksCount).toBe(1);
    expect(report.preservedMemoriesCount).toBe(5);
    expect(report.detachedAccessPathsCount).toBe(1);
    expect(report.preservedWorks).toContain('Tower of God');
  });
});
