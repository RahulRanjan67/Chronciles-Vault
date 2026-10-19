import * as React from 'react';
import { cva, type VariantProps } from 'class-variance-authority';
import { cn } from '../../utils/cn';

const statusChipVariants = cva(
  'inline-flex items-center gap-1.5 rounded-gm-full px-2 py-0.5 text-gm-xs font-medium border transition-colors select-none whitespace-nowrap',
  {
    variants: {
      status: {
        healthy:
          'border-[var(--gm-health-healthy)]/25 bg-[var(--gm-success-muted)] text-[var(--gm-health-healthy)]',
        degraded:
          'border-[var(--gm-health-degraded)]/25 bg-[var(--gm-warning-muted)] text-[var(--gm-health-degraded)]',
        unavailable:
          'border-[var(--gm-health-unavailable)]/25 bg-[var(--gm-danger-muted)] text-[var(--gm-health-unavailable)]',
        stale:
          'border-[var(--gm-health-stale)]/25 bg-[var(--gm-surface)] text-[var(--gm-health-stale)]',
        unknown:
          'border-[var(--gm-health-unknown)]/25 bg-[var(--gm-surface)] text-[var(--gm-health-unknown)]',
        local:
          'border-[var(--gm-health-local)]/25 bg-[var(--gm-accent-muted)] text-[var(--gm-health-local)]',
        reading:
          'border-[var(--gm-accent)]/30 bg-[var(--gm-accent-muted)] text-[var(--gm-accent-strong)]',
        completed:
          'border-[var(--gm-success)]/30 bg-[var(--gm-success-muted)] text-[var(--gm-success)]',
        stalled:
          'border-[var(--gm-warning)]/30 bg-[var(--gm-warning-muted)] text-[var(--gm-warning)]',
        waiting:
          'border-[var(--gm-border-strong)] bg-[var(--gm-info-muted)] text-[var(--gm-info)]',
        dropped:
          'border-[var(--gm-border)] bg-[var(--gm-surface)] text-[var(--gm-text-subtle)]',
        neutral:
          'border-[var(--gm-border)] bg-[var(--gm-surface)] text-[var(--gm-text-muted)]',
      },
      size: {
        sm: 'px-1.5 py-0.2 text-[10px]',
        default: 'px-2 py-0.5 text-gm-xs',
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
    healthy: 'bg-[var(--gm-health-healthy)]',
    degraded: 'bg-[var(--gm-health-degraded)]',
    unavailable: 'bg-[var(--gm-health-unavailable)]',
    stale: 'bg-[var(--gm-health-stale)]',
    unknown: 'bg-[var(--gm-health-unknown)]',
    local: 'bg-[var(--gm-health-local)]',
    reading: 'bg-[var(--gm-accent)]',
    completed: 'bg-[var(--gm-success)]',
    stalled: 'bg-[var(--gm-warning)]',
    waiting: 'bg-[var(--gm-info)]',
    dropped: 'bg-[var(--gm-text-subtle)]',
    neutral: 'bg-[var(--gm-text-subtle)]',
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
        'inline-flex items-center rounded-gm-sm px-1.5 py-0.5 text-[10px] font-mono font-medium tracking-wide uppercase bg-[var(--gm-surface)] text-[var(--gm-text-muted)] border border-[var(--gm-border)] select-none',
        className,
      )}
    >
      {pretty}
    </span>
  );
}
