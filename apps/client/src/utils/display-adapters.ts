/**
 * Adapters between domain types and UI display types.
 *
 * The domain layer and the UI component library are intentionally decoupled.
 * These thin helpers bridge them at the client-app boundary.
 */

import type {
  ProgressAnchor as DomainProgressAnchor,
  MemoryType as DomainMemoryType,
} from '@grimoire/domain';
import {
  formatProgressAnchor as formatDomainAnchor,
  normalizeProgressAnchor,
  SourceHealth,
} from '@grimoire/domain';
import type {
  ProgressAnchor as UIProgressAnchor,
  SourceHealthType,
} from '@grimoire/ui';

// ---------------------------------------------------------------------------
// SourceHealth → SourceHealthType
// 'broken' in domain is not a first-class UI state; treat it as 'unavailable'.
// ---------------------------------------------------------------------------

export function toUIHealth(health: SourceHealth | 'unknown' | undefined): SourceHealthType {
  if (!health || health === 'unknown') return 'unknown';
  switch (health) {
    case SourceHealth.Healthy:      return 'healthy';
    case SourceHealth.Degraded:     return 'degraded';
    case SourceHealth.Unavailable:  return 'unavailable';
    case SourceHealth.Stale:        return 'stale';
    case SourceHealth.Local:        return 'local';
    case SourceHealth.Broken:       return 'unavailable';
    default:                        return 'unknown';
  }
}

// ---------------------------------------------------------------------------
// Domain ProgressAnchor → UI ProgressAnchor
// ---------------------------------------------------------------------------

export function toUIAnchor(anchor: DomainProgressAnchor | null | undefined): UIProgressAnchor | null {
  if (!anchor) return null;
  const normalized = normalizeProgressAnchor(anchor);
  if (!normalized) {
    const raw = anchor as { label?: string };
    return { type: 'custom', label: raw.label ?? 'Unknown' };
  }

  switch (normalized.type) {
    case 'chapter':
      return {
        type: 'chapter',
        chapter: normalized.chapter,
        subChapter: normalized.subchapter,
      };
    case 'episode':
      return {
        type: 'episode',
        episode: normalized.episode,
      };
    case 'page':
      return {
        type: 'page',
        page: normalized.page,
        totalPages: normalized.totalPages,
      };
    case 'percent':
      return {
        type: 'percent',
        percent: normalized.percent,
        percentage: normalized.percent,
      };
    case 'epub_locator':
      if (normalized.percent !== undefined) {
        return {
          type: 'percent',
          percent: normalized.percent,
          percentage: normalized.percent,
        };
      }
      return {
        type: 'custom',
        label: formatDomainAnchor(normalized),
      };
    case 'volume_chapter':
    case 'provider':
    case 'audiobook':
      return {
        type: 'custom',
        label: formatDomainAnchor(normalized),
      };
  }
}

// ---------------------------------------------------------------------------
// Domain MemoryType → UI MemoryCard type
// ---------------------------------------------------------------------------

type UIMemoryType = 'quote' | 'note' | 'theory' | 'reaction' | 'bookmark';

const UI_MEMORY_TYPE_MAP: Partial<Record<DomainMemoryType, UIMemoryType>> = {
  quote: 'quote',
  panel: 'quote',
  personal_note: 'note',
  diary: 'note',
  lore_entry: 'note',
  why_saved: 'note',
  why_stopped: 'note',
  reading_session_note: 'note',
  highlight: 'reaction',
  favorite_chapter: 'reaction',
  favorite_panel: 'reaction',
  screenshot: 'bookmark',
};

export function toUIMemoryType(type: DomainMemoryType | string): UIMemoryType {
  return (UI_MEMORY_TYPE_MAP[type as DomainMemoryType] ?? 'note') as UIMemoryType;
}
