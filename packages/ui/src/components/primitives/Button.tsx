import * as React from 'react';
import { Slot } from '@radix-ui/react-slot';
import { cva, type VariantProps } from 'class-variance-authority';
import { cn } from '../../utils/cn';

export const buttonVariants = cva(
  'inline-flex items-center justify-center whitespace-nowrap rounded-none text-cv-sm font-semibold tracking-tight transition-all focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-[var(--cv-border-focus)] disabled:pointer-events-none disabled:opacity-50 select-none cursor-pointer',
  {
    variants: {
      variant: {
        default:
          'bg-[var(--cv-accent)] text-[var(--cv-accent-fg)] border border-[var(--cv-border-strong)] shadow-[2px_2px_0px_var(--cv-border-strong)] hover:bg-[var(--cv-accent-strong)] hover:translate-x-[-1px] hover:translate-y-[-1px] hover:shadow-[3px_3px_0px_var(--cv-border-strong)] active:translate-x-0 active:translate-y-0',
        destructive:
          'bg-[var(--cv-danger)] text-white border border-[var(--cv-danger)] shadow-[2px_2px_0px_rgba(0,0,0,0.25)] hover:opacity-90 active:opacity-80',
        outline:
          'border border-[var(--cv-border-strong)] bg-[var(--cv-bg-elevated)]/85 text-[var(--cv-text)] shadow-[2px_2px_0px_var(--cv-border)] hover:bg-[var(--cv-surface)] hover:shadow-[3px_3px_0px_var(--cv-accent)] active:bg-[var(--cv-surface-raised)]',
        secondary:
          'bg-[var(--cv-surface)] text-[var(--cv-text)] border border-[var(--cv-border-strong)] hover:bg-[var(--cv-surface-raised)] active:bg-[var(--cv-surface-hover)]',
        ghost:
          'text-[var(--cv-text-muted)] hover:text-[var(--cv-text)] hover:bg-[var(--cv-surface)] active:bg-[var(--cv-surface-raised)]',
        link: 'text-[var(--cv-accent-strong)] underline-offset-4 hover:underline',
      },
      size: {
        default: 'h-9 px-4 py-2',
        sm: 'h-7 px-2.5 text-cv-xs',
        lg: 'h-11 px-6 text-cv-base',
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
