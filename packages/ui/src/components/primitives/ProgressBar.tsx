import * as React from 'react';
import { cn } from '../../utils/cn';

export interface ProgressBarProps extends React.HTMLAttributes<HTMLDivElement> {
  value?: number;
  max?: number;
  variant?: 'default' | 'success' | 'warning' | 'subtle';
  size?: 'sm' | 'default' | 'md';
}

export function ProgressBar({
  value = 0,
  max = 100,
  variant = 'default',
  size = 'default',
  className,
  ...props
}: ProgressBarProps) {
  const percentage = Math.min(Math.max(0, (value / max) * 100), 100);

  const heightClass = {
    sm: 'h-1',
    default: 'h-1.5',
    md: 'h-2.5',
  }[size];

  const fillClass = {
    default: 'bg-[var(--gm-accent)]',
    success: 'bg-[var(--gm-success)]',
    warning: 'bg-[var(--gm-warning)]',
    subtle: 'bg-[var(--gm-text-muted)]',
  }[variant];

  return (
    <div
      role="progressbar"
      aria-valuenow={value}
      aria-valuemin={0}
      aria-valuemax={max}
      className={cn(
        'w-full overflow-hidden rounded-full bg-[var(--gm-surface)]',
        heightClass,
        className,
      )}
      {...props}
    >
      <div
        className={cn(
          'h-full rounded-full transition-all duration-[var(--gm-duration-base)] ease-[var(--gm-ease)]',
          fillClass,
        )}
        style={{ width: `${percentage}%` }}
      />
    </div>
  );
}
