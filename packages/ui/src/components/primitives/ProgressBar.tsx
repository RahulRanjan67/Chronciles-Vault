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
    default: 'bg-[var(--cv-accent)]',
    success: 'bg-[var(--cv-success)]',
    warning: 'bg-[var(--cv-warning)]',
    subtle: 'bg-[var(--cv-text-muted)]',
  }[variant];

  return (
    <div
      role="progressbar"
      aria-valuenow={value}
      aria-valuemin={0}
      aria-valuemax={max}
      className={cn(
        'w-full overflow-hidden rounded-full bg-[var(--cv-surface)]',
        heightClass,
        className,
      )}
      {...props}
    >
      <div
        className={cn(
          'h-full rounded-full transition-all duration-[var(--cv-duration-base)] ease-[var(--cv-ease)]',
          fillClass,
        )}
        style={{ width: `${percentage}%` }}
      />
    </div>
  );
}
