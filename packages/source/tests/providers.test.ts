import { AccessPathKind } from '@chronicles-vault/domain';
import type { AccessPath, FeedAccessPath } from '@chronicles-vault/domain';
import { describe, expect, it, vi } from 'vitest';
import { AniListAdapter } from '../src/anilist.js';
import { PublicFeedAdapter } from '../src/feed.js';
import type { Clock, FetchLike } from '../src/provider.js';
import { USER_AGENT } from '../src/provider.js';

const FEED_URL = 'https://publisher.example/updates.xml';
const feedPath = {
  kind: AccessPathKind.Feed,
  feedUrl: FEED_URL,
} as FeedAccessPath as AccessPath;
const webPath = { kind: AccessPathKind.Web, url: 'https://anilist.co/manga/1' } as AccessPath;

function makeClock() {
  let current = Date.parse('2026-10-05T00:00:00.000Z');
  const clock: Clock = {
    now: () => current,
    sleep: async (milliseconds) => {
      current += milliseconds;
    },
  };
  return clock;
}

function deps(fetch: FetchLike, clock = makeClock()) {
  return { fetch, clock };
}

function feedResponse(body: string, headers?: HeadersInit): Response {
  return new Response(body, {
    status: 200,
    headers: { 'content-type': 'application/rss+xml', ...Object.fromEntries(new Headers(headers)) },
  });
}

describe('AniList public metadata provider', () => {
  it('queries official unauthenticated GraphQL metadata with a transparent User-Agent', async () => {
    const fetch = vi.fn<FetchLike>().mockResolvedValue(
      new Response(
        JSON.stringify({
          data: {
            Page: {
              media: [
                {
                  id: 7,
                  title: { romaji: 'Story', english: 'The Story' },
                  description: '<b>Public</b> description',
                  coverImage: { large: 'https://s4.anilist.co/file.jpg' },
                  genres: ['Drama'],
                  format: 'MANGA',
                  siteUrl: 'https://anilist.co/manga/7',
                  staff: { edges: [{ role: 'Story', node: { name: { full: 'Writer' } } }] },
                },
              ],
            },
          },
        }),
        { status: 200 },
      ),
    );
    const adapter = new AniListAdapter(deps(fetch));

    const result = await adapter.queryMetadata({ title: ' Story ' });

    expect(result.ok).toBe(true);
    if (!result.ok) return;
    expect(result.value[0]).toMatchObject({
      providerItemId: '7',
      title: 'Story',
      alternateTitle: 'The Story',
      synopsis: 'Public description',
      authors: ['Writer'],
      tags: ['Drama'],
    });
    const init = fetch.mock.calls[0][1]!;
    expect(new Headers(init.headers).get('user-agent')).toBe(USER_AGENT);
    expect(new Headers(init.headers).has('authorization')).toBe(false);
    expect(String(init.body)).toContain('"search":"Story"');
  });
});

describe('public RSS/Atom provider', () => {
  it('parses RSS updates and returns conditional request state', async () => {
    const fetch = vi.fn<FetchLike>().mockResolvedValue(
      feedResponse(
        '<rss version="2.0"><channel><item><title>Chapter 12: Return</title><link>/chapter/12</link><guid>item-12</guid><pubDate>Sun, 04 Oct 2026 00:00:00 GMT</pubDate></item></channel></rss>',
        { etag: '"v1"', 'last-modified': 'Sun, 04 Oct 2026 00:00:00 GMT' },
      ),
    );
    const result = await new PublicFeedAdapter(deps(fetch)).detectUpdates(feedPath);

    expect(result.ok).toBe(true);
    if (!result.ok) return;
    expect(result.value.updates[0]).toMatchObject({
      label: 'Chapter 12: Return',
      numericIndex: 12,
      sourceUrl: 'https://publisher.example/chapter/12',
      certainty: 'confirmed',
    });
    expect(result.value.syncState).toEqual({
      etag: '"v1"',
      lastModified: 'Sun, 04 Oct 2026 00:00:00 GMT',
    });
    expect(new Headers(fetch.mock.calls[0][1]?.headers).get('user-agent')).toBe(USER_AGENT);
    expect(fetch.mock.calls[0][1]?.credentials).toBe('omit');
  });

  it('parses Atom entries without loading or scraping HTML pages', async () => {
    const fetch = vi.fn<FetchLike>().mockResolvedValue(
      feedResponse(
        '<feed xmlns="http://www.w3.org/2005/Atom"><entry><id>atom-1</id><title>Episode 3</title><link rel="alternate" href="https://publisher.example/ep/3"/><updated>2026-10-04T12:00:00Z</updated></entry></feed>',
        { 'content-type': 'application/atom+xml' },
      ),
    );
    const adapter = new PublicFeedAdapter(deps(fetch));
    const atom = await adapter.detectUpdates(feedPath);
    expect(atom.ok).toBe(true);
    if (atom.ok) expect(atom.value.updates[0]).toMatchObject({ label: 'Episode 3', numericIndex: 3 });

    const html = new PublicFeedAdapter(
      deps(
        vi.fn<FetchLike>().mockResolvedValue(
          new Response('<html><body><rss>not a feed</rss></body></html>', {
            status: 200,
            headers: { 'content-type': 'text/html' },
          }),
        ),
      ),
    );
    const scraped = await html.detectUpdates(feedPath);
    expect(scraped.ok).toBe(false);
    if (!scraped.ok) expect(scraped.error.message).toContain('HTML pages are not scraped');
  });

  it('sends validators and returns no updates for 304 responses', async () => {
    const fetch = vi.fn<FetchLike>().mockResolvedValue(
      new Response(null, { status: 304, headers: { etag: '"v1"' } }),
    );
    const adapter = new PublicFeedAdapter(deps(fetch));
    const result = await adapter.detectUpdates(feedPath, {
      etag: '"v1"',
      lastModified: 'Sun, 04 Oct 2026 00:00:00 GMT',
    });

    expect(result.ok).toBe(true);
    if (!result.ok) return;
    expect(result.value.updates).toEqual([]);
    expect(result.value.syncState).toEqual({
      etag: '"v1"',
      lastModified: 'Sun, 04 Oct 2026 00:00:00 GMT',
    });
    const headers = new Headers(fetch.mock.calls[0][1]?.headers);
    expect(headers.get('if-none-match')).toBe('"v1"');
    expect(headers.get('if-modified-since')).toBe('Sun, 04 Oct 2026 00:00:00 GMT');
  });

  it('reports rate limiting and pauses retries using Retry-After', async () => {
    const fetch = vi.fn<FetchLike>().mockResolvedValue(
      new Response('', { status: 429, headers: { 'retry-after': '60' } }),
    );
    const clock = makeClock();
    const adapter = new PublicFeedAdapter(deps(fetch, clock));
    const result = await adapter.detectUpdates(feedPath);

    expect(result.ok).toBe(false);
    if (result.ok) return;
    expect(result.error.code).toBe('RATE_LIMITED');
    expect(result.error.retryAfterMs).toBe(60_000);
  });

  it('throttles feed requests to one poll per five minutes', async () => {
    const fetch = vi
      .fn<FetchLike>()
      .mockResolvedValueOnce(feedResponse('<rss><channel/></rss>'))
      .mockResolvedValueOnce(feedResponse('<rss><channel/></rss>'));
    const clock = makeClock();
    const adapter = new PublicFeedAdapter(deps(fetch, clock));

    await adapter.detectUpdates(feedPath);
    await adapter.detectUpdates(feedPath);

    expect(fetch).toHaveBeenCalledTimes(2);
    expect(clock.now()).toBe(Date.parse('2026-10-05T00:05:00.000Z'));
  });

  it('returns visible degraded health for 403 challenges and network errors', async () => {
    const denied = new PublicFeedAdapter(
      deps(vi.fn<FetchLike>().mockResolvedValue(new Response('', { status: 403 }))),
    );
    const health = await denied.checkHealth(feedPath);
    expect(health.ok).toBe(true);
    if (health.ok) expect(health.value.healthState).toBe('degraded');

    const offline = new PublicFeedAdapter(
      deps(vi.fn<FetchLike>().mockRejectedValue(new TypeError('network down'))),
    );
    const result = await offline.detectUpdates(feedPath);
    expect(result.ok).toBe(false);
    if (!result.ok) {
      expect(result.error.healthState).toBe('degraded');
      expect(result.error.message).toContain('could not be reached');
    }
  });

  it('rejects malformed XML and oversized responses', async () => {
    const malformed = new PublicFeedAdapter(
      deps(vi.fn<FetchLike>().mockResolvedValue(feedResponse('<rss><item><title>Missing close'))),
    );
    const badXml = await malformed.detectUpdates(feedPath);
    expect(badXml.ok).toBe(false);

    const oversized = new PublicFeedAdapter(
      deps(
        vi.fn<FetchLike>().mockResolvedValue(
          feedResponse('<rss/>', { 'content-length': '100' }),
        ),
        makeClock(),
      ),
      { maxResponseBytes: 10 },
    );
    const tooLarge = await oversized.detectUpdates(feedPath);
    expect(tooLarge.ok).toBe(false);
    if (!tooLarge.ok) expect(tooLarge.error.message).toContain('size limit');
  });

  it('rejects feed URLs with credentials', async () => {
    const fetch = vi.fn<FetchLike>();
    const adapter = new PublicFeedAdapter(deps(fetch));
    const result = await adapter.detectUpdates({ ...feedPath, feedUrl: 'https://reader:secret@publisher.example/feed' });
    expect(result.ok).toBe(false);
    expect(fetch).not.toHaveBeenCalled();
  });
});
