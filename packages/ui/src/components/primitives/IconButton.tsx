import * as React from 'react';
import { cva, type VariantProps } from 'class-variance-authority';
import { cn } from '../../utils/cn';

export const iconButtonVariants = cva(
  'inline-flex items-center justify-center rounded-cv-full transition-colors focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-[var(--cv-border-focus)] disabled:pointer-events-none disabled:opacity-50 select-none cursor-pointer shrink-0',
  {
    variants: {
      variant: {
        default:
          'bg-[var(--cv-accent)] text-[var(--cv-text)] hover:bg-[var(--cv-accent-strong)] active:opacity-90',
        ghost:
          'text-[var(--cv-text-muted)] hover:text-[var(--cv-text)] hover:bg-[var(--cv-surface)] active:bg-[var(--cv-surface-raised)]',
        outline:
          'border border-[var(--cv-border)] bg-transparent text-[var(--cv-text)] hover:bg-[var(--cv-surface)] hover:border-[var(--cv-border-strong)]',
        secondary:
          'bg-[var(--cv-surface)] text-[var(--cv-text)] border border-[var(--cv-border)] hover:bg-[var(--cv-surface-raised)]',
        subtle:
          'bg-[var(--cv-surface)]/60 text-[var(--cv-text-muted)] hover:text-[var(--cv-text)] hover:bg-[var(--cv-surface)]',
      },
      size: {
        sm: 'h-7 w-7 text-cv-xs',
        default: 'h-9 w-9 text-cv-sm',
        lg: 'h-11 w-11 text-cv-base',
      },
    },
    defaultVariants: {
      variant: 'ghost',
      size: 'default',
    },
  },
);

export interface IconButtonProps
  extends React.ButtonHTMLAttributes<HTMLButtonElement>,
    VariantProps<typeof iconButtonVariants> {
  'aria-label': string;
}

export const IconButton = React.forwardRef<HTMLButtonElement, IconButtonProps>(
  ({ className, variant, size, children, 'aria-label': ariaLabel, ...props }, ref) => {
    return (
      <button
        ref={ref}
        aria-label={ariaLabel}
        className={cn(iconButtonVariants({ variant, size, className }))}
        {...props}
      >
        {children}
      </button>
    );
  },
);
IconButton.displayName = 'IconButton';
