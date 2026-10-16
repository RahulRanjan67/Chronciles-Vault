import {
  AccessPathKind,
  SourceHealthState,
  UpdateCertainty,
} from '@chronicles-vault/domain';
import { err, ok } from '@chronicles-vault/shared';
import type { AccessPath } from '@chronicles-vault/domain';
import type {
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
  DEFAULT_MAX_RESPONSE_BYTES,
  DEFAULT_TIMEOUT_MS,
  ProviderRateLimiter,
  SourceProviderError,
  classifyHttpFailure,
  errorResult,
  fetchBoundedText,
  getFailure,
  requestHeaders,
} from './provider.js';

const ANILIST_API = 'https://graphql.anilist.co';
const SEARCH_QUERY = `
  query SearchPublicMetadata($search: String!, $perPage: Int!) {
    Page(perPage: $perPage) {
      media(search: $search, type: MANGA) {
        id
        title { romaji english native }
        description(asHtml: false)
        coverImage { large }
        genres
        format
        siteUrl
        staff(perPage: 10, sort: [RELEVANCE, ID]) {
          edges { role node { name { full } } }
        }
      }
    }
  }
`;
const HEALTH_QUERY = '{ Media(id: 1, type: MANGA) { id } }';

interface AniListMedia {
  readonly id: number;
  readonly title?: { readonly romaji?: string | null; readonly english?: string | null; readonly native?: string | null } | null;
  readonly description?: string | null;
  readonly coverImage?: { readonly large?: string | null } | null;
  readonly genres?: readonly string[] | null;
  readonly format?: string | null;
  readonly siteUrl?: string | null;
  readonly staff?: {
    readonly edges?: readonly { readonly role?: string; readonly node?: { readonly name?: { readonly full?: string } } }[];
  } | null;
}

export class AniListAdapter implements ProviderAdapter {
  readonly metadata: ProviderMetadata = {
    id: 'provider.anilist',
    displayName: 'AniList Public Metadata',
    version: '1.0.0',
    supportedKinds: [AccessPathKind.Web],
    capabilities: [Capability.MetadataQuery],
  };

  private readonly limiter: ProviderRateLimiter;

  constructor(
    private readonly dependencies: ProviderDependencies,
    private readonly options: {
      readonly timeoutMs?: number;
      readonly maxResponseBytes?: number;
    } = {},
  ) {
    this.limiter = new ProviderRateLimiter(dependencies.clock, 5, 2);
  }

  canHandle(target: string): boolean {
    try {
      const url = new URL(target);
      return (
        url.protocol === 'https:' &&
        !url.username &&
        !url.password &&
        ['anilist.co', 'graphql.anilist.co'].includes(url.hostname)
      );
    } catch {
      return false;
    }
  }

  async checkHealth(_accessPath: AccessPath): Promise<ReturnType<ProviderAdapter['checkHealth']> extends Promise<infer T> ? T : never> {
    const startedAt = this.dependencies.clock.now();
    try {
      const response = await this.queryApi(HEALTH_QUERY, {});
      if (!response.ok) {
        return ok({
          healthState: response.error.healthState,
          latencyMs: this.dependencies.clock.now() - startedAt,
          errorMessage: response.error.message,
        });
      }
      const payload = JSON.parse(response.value) as { readonly data?: { readonly Media?: { readonly id?: number } } };
      if (!Number.isSafeInteger(payload.data?.Media?.id)) {
        return ok({
          healthState: SourceHealthState.Degraded,
          latencyMs: this.dependencies.clock.now() - startedAt,
          errorMessage: 'AniList returned an invalid health response.',
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

  async detectUpdates(_accessPath: AccessPath): Promise<ReturnType<ProviderAdapter['detectUpdates']> extends Promise<infer T> ? T : never> {
    return err(
      new SourceProviderError(
        'NOT_SUPPORTED',
        'AniList public metadata does not provide update detection.',
        SourceHealthState.Unknown,
      ),
    );
  }

  async queryMetadata(
    query: MetadataQuery,
  ): Promise<ReturnType<ProviderAdapter['queryMetadata']> extends Promise<infer T> ? T : never> {
    const title = query.title.trim();
    if (!title || title.length > 120) {
      return errorResult(
        new SourceProviderError(
          'VALIDATION_FAILED',
          'Enter a search title of 1–120 characters.',
          SourceHealthState.Unknown,
        ),
      );
    }
    const requestedLimit = query.limit ?? 5;
    const limit = Number.isFinite(requestedLimit)
      ? Math.max(1, Math.min(10, Math.floor(requestedLimit)))
      : 5;
    const result = await this.queryApi(SEARCH_QUERY, { search: title, perPage: limit });
    if (!result.ok) return err(result.error);
    try {
      const payload = JSON.parse(result.value) as {
        readonly data?: { readonly Page?: { readonly media?: readonly AniListMedia[] | null } };
        readonly errors?: readonly unknown[];
      };
      const mediaList = payload.data?.Page?.media;
      if (payload.errors?.length || !Array.isArray(mediaList)) {
        return errorResult(
          new SourceProviderError(
            'SOURCE_DEGRADED',
            'AniList returned an invalid metadata response.',
            SourceHealthState.Degraded,
          ),
        );
      }
      return ok(
        (mediaList as readonly AniListMedia[])
          .filter((media) => Number.isSafeInteger(media.id) && typeof media.title?.romaji === 'string')
          .map((media): ProviderWorkMetadata => {
            const titleValue = media.title?.romaji ?? '';
            const authors =
              media.staff?.edges
                ?.filter((edge) => /story|original creator/i.test(edge.role ?? ''))
                .map((edge) => edge.node?.name?.full)
                .filter((name): name is string => Boolean(name)) ?? [];
            return {
              providerId: this.metadata.id,
              providerItemId: String(media.id),
              title: titleValue,
              ...(media.title?.english ? { alternateTitle: media.title.english } : {}),
              ...(media.description ? { synopsis: stripHtml(media.description) } : {}),
              authors,
              ...(media.coverImage?.large ? { coverImageUrl: media.coverImage.large } : {}),
              tags: media.genres ?? [],
              ...(media.siteUrl ? { url: media.siteUrl } : {}),
              ...(media.format ? { format: media.format } : {}),
            };
          }),
      );
    } catch (error) {
      return errorResult(
        new SourceProviderError(
          'SOURCE_DEGRADED',
          'AniList returned malformed metadata.',
          SourceHealthState.Degraded,
          { cause: error },
        ),
      );
    }
  }

  private async queryApi(
    query: string,
    variables: Record<string, string | number>,
  ): Promise<{ readonly ok: true; readonly value: string } | { readonly ok: false; readonly error: ProviderError }> {
    try {
      await this.limiter.acquire();
      const { response, text } = await fetchBoundedText(
        this.dependencies.fetch,
        ANILIST_API,
        {
          method: 'POST',
          headers: requestHeaders({ 'Content-Type': 'application/json' }),
          body: JSON.stringify({ query, variables }),
        },
        this.options.timeoutMs ?? DEFAULT_TIMEOUT_MS,
        this.options.maxResponseBytes ?? DEFAULT_MAX_RESPONSE_BYTES,
      );
      if (!response.ok) {
        const failure = classifyHttpFailure(response, this.dependencies.clock, this.limiter);
        return { ok: false, error: failure };
      }
      return { ok: true, value: text };
    } catch (error) {
      return { ok: false, error: getFailure(error) };
    }
  }
}

function stripHtml(text: string): string {
  return text.replace(/<[^>]*>/g, ' ').replace(/\s+/g, ' ').trim();
}
