import {
  CaptureId,
  CaptureBatchId,
  WorkId,
  newId,
} from '@chronicles-vault/shared';
import { normalizeUrl } from '../use-cases/url-normalizer.js';

// ---------------------------------------------------------------------------
// Enums
// ---------------------------------------------------------------------------

/**
 * Lifecycle state of an ingested tab, link, or URL capture.
 */
export enum CaptureState {
  Pending = 'pending',
  Matched = 'matched',
  Dismissed = 'dismissed',
  Archived = 'archived',
}

export enum CaptureSource {
  BrowserTabs = 'browser_tabs',
  Bookmarks = 'bookmarks',
  Manual = 'manual',
  Share = 'share',
  Extension = 'extension',
}

// ---------------------------------------------------------------------------
// Value Objects & Interfaces
// ---------------------------------------------------------------------------

/**
 * Origin environment and context of a captured item.
 */
export interface CaptureProvenance {
  readonly sourceType: 'browser_tabs' | 'bookmarks' | 'manual' | 'share' | 'extension';
  readonly browser?: string;
  readonly windowLabel?: string;
  readonly device?: string;
  readonly url?: string;
}

/**
 * An individual captured bookmark or browser tab candidate to be triaged into the Vault.
 */
export interface Capture {
  readonly id: CaptureId;
  readonly batchId: CaptureBatchId | null;
  readonly url: string | null;
  readonly normalizedUrl: string | null;
  readonly title: string | null;
  readonly faviconRef: string | null;
  readonly browser?: string | null;
  readonly windowLabel?: string | null;
  readonly capturedAt: string;
  readonly possibleWorkId: WorkId | null;
  readonly confidenceScore: number | null;
  readonly state: CaptureState;
  readonly provenance?: CaptureProvenance;
  readonly createdAt: string;
}

/**
 * Group of captures imported in a single bulk operation (e.g. "Save all open tabs").
 */
export interface CaptureBatch {
  readonly id: CaptureBatchId;
  readonly label: string | null;
  readonly source: CaptureSource | 'browser_tabs' | 'bookmarks' | 'manual' | 'share';
  readonly itemCount: number;
  readonly processedCount: number;
  readonly createdAt: string;
}

// ---------------------------------------------------------------------------
// Invariant Validation
// ---------------------------------------------------------------------------

export function validateCaptureInvariant(candidate: Pick<Capture, 'url' | 'title' | 'confidenceScore'>): void {
  if (!candidate.url && !candidate.title) {
    throw new Error('Capture invariant violated: must contain at least a url or title');
  }
  if (
    candidate.confidenceScore !== null &&
    candidate.confidenceScore !== undefined &&
    (candidate.confidenceScore < 0 || candidate.confidenceScore > 1)
  ) {
    throw new Error(
      `Capture invariant violated: confidenceScore must be between 0.0 and 1.0, got ${candidate.confidenceScore}`,
    );
  }
}

// ---------------------------------------------------------------------------
// Factory Helpers
// ---------------------------------------------------------------------------

export type CreateCaptureParams = Omit<
  Capture,
  'id' | 'createdAt'
> & {
  readonly id?: CaptureId;
  readonly createdAt?: string;
};

export function createCapture(params: CreateCaptureParams): Capture {
  validateCaptureInvariant(params);

  // Auto-normalize URL if provided
  const normalizedUrl = params.url ? normalizeUrl(params.url).normalizedUrl : null;

  return {
    ...params,
    normalizedUrl: params.normalizedUrl ?? normalizedUrl,
    id: params.id ?? (newId() as CaptureId),
    createdAt: params.createdAt ?? new Date().toISOString(),
  };
}

export function applyCapturePatch(
  capture: Capture,
  patch: Partial<Omit<Capture, 'id' | 'createdAt'>>,
): Capture {
  // Auto-normalize URL if it's being updated
  const normalizedUrl = patch.url ? normalizeUrl(patch.url).normalizedUrl : capture.normalizedUrl;

  const updated: Capture = {
    ...capture,
    ...patch,
    normalizedUrl,
  };
  validateCaptureInvariant(updated);
  return updated;
}

export type CreateCaptureBatchParams = Omit<
  CaptureBatch,
  'id' | 'createdAt'
> & {
  readonly id?: CaptureBatchId;
  readonly createdAt?: string;
};

export function createCaptureBatch(params: CreateCaptureBatchParams): CaptureBatch {
  if (params.itemCount < 0) {
    throw new Error(`CaptureBatch itemCount must be non-negative, got ${params.itemCount}`);
  }
  if (params.processedCount < 0) {
    throw new Error(`CaptureBatch processedCount must be non-negative, got ${params.processedCount}`);
  }
  return {
    ...params,
    id: params.id ?? (newId() as CaptureBatchId),
    createdAt: params.createdAt ?? new Date().toISOString(),
  };
}
