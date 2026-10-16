import * as React from 'react';
import { cva, type VariantProps } from 'class-variance-authority';
import { cn } from '../../utils/cn';

const statusChipVariants = cva(
  'inline-flex items-center gap-1.5 rounded-cv-full px-2 py-0.5 text-cv-xs font-medium border transition-colors select-none whitespace-nowrap',
  {
    variants: {
      status: {
        healthy:
          'border-[var(--cv-health-healthy)]/25 bg-[var(--cv-success-muted)] text-[var(--cv-health-healthy)]',
        degraded:
          'border-[var(--cv-health-degraded)]/25 bg-[var(--cv-warning-muted)] text-[var(--cv-health-degraded)]',
        unavailable:
          'border-[var(--cv-health-unavailable)]/25 bg-[var(--cv-danger-muted)] text-[var(--cv-health-unavailable)]',
        stale:
          'border-[var(--cv-health-stale)]/25 bg-[var(--cv-surface)] text-[var(--cv-health-stale)]',
        unknown:
          'border-[var(--cv-health-unknown)]/25 bg-[var(--cv-surface)] text-[var(--cv-health-unknown)]',
        local:
          'border-[var(--cv-health-local)]/25 bg-[var(--cv-accent-muted)] text-[var(--cv-health-local)]',
        reading:
          'border-[var(--cv-accent)]/30 bg-[var(--cv-accent-muted)] text-[var(--cv-accent-strong)]',
        completed:
          'border-[var(--cv-success)]/30 bg-[var(--cv-success-muted)] text-[var(--cv-success)]',
        stalled:
          'border-[var(--cv-warning)]/30 bg-[var(--cv-warning-muted)] text-[var(--cv-warning)]',
        waiting:
          'border-[var(--cv-border-strong)] bg-[var(--cv-info-muted)] text-[var(--cv-info)]',
        dropped:
          'border-[var(--cv-border)] bg-[var(--cv-surface)] text-[var(--cv-text-subtle)]',
        neutral:
          'border-[var(--cv-border)] bg-[var(--cv-surface)] text-[var(--cv-text-muted)]',
      },
      size: {
        sm: 'px-1.5 py-0.2 text-[10px]',
        default: 'px-2 py-0.5 text-cv-xs',
      },
    },
    defaultVariants: {
      status: 'neutral',
      size: 'default',
    },
  },
);

export interface StatusChipProps
  extends React.HTMLAttributes<HTMLSpanElement>,
    VariantProps<typeof statusChipVariants> {
  dot?: boolean;
}

export function StatusChip({
  className,
  status = 'neutral',
  size = 'default',
  dot = true,
  children,
  ...props
}: StatusChipProps) {
  const dotColorClass = {
    healthy: 'bg-[var(--cv-health-healthy)]',
    degraded: 'bg-[var(--cv-health-degraded)]',
    unavailable: 'bg-[var(--cv-health-unavailable)]',
    stale: 'bg-[var(--cv-health-stale)]',
    unknown: 'bg-[var(--cv-health-unknown)]',
    local: 'bg-[var(--cv-health-local)]',
    reading: 'bg-[var(--cv-accent)]',
    completed: 'bg-[var(--cv-success)]',
    stalled: 'bg-[var(--cv-warning)]',
    waiting: 'bg-[var(--cv-info)]',
    dropped: 'bg-[var(--cv-text-subtle)]',
    neutral: 'bg-[var(--cv-text-subtle)]',
  }[status ?? 'neutral'];

  return (
    <span
      className={cn(statusChipVariants({ status, size, className }))}
      {...props}
    >
      {dot && <span className={cn('h-1.5 w-1.5 rounded-full shrink-0', dotColorClass)} />}
      <span>{children}</span>
    </span>
  );
}

/** Specialized chip for personal tracking state */
export function PersonalStateChip({
  state,
  className,
}: {
  state: 'reading' | 'waiting' | 'stalled' | 'caught_up' | 'planning' | 'completed' | 'dropped' | 'paused' | string;
  className?: string;
}) {
  const map: Record<string, { status: VariantProps<typeof statusChipVariants>['status']; label: string }> = {
    reading: { status: 'reading', label: 'Reading' },
    waiting: { status: 'waiting', label: 'Waiting' },
    stalled: { status: 'stalled', label: 'Stalled' },
    caught_up: { status: 'completed', label: 'Caught Up' },
    planning: { status: 'neutral', label: 'Plan to Read' },
    completed: { status: 'completed', label: 'Completed' },
    dropped: { status: 'dropped', label: 'Dropped' },
    paused: { status: 'stalled', label: 'Paused' },
  };

  const config = map[state] ?? { status: 'neutral', label: state };
  return (
    <StatusChip status={config.status} className={className}>
      {config.label}
    </StatusChip>
  );
}

/** Specialized chip for source health */
export function SourceHealthBadge({
  health,
  label,
  className,
}: {
  health: 'healthy' | 'degraded' | 'unavailable' | 'stale' | 'unknown' | 'local';
  label?: string;
  className?: string;
}) {
  const defaultLabels = {
    healthy: 'Healthy',
    degraded: 'Degraded',
    unavailable: 'Unavailable',
    stale: 'Stale',
    unknown: 'Unknown',
    local: 'Local',
  };
  return (
    <StatusChip status={health} className={className}>
      {label ?? defaultLabels[health]}
    </StatusChip>
  );
}

/** Specialized badge for detected update certainty */
export function UpdateCertaintyBadge({
  certainty,
  className,
}: {
  certainty: 'confirmed' | 'inferred' | 'scheduled' | 'unknown' | 'stale' | string;
  className?: string;
}) {
  const map: Record<string, { status: VariantProps<typeof statusChipVariants>['status']; label: string }> = {
    confirmed: { status: 'healthy', label: 'Confirmed' },
    inferred: { status: 'waiting', label: 'Inferred' },
    scheduled: { status: 'local', label: 'Scheduled' },
    unknown: { status: 'unknown', label: 'Unverified' },
    stale: { status: 'stale', label: 'Stale' },
  };
  const item = map[certainty] ?? { status: 'neutral', label: certainty };
  return (
    <StatusChip status={item.status} className={className}>
      {item.label}
    </StatusChip>
  );
}

/** Specialized badge for Content format type */
export function ContentTypeBadge({
  type,
  className,
}: {
  type: string;
  className?: string;
}) {
  const pretty = type.replace('_', ' ').toUpperCase();
  return (
    <span
      className={cn(
        'inline-flex items-center rounded-cv-sm px-1.5 py-0.5 text-[10px] font-mono font-medium tracking-wide uppercase bg-[var(--cv-surface)] text-[var(--cv-text-muted)] border border-[var(--cv-border)] select-none',
        className,
      )}
    >
      {pretty}
    </span>
  );
}
