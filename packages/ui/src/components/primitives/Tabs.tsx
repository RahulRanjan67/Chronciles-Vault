import * as React from 'react';
import * as TabsPrimitive from '@radix-ui/react-tabs';
import { cn } from '../../utils/cn';

export const Tabs = TabsPrimitive.Root;

export interface TabsListProps
  extends React.ComponentPropsWithoutRef<typeof TabsPrimitive.List> {
  variant?: 'horizontal' | 'vertical' | 'pills';
}

export const TabsList = React.forwardRef<
  React.ElementRef<typeof TabsPrimitive.List>,
  TabsListProps
>(({ className, variant = 'horizontal', ...props }, ref) => (
  <TabsPrimitive.List
    ref={ref}
    className={cn(
      'inline-flex items-center text-[var(--cv-text-muted)]',
      variant === 'horizontal' &&
        'h-10 w-full justify-start border-b border-[var(--cv-border)] bg-transparent p-0 gap-6',
      variant === 'vertical' &&
        'flex-col h-auto w-48 justify-start border-r border-[var(--cv-border)] bg-transparent p-1 gap-1 items-stretch',
      variant === 'pills' &&
        'h-9 rounded-cv-md bg-[var(--cv-surface)] p-1 gap-1',
      className,
    )}
    {...props}
  />
));
TabsList.displayName = TabsPrimitive.List.displayName;

export interface TabsTriggerProps
  extends React.ComponentPropsWithoutRef<typeof TabsPrimitive.Trigger> {
  variant?: 'underline' | 'pill';
}

export const TabsTrigger = React.forwardRef<
  React.ElementRef<typeof TabsPrimitive.Trigger>,
  TabsTriggerProps
>(({ className, variant = 'underline', ...props }, ref) => (
  <TabsPrimitive.Trigger
    ref={ref}
    className={cn(
      'inline-flex items-center justify-center whitespace-nowrap text-cv-sm font-medium transition-all select-none cursor-pointer',
      'focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-[var(--cv-border-focus)]',
      'disabled:pointer-events-none disabled:opacity-50',
      variant === 'underline' &&
        'relative pb-2.5 pt-2 text-[var(--cv-text-muted)] hover:text-[var(--cv-text)] data-[state=active]:text-[var(--cv-text)] data-[state=active]:font-semibold after:absolute after:bottom-0 after:left-0 after:right-0 after:h-0.5 after:rounded-full after:bg-transparent data-[state=active]:after:bg-[var(--cv-accent)]',
      variant === 'pill' &&
        'rounded-cv px-3 py-1.5 text-cv-sm text-[var(--cv-text-muted)] hover:text-[var(--cv-text)] hover:bg-[var(--cv-surface-raised)] data-[state=active]:bg-[var(--cv-bg-elevated)] data-[state=active]:text-[var(--cv-text)] data-[state=active]:shadow-xs',
      className,
    )}
    {...props}
  />
));
TabsTrigger.displayName = TabsPrimitive.Trigger.displayName;

export const TabsContent = React.forwardRef<
  React.ElementRef<typeof TabsPrimitive.Content>,
  React.ComponentPropsWithoutRef<typeof TabsPrimitive.Content>
>(({ className, ...props }, ref) => (
  <TabsPrimitive.Content
    ref={ref}
    className={cn(
      'mt-3 focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-[var(--cv-border-focus)]',
      className,
    )}
    {...props}
  />
));
TabsContent.displayName = TabsPrimitive.Content.displayName;
