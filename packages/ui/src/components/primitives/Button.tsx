import * as React from 'react';
import { Slot } from '@radix-ui/react-slot';
import { cva, type VariantProps } from 'class-variance-authority';
import { cn } from '../../utils/cn';

export const buttonVariants = cva(
  'inline-flex items-center justify-center whitespace-nowrap rounded-none text-gm-sm font-semibold tracking-tight transition-all focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-[var(--gm-border-focus)] disabled:pointer-events-none disabled:opacity-50 select-none cursor-pointer',
  {
    variants: {
      variant: {
        default:
          'bg-[var(--gm-accent)] text-[var(--gm-accent-fg)] border border-[var(--gm-border-strong)] shadow-[2px_2px_0px_var(--gm-border-strong)] hover:bg-[var(--gm-accent-strong)] hover:translate-x-[-1px] hover:translate-y-[-1px] hover:shadow-[3px_3px_0px_var(--gm-border-strong)] active:translate-x-0 active:translate-y-0',
        destructive:
          'bg-[var(--gm-danger)] text-white border border-[var(--gm-danger)] shadow-[2px_2px_0px_rgba(0,0,0,0.25)] hover:opacity-90 active:opacity-80',
        outline:
          'border border-[var(--gm-border-strong)] bg-[var(--gm-bg-elevated)]/85 text-[var(--gm-text)] shadow-[2px_2px_0px_var(--gm-border)] hover:bg-[var(--gm-surface)] hover:shadow-[3px_3px_0px_var(--gm-accent)] active:bg-[var(--gm-surface-raised)]',
        secondary:
          'bg-[var(--gm-surface)] text-[var(--gm-text)] border border-[var(--gm-border-strong)] hover:bg-[var(--gm-surface-raised)] active:bg-[var(--gm-surface-hover)]',
        ghost:
          'text-[var(--gm-text-muted)] hover:text-[var(--gm-text)] hover:bg-[var(--gm-surface)] active:bg-[var(--gm-surface-raised)]',
        link: 'text-[var(--gm-accent-strong)] underline-offset-4 hover:underline',
      },
      size: {
        default: 'h-9 px-4 py-2',
        sm: 'h-7 px-2.5 text-gm-xs',
        lg: 'h-11 px-6 text-gm-base',
        icon: 'h-9 w-9 p-0',
      },
    },
    defaultVariants: {
      variant: 'default',
      size: 'default',
    },
  },
);

export interface ButtonProps
  extends React.ButtonHTMLAttributes<HTMLButtonElement>,
    VariantProps<typeof buttonVariants> {
  asChild?: boolean;
}

export const Button = React.forwardRef<HTMLButtonElement, ButtonProps>(
  ({ className, variant, size, asChild = false, ...props }, ref) => {
    const Comp = asChild ? Slot : 'button';
    return (
      <Comp
        className={cn(buttonVariants({ variant, size, className }))}
        ref={ref}
        {...props}
      />
    );
  },
);
Button.displayName = 'Button';
