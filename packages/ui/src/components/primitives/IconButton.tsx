import * as React from 'react';
import { cva, type VariantProps } from 'class-variance-authority';
import { cn } from '../../utils/cn';

export const iconButtonVariants = cva(
  'inline-flex items-center justify-center rounded-gm-full transition-colors focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-[var(--gm-border-focus)] disabled:pointer-events-none disabled:opacity-50 select-none cursor-pointer shrink-0',
  {
    variants: {
      variant: {
        default:
          'bg-[var(--gm-accent)] text-[var(--gm-accent-fg)] hover:bg-[var(--gm-accent-strong)] active:opacity-90',
        ghost:
          'text-[var(--gm-text-muted)] hover:text-[var(--gm-text)] hover:bg-[var(--gm-surface)] active:bg-[var(--gm-surface-raised)]',
        outline:
          'border border-[var(--gm-border)] bg-transparent text-[var(--gm-text)] hover:bg-[var(--gm-surface)] hover:border-[var(--gm-border-strong)]',
        secondary:
          'bg-[var(--gm-surface)] text-[var(--gm-text)] border border-[var(--gm-border)] hover:bg-[var(--gm-surface-raised)]',
        subtle:
          'bg-[var(--gm-surface)]/60 text-[var(--gm-text-muted)] hover:text-[var(--gm-text)] hover:bg-[var(--gm-surface)]',
      },
      size: {
        sm: 'h-7 w-7 text-gm-xs',
        default: 'h-9 w-9 text-gm-sm',
        lg: 'h-11 w-11 text-gm-base',
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
