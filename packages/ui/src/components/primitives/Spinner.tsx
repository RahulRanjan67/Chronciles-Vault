import * as React from 'react';
import { Loader2 } from 'lucide-react';
import { cn } from '../../utils/cn';

export interface SpinnerProps extends React.HTMLAttributes<HTMLDivElement> {
  size?: 'xs' | 'sm' | 'default' | 'lg';
  label?: string;
}

export function Spinner({
  size = 'default',
  label = 'Loading…',
  className,
  ...props
}: SpinnerProps) {
  const sizeClass = {
    xs: 'h-3 w-3',
    sm: 'h-4 w-4',
    default: 'h-5 w-5',
    lg: 'h-7 w-7',
  }[size];

  return (
    <div
      role="status"
      aria-label={label}
      className={cn('inline-flex items-center justify-center', className)}
      {...props}
    >
      <Loader2
        className={cn('animate-spin text-[var(--cv-accent-strong)]', sizeClass)}
      />
      <span className="sr-only">{label}</span>
    </div>
  );
}
