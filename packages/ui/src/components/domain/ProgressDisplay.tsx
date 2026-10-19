import * as React from 'react';
import { formatDuration } from '../../utils/format';
import { cn } from '../../utils/cn';

export interface ChapterProgressAnchor {
  type: 'chapter';
  chapter: number | string;
  subChapter?: number | string;
  totalChapters?: number;
}

export interface EpisodeProgressAnchor {
  type: 'episode';
  episode: number | string;
  timestampSeconds?: number;
  durationSeconds?: number;
}

export interface PageProgressAnchor {
  type: 'page';
  page: number;
  totalPages?: number;
}

export interface PercentProgressAnchor {
  type: 'percent';
  percent?: number;
  percentage?: number;
}

export interface CustomProgressAnchor {
  type: 'custom';
  label: string;
}

export type ProgressAnchor =
  | ChapterProgressAnchor
  | EpisodeProgressAnchor
  | PageProgressAnchor
  | PercentProgressAnchor
  | CustomProgressAnchor
  | {
      chapter?: number | string;
      episode?: number | string;
      page?: number;
      totalPages?: number;
      timestampSeconds?: number;
      percent?: number;
      percentage?: number;
      label?: string;
    };

export function formatProgressAnchor(anchor?: ProgressAnchor | null): string {
  if (!anchor) return 'Unread';

  if ('type' in anchor) {
    switch (anchor.type) {
      case 'chapter': {
        const sub = anchor.subChapter ? `.${anchor.subChapter}` : '';
        const total = anchor.totalChapters ? ` / ${anchor.totalChapters}` : '';
        return `Chapter ${anchor.chapter}${sub}${total}`;
      }
      case 'episode': {
        const time = anchor.timestampSeconds !== undefined
          ? ` · ${formatDuration(anchor.timestampSeconds, 'clock')}`
          : '';
        return `Episode ${anchor.episode}${time}`;
      }
      case 'page': {
        return anchor.totalPages
          ? `Page ${anchor.page} / ${anchor.totalPages}`
          : `Page ${anchor.page}`;
      }
      case 'percent': {
        const pct = anchor.percent ?? anchor.percentage ?? 0;
        return `${Math.round(pct)}%`;
      }
      case 'custom': {
        return anchor.label;
      }
    }
  }

  // Loose object fallback
  if (anchor.label) return anchor.label;
  if (anchor.chapter !== undefined) return `Chapter ${anchor.chapter}`;
  if (anchor.episode !== undefined) {
    const time = anchor.timestampSeconds !== undefined
      ? ` · ${formatDuration(anchor.timestampSeconds, 'clock')}`
      : '';
    return `Episode ${anchor.episode}${time}`;
  }
  if (anchor.page !== undefined) {
    return anchor.totalPages
      ? `Page ${anchor.page} / ${anchor.totalPages}`
      : `Page ${anchor.page}`;
  }
  if (anchor.percent !== undefined || anchor.percentage !== undefined) {
    return `${Math.round(anchor.percent ?? anchor.percentage ?? 0)}%`;
  }

  return 'Not started';
}

export interface ProgressDisplayProps extends React.HTMLAttributes<HTMLSpanElement> {
  anchor?: ProgressAnchor | null | undefined;
  /** Optional fallback text */
  fallback?: string | undefined;
  /** Highlight style */
  emphasize?: boolean | undefined;
}

export function ProgressDisplay({
  anchor,
  fallback = 'Unread',
  emphasize = false,
  className,
  ...props
}: ProgressDisplayProps) {
  const text = anchor ? formatProgressAnchor(anchor) : fallback;

  return (
    <span
      className={cn(
        'font-mono text-gm-xs',
        emphasize
          ? 'font-medium text-[var(--gm-accent-strong)]'
          : 'text-[var(--gm-text-muted)]',
        className,
      )}
      {...props}
    >
      {text}
    </span>
  );
}
