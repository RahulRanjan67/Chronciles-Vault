import * as React from 'react';
import { cn } from '../../utils/cn';

export type SourceHealthType =
  | 'healthy'
  | 'degraded'
  | 'unavailable'
  | 'stale'
  | 'unknown'
  | 'local';

export interface SourceHealthIndicatorProps
  extends React.HTMLAttributes<HTMLDivElement> {
  health: SourceHealthType;
  showLabel?: boolean;
  label?: string;
  size?: 'sm' | 'default' | 'lg';
}

const HEALTH_CONFIG: Record<
  SourceHealthType,
  { label: string; dotClass: string; textClass: string }
> = {
  healthy: {
    label: 'Healthy',
    dotClass: 'bg-[var(--cv-health-healthy)]',
    textClass: 'text-[var(--cv-health-healthy)]',
  },
  degraded: {
    label: 'Degraded',
    dotClass: 'bg-[var(--cv-health-degraded)]',
    textClass: 'text-[var(--cv-health-degraded)]',
  },
  unavailable: {
    label: 'Unavailable',
    dotClass: 'bg-[var(--cv-health-unavailable)]',
    textClass: 'text-[var(--cv-health-unavailable)]',
  },
  stale: {
    label: 'Stale',
    dotClass: 'bg-[var(--cv-health-stale)]',
    textClass: 'text-[var(--cv-health-stale)]',
  },
  unknown: {
    label: 'Unknown',
    dotClass: 'bg-[var(--cv-health-unknown)]',
    textClass: 'text-[var(--cv-health-unknown)]',
  },
  local: {
    label: 'Local file',
    dotClass: 'bg-[var(--cv-health-local)]',
    textClass: 'text-[var(--cv-health-local)]',
  },
};

export function SourceHealthIndicator({
  health,
  showLabel = true,
  label,
  size = 'default',
  className,
  ...props
}: SourceHealthIndicatorProps) {
  const config = HEALTH_CONFIG[health] ?? HEALTH_CONFIG.unknown;
  const displayLabel = label ?? config.label;

  const dotSizeClass = {
    sm: 'h-1.5 w-1.5',
    default: 'h-2 w-2',
    lg: 'h-2.5 w-2.5',
  }[size];

  const textSizeClass = {
    sm: 'text-[11px]',
    default: 'text-cv-xs',
    lg: 'text-cv-sm',
  }[size];

  return (
    <div
      className={cn('inline-flex items-center gap-1.5 select-none', className)}
      title={`Source status: ${displayLabel}`}
      {...props}
    >
      <span className="relative flex shrink-0 items-center justify-center">
        {health === 'healthy' && (
          <span
            className={cn(
              'absolute inline-flex h-full w-full animate-ping rounded-full opacity-30',
              config.dotClass,
            )}
          />
        )}
        <span className={cn('relative inline-flex rounded-full', dotSizeClass, config.dotClass)} />
      </span>
      {showLabel && (
        <span className={cn('font-medium leading-none text-[var(--cv-text-muted)]', textSizeClass)}>
          {displayLabel}
        </span>
      )}
    </div>
  );
}
