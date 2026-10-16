import type { AccessPath, AccessPathKind, SourceHealthState } from '@chronicles-vault/domain';
import type { UpdateEntry } from '@chronicles-vault/domain';
import type { Result } from '@chronicles-vault/shared';

export enum Capability {
  ReadInternal = 'read_internal',
  ReadExternal = 'read_external',
  ProgressSync = 'progress_sync',
  ChapterList = 'chapter_list',
  MetadataQuery = 'metadata_query',
  UpdateDetection = 'update_detection',
}

export interface ProviderMetadata {
  readonly id: string;
  readonly displayName: string;
  readonly version: string;
  readonly supportedKinds: readonly AccessPathKind[];
  readonly capabilities: readonly Capability[];
}

export interface HealthCheckResult {
  readonly healthState: SourceHealthState;
  readonly latencyMs?: number;
  readonly errorMessage?: string;
}

export interface ProviderWorkMetadata {
  readonly providerId: string;
  readonly providerItemId: string;
  readonly title: string;
  readonly alternateTitle?: string;
  readonly synopsis?: string;
  readonly authors: readonly string[];
  readonly coverImageUrl?: string;
  readonly tags: readonly string[];
  readonly url?: string;
  readonly format?: string;
}

export interface ProviderError extends Error {
  readonly code: 'VALIDATION_FAILED' | 'RATE_LIMITED' | 'NETWORK_UNAVAILABLE' | 'SOURCE_DEGRADED' | 'NOT_SUPPORTED';
  readonly healthState: SourceHealthState;
  readonly retryAfterMs?: number;
  readonly cause?: unknown;
}

export interface ProviderUpdateResult {
  readonly updates: readonly UpdateEntry[];
  readonly syncState?: unknown;
}

export interface MetadataQuery {
  readonly title: string;
  readonly limit?: number;
}

export interface ProviderAdapter {
  readonly metadata: ProviderMetadata;
  canHandle(target: string): boolean;
  checkHealth(accessPath: AccessPath): Promise<Result<HealthCheckResult, ProviderError>>;
  detectUpdates(
    accessPath: AccessPath,
    syncState?: unknown,
  ): Promise<Result<ProviderUpdateResult, ProviderError>>;
  queryMetadata(query: MetadataQuery): Promise<Result<readonly ProviderWorkMetadata[], ProviderError>>;
}

export interface ProviderDependencies {
  readonly fetch: FetchLike;
  readonly clock: Clock;
}

export type FetchLike = (
  input: RequestInfo | URL,
  init?: RequestInit,
) => Promise<Response>;

export interface Clock {
  now(): number;
  sleep(milliseconds: number): Promise<void>;
}

export const USER_AGENT =
  'ChroniclesVault/1.0 (+https://chroniclesvault.app; contact@chroniclesvault.app)';
export const DEFAULT_TIMEOUT_MS = 8_000;
export const DEFAULT_MAX_RESPONSE_BYTES = 1_000_000;

export class SourceProviderError extends Error implements ProviderError {
  readonly code: ProviderError['code'];
  readonly healthState: SourceHealthState;
  readonly retryAfterMs?: number;
  override readonly cause?: unknown;

  constructor(
    code: ProviderError['code'],
    message: string,
    healthState: SourceHealthState,
    options: { retryAfterMs?: number; cause?: unknown } = {},
  ) {
    super(message);
    this.name = 'SourceProviderError';
    this.code = code;
    this.healthState = healthState;
    this.retryAfterMs = options.retryAfterMs;
    this.cause = options.cause;
  }
}

export class ProviderRateLimiter {
  private tokens: number;
  private lastRefill: number;
  private blockedUntil = 0;

  constructor(
    private readonly clock: Clock,
    private readonly capacity: number,
    private readonly requestsPerSecond: number,
  ) {
    this.tokens = capacity;
    this.lastRefill = clock.now();
  }

  async acquire(): Promise<void> {
    while (true) {
      const now = this.clock.now();
      if (now < this.blockedUntil) {
        await this.clock.sleep(this.blockedUntil - now);
        continue;
      }
      this.tokens = Math.min(
        this.capacity,
        this.tokens + ((now - this.lastRefill) / 1000) * this.requestsPerSecond,
      );
      this.lastRefill = now;
      if (this.tokens >= 1) {
        this.tokens -= 1;
        return;
      }
      await this.clock.sleep(Math.ceil(((1 - this.tokens) / this.requestsPerSecond) * 1000));
    }
  }

  defer(milliseconds: number): void {
    this.blockedUntil = Math.max(this.blockedUntil, this.clock.now() + Math.max(0, milliseconds));
  }
}

export async function fetchBoundedText(
  fetcher: FetchLike,
  url: string,
  init: RequestInit,
  timeoutMs = DEFAULT_TIMEOUT_MS,
  maxBytes = DEFAULT_MAX_RESPONSE_BYTES,
): Promise<{ readonly response: Response; readonly text: string }> {
  const controller = new AbortController();
  const timeoutError = new SourceProviderError(
    'NETWORK_UNAVAILABLE',
    'The provider request timed out.',
    'degraded' as SourceHealthState,
  );
  let timeoutHandle: ReturnType<typeof setTimeout> | undefined;
  const operation = async () => {
    const response = await fetcher(url, {
      ...init,
      credentials: 'omit',
      redirect: 'error',
      signal: controller.signal,
    });
    if (!response.ok && response.status !== 304) return { response, text: '' };
    const contentLength = response.headers.get('content-length');
    if (contentLength && Number(contentLength) > maxBytes) {
      throw new SourceProviderError(
        'SOURCE_DEGRADED',
        'The provider response exceeded the configured size limit.',
        'degraded' as SourceHealthState,
      );
    }
    if (response.status === 304 || !response.body) return { response, text: '' };

    const reader = response.body.getReader();
    const chunks: Uint8Array[] = [];
    let totalBytes = 0;
    try {
      while (true) {
        const { done, value } = await reader.read();
        if (done) break;
        totalBytes += value.byteLength;
        if (totalBytes > maxBytes) {
          await reader.cancel();
          throw new SourceProviderError(
            'SOURCE_DEGRADED',
            'The provider response exceeded the configured size limit.',
            'degraded' as SourceHealthState,
          );
        }
        chunks.push(value);
      }
    } finally {
      reader.releaseLock();
    }
    const bytes = new Uint8Array(totalBytes);
    let offset = 0;
    for (const chunk of chunks) {
      bytes.set(chunk, offset);
      offset += chunk.byteLength;
    }
    return { response, text: new TextDecoder('utf-8', { fatal: true }).decode(bytes) };
  };

  const timedOperation = new Promise<Awaited<ReturnType<typeof operation>>>((resolve, reject) => {
    timeoutHandle = setTimeout(() => {
      controller.abort();
      reject(timeoutError);
    }, timeoutMs);
    operation().then(resolve, reject);
  });
  try {
    return await timedOperation;
  } finally {
    if (timeoutHandle !== undefined) clearTimeout(timeoutHandle);
  }
}

export function classifyHttpFailure(
  response: Response,
  clock: Clock,
  limiter: ProviderRateLimiter,
  defaultRetryAfterMs = 1_000,
): ProviderError {
  if (response.status === 403) {
    return new SourceProviderError(
      'SOURCE_DEGRADED',
      'The provider denied access or presented a challenge. Verify the source in your browser; automated access was stopped.',
      'degraded' as SourceHealthState,
    );
  }
  if (response.status === 429) {
    const retryAfter = response.headers.get('retry-after');
    const seconds = retryAfter ? Number(retryAfter) : Number.NaN;
    const retryAfterMs = Number.isFinite(seconds)
      ? Math.max(0, seconds * 1000)
      : retryAfter
        ? Math.max(0, Date.parse(retryAfter) - clock.now())
        : defaultRetryAfterMs;
    limiter.defer(retryAfterMs);
    return new SourceProviderError(
      'RATE_LIMITED',
      'The provider rate limit was reached; polling has been paused.',
      'degraded' as SourceHealthState,
      { retryAfterMs },
    );
  }
  const broken = response.status === 404 || response.status === 410;
  return new SourceProviderError(
    'SOURCE_DEGRADED',
    `The provider returned HTTP ${response.status}.`,
    (broken ? 'broken' : 'degraded') as SourceHealthState,
  );
}

export function isSafeHttpsUrl(target: string): boolean {
  try {
    const url = new URL(target);
    return (
      url.protocol === 'https:' &&
      !url.username &&
      !url.password &&
      ![...url.searchParams.keys()].some((key) =>
        /^(?:access[_-]?token|api[_-]?key|auth(?:orization)?|password|passwd|secret|session|token)$/i.test(
          key,
        ),
      )
    );
  } catch {
    return false;
  }
}

export function requestHeaders(extra?: HeadersInit): Headers {
  const headers = new Headers(extra);
  headers.set('User-Agent', USER_AGENT);
  headers.set('Accept', 'application/json, application/atom+xml, application/rss+xml, application/xml, text/xml');
  return headers;
}

export function getFailure(error: unknown): ProviderError {
  if (error instanceof SourceProviderError) return error;
  return new SourceProviderError(
    'NETWORK_UNAVAILABLE',
    'The provider could not be reached. Check your connection and try again later.',
    'degraded' as SourceHealthState,
    { cause: error },
  );
}

export function errorResult<T>(error: ProviderError): Result<T, ProviderError> {
  return { ok: false, error };
}
