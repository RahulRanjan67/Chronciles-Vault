import {
  AccessPathKind,
  SourceHealthState,
  UpdateCertainty,
} from '@chronicles-vault/domain';
import type { AccessPath, FeedAccessPath } from '@chronicles-vault/domain';
import { err, ok } from '@chronicles-vault/shared';
import type { ProviderAdapter, ProviderDependencies, ProviderMetadata, ProviderUpdateResult } from './provider.js';
import {
  Capability,
  DEFAULT_MAX_RESPONSE_BYTES,
  DEFAULT_TIMEOUT_MS,
  ProviderRateLimiter,
  SourceProviderError,
  classifyHttpFailure,
  errorResult,
  fetchBoundedText,
  getFailure,
  isSafeHttpsUrl,
  requestHeaders,
} from './provider.js';

export interface FeedSyncState {
  readonly etag?: string;
  readonly lastModified?: string;
}

interface ParsedFeedEntry {
  readonly title: string;
  readonly id: string;
  readonly url?: string;
  readonly publishedAt?: string;
}

export class PublicFeedAdapter implements ProviderAdapter {
  readonly metadata: ProviderMetadata = {
    id: 'provider.public-feed',
    displayName: 'User-supplied RSS/Atom Feed',
    version: '1.0.0',
    supportedKinds: [AccessPathKind.Feed],
    capabilities: [Capability.UpdateDetection],
  };

  private readonly limiter: ProviderRateLimiter;

  constructor(
    private readonly dependencies: ProviderDependencies,
    private readonly options: {
      readonly timeoutMs?: number;
      readonly maxResponseBytes?: number;
    } = {},
  ) {
    this.limiter = new ProviderRateLimiter(dependencies.clock, 1, 1 / 300);
  }

  canHandle(target: string): boolean {
    return isSafeHttpsUrl(target);
  }

  async checkHealth(accessPath: AccessPath): Promise<ReturnType<ProviderAdapter['checkHealth']> extends Promise<infer T> ? T : never> {
    const startedAt = this.dependencies.clock.now();
    let result: Awaited<ReturnType<PublicFeedAdapter['loadFeed']>>;
    try {
      result = await this.loadFeed(asFeedPath(accessPath), undefined);
    } catch (error) {
      result = { ok: false, error: getFailure(error) };
    }
    if (result.ok) {
      return ok({
        healthState: SourceHealthState.Healthy,
        latencyMs: this.dependencies.clock.now() - startedAt,
      });
    }
    return ok({
      healthState: result.error.healthState,
      latencyMs: this.dependencies.clock.now() - startedAt,
      errorMessage: result.error.message,
    });
  }

  async detectUpdates(
    accessPath: AccessPath,
    syncState?: unknown,
  ): Promise<ReturnType<ProviderAdapter['detectUpdates']> extends Promise<infer T> ? T : never> {
    let feed: FeedAccessPath;
    try {
      feed = asFeedPath(accessPath);
    } catch (error) {
      return errorResult(getFailure(error));
    }
    const state = parseSyncState(syncState);
    if (!state.ok) return errorResult(state.error);
    const result = await this.loadFeed(feed, state.value);
    if (!result.ok) return err(result.error);
    return ok(result.value);
  }

  async queryMetadata(): Promise<ReturnType<ProviderAdapter['queryMetadata']> extends Promise<infer T> ? T : never> {
    return err(
      new SourceProviderError(
        'NOT_SUPPORTED',
        'RSS/Atom feeds provide update notices, not catalog metadata.',
        SourceHealthState.Unknown,
      ),
    );
  }

  private async loadFeed(
    accessPath: FeedAccessPath,
    syncState: FeedSyncState | undefined,
  ): Promise<{ readonly ok: true; readonly value: ProviderUpdateResult } | { readonly ok: false; readonly error: ReturnType<typeof getFailure> }> {
    if (!isSafeHttpsUrl(accessPath.feedUrl)) {
      return {
        ok: false,
        error: new SourceProviderError(
          'VALIDATION_FAILED',
          'Feed URLs must use HTTPS and must not contain credentials.',
          SourceHealthState.Unknown,
        ),
      };
    }
    try {
      await this.limiter.acquire();
      const headers = requestHeaders({
        ...(syncState?.etag ? { 'If-None-Match': syncState.etag } : {}),
        ...(syncState?.lastModified ? { 'If-Modified-Since': syncState.lastModified } : {}),
      });
      const { response, text } = await fetchBoundedText(
        this.dependencies.fetch,
        accessPath.feedUrl,
        { method: 'GET', headers },
        this.options.timeoutMs ?? DEFAULT_TIMEOUT_MS,
        this.options.maxResponseBytes ?? DEFAULT_MAX_RESPONSE_BYTES,
      );
      if (response.status === 304) {
        return {
          ok: true,
          value: {
            updates: [],
            syncState: {
              ...(response.headers.get('etag') ?? syncState?.etag
                ? { etag: response.headers.get('etag') ?? syncState?.etag }
                : {}),
              ...(response.headers.get('last-modified') ?? syncState?.lastModified
                ? { lastModified: response.headers.get('last-modified') ?? syncState?.lastModified }
                : {}),
            } satisfies FeedSyncState,
          },
        };
      }
      if (!response.ok) {
        return {
          ok: false,
          error: classifyHttpFailure(response, this.dependencies.clock, this.limiter, 15 * 60 * 1000),
        };
      }
      const contentType = response.headers.get('content-type')?.toLowerCase() ?? '';
      if (contentType.includes('text/html') || contentType.includes('application/xhtml+xml')) {
        return {
          ok: false,
          error: new SourceProviderError(
            'SOURCE_DEGRADED',
            'The URL returned an HTML page, not an RSS/Atom feed. HTML pages are not scraped.',
            SourceHealthState.Degraded,
          ),
        };
      }
      const entries = parseFeed(text, accessPath.feedUrl);
      const detectedAt = new Date(this.dependencies.clock.now()).toISOString();
      const updates = entries.map((entry) => ({
        label: entry.title,
        certainty: UpdateCertainty.Confirmed,
        detectedAt,
        ...(entry.url ? { sourceUrl: entry.url } : {}),
        ...(entry.publishedAt ? { releaseDate: entry.publishedAt } : {}),
        ...(extractNumericIndex(entry.title) !== undefined
          ? { numericIndex: extractNumericIndex(entry.title) }
          : {}),
      }));
      return {
        ok: true,
        value: {
          updates,
          syncState: {
            ...(response.headers.get('etag') ? { etag: response.headers.get('etag')! } : {}),
            ...(response.headers.get('last-modified')
              ? { lastModified: response.headers.get('last-modified')! }
              : {}),
          } satisfies FeedSyncState,
        },
      };
    } catch (error) {
      return { ok: false, error: getFailure(error) };
    }
  }
}

function asFeedPath(accessPath: AccessPath): FeedAccessPath {
  if (accessPath.kind !== AccessPathKind.Feed) {
    throw new SourceProviderError(
      'VALIDATION_FAILED',
      'The public feed adapter requires a feed access path.',
      SourceHealthState.Unknown,
    );
  }
  return accessPath;
}

function parseSyncState(value: unknown):
  | { readonly ok: true; readonly value: FeedSyncState | undefined }
  | { readonly ok: false; readonly error: ReturnType<typeof getFailure> } {
  if (value === undefined || value === null) return { ok: true, value: undefined };
  if (typeof value !== 'object' || Array.isArray(value)) {
    return {
      ok: false,
      error: new SourceProviderError(
        'VALIDATION_FAILED',
        'Feed sync state must contain optional ETag and Last-Modified values.',
        SourceHealthState.Unknown,
      ),
    };
  }
  const state = value as Record<string, unknown>;
  if (
    (state.etag !== undefined && typeof state.etag !== 'string') ||
    (state.lastModified !== undefined && typeof state.lastModified !== 'string')
  ) {
    return {
      ok: false,
      error: new SourceProviderError(
        'VALIDATION_FAILED',
        'Feed sync state must contain optional ETag and Last-Modified values.',
        SourceHealthState.Unknown,
      ),
    };
  }
  return {
    ok: true,
    value: {
      ...(state.etag ? { etag: state.etag } : {}),
      ...(state.lastModified ? { lastModified: state.lastModified } : {}),
    },
  };
}

function parseFeed(xml: string, feedUrl: string): readonly ParsedFeedEntry[] {
  if (!xml.trim() || /<!DOCTYPE|<!ENTITY/i.test(xml)) {
    throw new SourceProviderError(
      'SOURCE_DEGRADED',
      'The feed is empty or uses unsupported XML declarations.',
      SourceHealthState.Degraded,
    );
  }
  const documentStart = xml
    .replace(/^\uFEFF/, '')
    .replace(/^\s*(?:<\?xml[^?]*\?>\s*)?/, '')
    .replace(/^(?:<!--[\s\S]*?-->\s*)+/, '');
  const root = documentStart.match(/^<(?:[\w.-]+:)?(rss|feed|RDF)\b/i)?.[1]?.toLowerCase();
  if (!root) {
    throw new SourceProviderError(
      'SOURCE_DEGRADED',
      'The response is not a supported RSS or Atom feed.',
      SourceHealthState.Degraded,
    );
  }
  const tagName = root === 'feed' ? 'entry' : 'item';
  const blocks = xml.match(new RegExp(`<((?:[\\w.-]+:)?${tagName})\\b[^>]*>[\\s\\S]*?<\\/\\1\\s*>`, 'gi'));
  if (!blocks) {
    const hasOpen = new RegExp(`<(?:(?:[\\w.-]+):)?${tagName}\\b`, 'i').test(xml);
    if (hasOpen) {
      throw new SourceProviderError('SOURCE_DEGRADED', 'The feed contains malformed entries.', SourceHealthState.Degraded);
    }
    return [];
  }
  return blocks
    .map((block) => {
      const title = childText(block, 'title');
      const id = childText(block, root === 'feed' ? 'id' : 'guid');
      const link = root === 'feed' ? atomLink(block) : childText(block, 'link');
      const publishedAt =
        childText(block, 'published') || childText(block, 'updated') || childText(block, 'pubDate');
      if (!title) {
        throw new SourceProviderError(
          'SOURCE_DEGRADED',
          'The feed contains an entry without a title.',
          SourceHealthState.Degraded,
        );
      }
      const resolvedUrl = resolveEntryUrl(link, feedUrl);
      const validDate = publishedAt && Number.isFinite(Date.parse(publishedAt))
        ? new Date(publishedAt).toISOString()
        : undefined;
      return {
        title,
        id: id || resolvedUrl || title,
        ...(resolvedUrl ? { url: resolvedUrl } : {}),
        ...(validDate ? { publishedAt: validDate } : {}),
      };
    })
    .filter((entry) => Boolean(entry.id));
}

function childText(block: string, name: string): string {
  const match = block.match(
    new RegExp(`<(?:(?:[\\w.-]+):)?${name}\\b[^>]*>([\\s\\S]*?)<\\/(?:(?:[\\w.-]+):)?${name}\\s*>`, 'i'),
  );
  if (!match) return '';
  return decodeXml(match[1].replace(/<!\[CDATA\[([\s\S]*?)\]\]>/g, '$1').replace(/<[^>]*>/g, ' ')).trim();
}

function atomLink(block: string): string {
  const links = block.match(/<(?:[\w.-]+:)?link\b[^>]*\/?>/gi) ?? [];
  const selected =
    links.find((link) => !/\brel\s*=\s*["'](?:self|enclosure)["']/i.test(link)) ?? links[0];
  return selected?.match(/\bhref\s*=\s*(["'])(.*?)\1/i)?.[2] ?? '';
}

function decodeXml(value: string): string {
  if (/&(?!(?:amp|lt|gt|quot|apos|#\d+|#x[\da-f]+);)/i.test(value)) {
    throw new SourceProviderError(
      'SOURCE_DEGRADED',
      'The feed contains invalid XML entities.',
      SourceHealthState.Degraded,
    );
  }
  return value.replace(/&(#x[\da-f]+|#\d+|amp|lt|gt|quot|apos);/gi, (entity, code: string) => {
    if (code[0] === '#') {
      const value = code[1].toLowerCase() === 'x' ? Number.parseInt(code.slice(2), 16) : Number(code.slice(1));
      try {
        return String.fromCodePoint(value);
      } catch {
        throw new SourceProviderError(
          'SOURCE_DEGRADED',
          'The feed contains an invalid XML character reference.',
          SourceHealthState.Degraded,
        );
      }
    }
    return { amp: '&', lt: '<', gt: '>', quot: '"', apos: "'" }[code.toLowerCase()] ?? entity;
  });
}

function resolveEntryUrl(link: string, base: string): string | undefined {
  if (!link) return undefined;
  try {
    const url = new URL(link, base);
    return ['https:', 'http:'].includes(url.protocol) ? url.toString() : undefined;
  } catch {
    return undefined;
  }
}

function extractNumericIndex(title: string): number | undefined {
  const match = title.match(/\b(?:chapter|ch\.?|episode|ep\.?)\s*(\d+(?:\.\d+)?)/i);
  if (!match) return undefined;
  const index = Number(match[1]);
  return Number.isFinite(index) ? index : undefined;
}
