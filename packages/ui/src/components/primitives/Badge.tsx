import * as React from 'react';
import { cva, type VariantProps } from 'class-variance-authority';
import { cn } from '../../utils/cn';

const badgeVariants = cva(
  'inline-flex items-center rounded-cv-full px-2 py-0.5 text-[11px] font-medium transition-colors select-none whitespace-nowrap',
  {
    variants: {
      variant: {
        default:
          'border border-[var(--cv-border)] bg-[var(--cv-surface)] text-[var(--cv-text)]',
        accent:
          'border border-[var(--cv-accent)]/30 bg-[var(--cv-accent-muted)] text-[var(--cv-accent-strong)]',
        success:
          'border border-[var(--cv-success)]/30 bg-[var(--cv-success-muted)] text-[var(--cv-success)]',
        warning:
          'border border-[var(--cv-warning)]/30 bg-[var(--cv-warning-muted)] text-[var(--cv-warning)]',
        danger:
          'border border-[var(--cv-danger)]/30 bg-[var(--cv-danger-muted)] text-[var(--cv-danger)]',
        muted:
          'border border-transparent bg-[var(--cv-surface)]/70 text-[var(--cv-text-muted)]',
      },
      size: {
        sm: 'px-1.5 py-0.2 text-[10px]',
        default: 'px-2 py-0.5 text-[11px]',
        lg: 'px-2.5 py-1 text-cv-xs',
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
