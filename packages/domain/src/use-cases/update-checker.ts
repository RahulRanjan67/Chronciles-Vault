import { ProgressAnchor, extractNumericProgress } from '../entities/progress.js';

// ---------------------------------------------------------------------------
// Types & Interfaces
// ---------------------------------------------------------------------------

export interface NewReleaseItem {
  readonly chapterNumber: number;
  readonly title?: string;
  readonly releaseDate?: string;
}

export interface ReleaseEvaluationResult {
  readonly isUnread: boolean;
  readonly unreadCount: number;
}

// ---------------------------------------------------------------------------
// Pure Function Update Checker
// ---------------------------------------------------------------------------

/**
 * Evaluates whether a new release (chapter or episode) is unread relative to
 * the user's current progress anchor, and calculates the unread count.
 *
 * Pure function — zero side-effects, deterministic.
 *
 * @param currentProgress The user's current progress checkpoint, or null if not yet started.
 * @param newRelease The new release information containing chapterNumber.
 * @returns { isUnread: boolean; unreadCount: number }
 */
export function evaluateNewRelease(
  currentProgress: ProgressAnchor | null | undefined,
  newRelease: NewReleaseItem,
): ReleaseEvaluationResult {
  // If the user has never recorded progress, all releases are unread
  if (!currentProgress) {
    return {
      isUnread: true,
      unreadCount: Math.max(1, Math.round(newRelease.chapterNumber)),
    };
  }

  switch (currentProgress.type) {
    case 'chapter': {
      const currentChapter =
        currentProgress.chapter +
        (currentProgress.subchapter ? currentProgress.subchapter * 0.1 : 0);
      const diff = newRelease.chapterNumber - currentChapter;

      if (diff > 0) {
        return {
          isUnread: true,
          unreadCount: Math.max(1, Math.round(diff)),
        };
      }
      return { isUnread: false, unreadCount: 0 };
    }

    case 'volume_chapter': {
      const currentChapter = currentProgress.chapter;
      const diff = newRelease.chapterNumber - currentChapter;

      if (diff > 0) {
        return {
          isUnread: true,
          unreadCount: Math.max(1, Math.round(diff)),
        };
      }
      return { isUnread: false, unreadCount: 0 };
    }

    case 'episode': {
      const currentEpisode = currentProgress.episode;
      const diff = newRelease.chapterNumber - currentEpisode;

      if (diff > 0) {
        return {
          isUnread: true,
          unreadCount: Math.max(1, Math.round(diff)),
        };
      }
      return { isUnread: false, unreadCount: 0 };
    }

    case 'percent': {
      if (currentProgress.percent >= 100) {
        return { isUnread: false, unreadCount: 0 };
      }
      return { isUnread: true, unreadCount: 1 };
    }

    case 'page':
    case 'epub_locator':
    case 'provider':
    case 'audiobook': {
      const numeric = extractNumericProgress(currentProgress);
      if (numeric !== null) {
        const diff = newRelease.chapterNumber - numeric;
        if (diff > 0) {
          return {
            isUnread: true,
            unreadCount: Math.max(1, Math.round(diff)),
          };
        }
        return { isUnread: false, unreadCount: 0 };
      }
      // If anchor cannot be numerically mapped, mark as unread with count 1
      return { isUnread: true, unreadCount: 1 };
    }
  }
}

/**
 * Evaluates a list of newly discovered releases against current progress.
 *
 * @param currentProgress User's current anchor.
 * @param releases List of available releases.
 * @returns Total unread count and highest unread release.
 */
export function evaluateBatchReleases(
  currentProgress: ProgressAnchor | null | undefined,
  releases: readonly NewReleaseItem[],
): {
  readonly hasUnread: boolean;
  readonly totalUnreadCount: number;
  readonly latestRelease: NewReleaseItem | null;
} {
  if (releases.length === 0) {
    return { hasUnread: false, totalUnreadCount: 0, latestRelease: null };
  }

  const sorted = [...releases].sort((a, b) => b.chapterNumber - a.chapterNumber);
  const latestRelease = sorted[0] ?? null;

  if (!latestRelease) {
    return { hasUnread: false, totalUnreadCount: 0, latestRelease: null };
  }

  const evalResult = evaluateNewRelease(currentProgress, latestRelease);

  return {
    hasUnread: evalResult.isUnread,
    totalUnreadCount: evalResult.unreadCount,
    latestRelease,
  };
}
