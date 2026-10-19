import * as React from 'react';
import { cva, type VariantProps } from 'class-variance-authority';
import { cn } from '../../utils/cn';

const badgeVariants = cva(
  'inline-flex items-center rounded-gm-full px-2 py-0.5 text-[11px] font-medium transition-colors select-none whitespace-nowrap',
  {
    variants: {
      variant: {
        default:
          'border border-[var(--gm-border)] bg-[var(--gm-surface)] text-[var(--gm-text)]',
        accent:
          'border border-[var(--gm-accent)]/30 bg-[var(--gm-accent-muted)] text-[var(--gm-accent-strong)]',
        success:
          'border border-[var(--gm-success)]/30 bg-[var(--gm-success-muted)] text-[var(--gm-success)]',
        warning:
          'border border-[var(--gm-warning)]/30 bg-[var(--gm-warning-muted)] text-[var(--gm-warning)]',
        danger:
          'border border-[var(--gm-danger)]/30 bg-[var(--gm-danger-muted)] text-[var(--gm-danger)]',
        muted:
          'border border-transparent bg-[var(--gm-surface)]/70 text-[var(--gm-text-muted)]',
      },
      size: {
        sm: 'px-1.5 py-0.2 text-[10px]',
        default: 'px-2 py-0.5 text-[11px]',
        lg: 'px-2.5 py-1 text-gm-xs',
      },
    },
    defaultVariants: {
      variant: 'default',
      size: 'default',
    },
  },
);

export interface BadgeProps
  extends React.HTMLAttributes<HTMLSpanElement>,
    VariantProps<typeof badgeVariants> {}

export function Badge({ className, variant, size, ...props }: BadgeProps) {
  return (
    <span className={cn(badgeVariants({ variant, size, className }))} {...props} />
  );
}
