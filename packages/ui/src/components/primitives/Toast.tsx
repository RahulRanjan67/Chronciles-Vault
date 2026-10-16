import * as React from 'react';
import * as ToastPrimitive from '@radix-ui/react-toast';
import { cva, type VariantProps } from 'class-variance-authority';
import { AlertCircle, CheckCircle, Info, TriangleAlert, X } from 'lucide-react';
import { cn } from '../../utils/cn';

export const ToastProvider = ToastPrimitive.Provider;

export const ToastViewport = React.forwardRef<
  React.ElementRef<typeof ToastPrimitive.Viewport>,
  React.ComponentPropsWithoutRef<typeof ToastPrimitive.Viewport>
>(({ className, ...props }, ref) => (
  <ToastPrimitive.Viewport
    ref={ref}
    className={cn(
      'fixed bottom-0 right-0 z-[var(--cv-z-toast)] flex max-h-screen w-full flex-col-reverse p-4 sm:max-w-[380px]',
      className,
    )}
    {...props}
  />
));
ToastViewport.displayName = ToastPrimitive.Viewport.displayName;

const toastVariants = cva(
  'group pointer-events-auto relative flex w-full items-center justify-between space-x-3 overflow-hidden rounded-cv-lg border p-4 shadow-xl transition-all data-[swipe=cancel]:translate-x-0 data-[swipe=end]:translate-x-[var(--radix-toast-swipe-end-x)] data-[swipe=move]:translate-x-[var(--radix-toast-swipe-move-x)] data-[swipe=move]:transition-none data-[state=open]:animate-in data-[state=closed]:animate-out data-[swipe=end]:animate-out data-[state=closed]:fade-out-80 data-[state=closed]:slide-out-to-right-full data-[state=open]:slide-in-from-bottom-full',
  {
    variants: {
      variant: {
        default:
          'border-[var(--cv-border-strong)] bg-[var(--cv-bg-elevated)] text-[var(--cv-text)]',
        success:
          'border-[var(--cv-success)]/30 bg-[var(--cv-bg-elevated)] text-[var(--cv-text)]',
        destructive:
          'border-[var(--cv-danger)]/40 bg-[var(--cv-bg-elevated)] text-[var(--cv-text)]',
        warning:
          'border-[var(--cv-warning)]/40 bg-[var(--cv-bg-elevated)] text-[var(--cv-text)]',
      },
    },
    defaultVariants: {
      variant: 'default',
    },
  },
);

export const Toast = React.forwardRef<
  React.ElementRef<typeof ToastPrimitive.Root>,
  React.ComponentPropsWithoutRef<typeof ToastPrimitive.Root> &
    VariantProps<typeof toastVariants>
>(({ className, variant, ...props }, ref) => {
  return (
    <ToastPrimitive.Root
      ref={ref}
      className={cn(toastVariants({ variant }), className)}
      {...props}
    />
  );
});
Toast.displayName = ToastPrimitive.Root.displayName;

export const ToastAction = React.forwardRef<
  React.ElementRef<typeof ToastPrimitive.Action>,
  React.ComponentPropsWithoutRef<typeof ToastPrimitive.Action>
>(({ className, ...props }, ref) => (
  <ToastPrimitive.Action
    ref={ref}
    className={cn(
      'inline-flex h-8 shrink-0 items-center justify-center rounded-cv border border-[var(--cv-border)] bg-transparent px-3 text-cv-xs font-medium text-[var(--cv-text)] transition-colors hover:bg-[var(--cv-surface)] focus:outline-none focus:ring-1 focus:ring-[var(--cv-border-focus)] disabled:pointer-events-none disabled:opacity-50 cursor-pointer',
      className,
    )}
    {...props}
  />
));
ToastAction.displayName = ToastPrimitive.Action.displayName;

export const ToastClose = React.forwardRef<
  React.ElementRef<typeof ToastPrimitive.Close>,
  React.ComponentPropsWithoutRef<typeof ToastPrimitive.Close>
>(({ className, ...props }, ref) => (
  <ToastPrimitive.Close
    ref={ref}
    className={cn(
      'absolute right-2 top-2 rounded-cv-sm p-1 text-[var(--cv-text-subtle)] opacity-0 transition-opacity hover:text-[var(--cv-text)] group-hover:opacity-100 focus:opacity-100 focus:outline-none focus:ring-1 cursor-pointer',
      className,
    )}
    toast-close=""
    {...props}
  >
    <X className="h-4 w-4" />
  </ToastPrimitive.Close>
));
ToastClose.displayName = ToastPrimitive.Close.displayName;

export const ToastTitle = React.forwardRef<
  React.ElementRef<typeof ToastPrimitive.Title>,
  React.ComponentPropsWithoutRef<typeof ToastPrimitive.Title>
>(({ className, ...props }, ref) => (
  <ToastPrimitive.Title
    ref={ref}
    className={cn('text-cv-sm font-semibold text-[var(--cv-text)]', className)}
    {...props}
  />
));
ToastTitle.displayName = ToastPrimitive.Title.displayName;

export const ToastDescription = React.forwardRef<
  React.ElementRef<typeof ToastPrimitive.Description>,
  React.ComponentPropsWithoutRef<typeof ToastPrimitive.Description>
>(({ className, ...props }, ref) => (
  <ToastPrimitive.Description
    ref={ref}
    className={cn('text-cv-xs text-[var(--cv-text-muted)]', className)}
    {...props}
  />
));
ToastDescription.displayName = ToastPrimitive.Description.displayName;

// Simple stateful Toast Store for use across app
export interface ToastItem {
  id: string;
  title?: React.ReactNode;
  description?: React.ReactNode;
  variant?: 'default' | 'success' | 'destructive' | 'warning';
  action?: {
    label: string;
    onClick: () => void;
  };
  duration?: number;
}

type ToastListener = (toasts: ToastItem[]) => void;
let memoryToasts: ToastItem[] = [];
const listeners = new Set<ToastListener>();

function notify() {
  listeners.forEach((l) => l([...memoryToasts]));
}

export function toast(props: Omit<ToastItem, 'id'>) {
  const id = Math.random().toString(36).slice(2, 9);
  const newToast: ToastItem = { ...props, id };
  memoryToasts = [newToast, ...memoryToasts].slice(0, 5);
  notify();

  return {
    id,
    dismiss: () => {
      memoryToasts = memoryToasts.filter((t) => t.id !== id);
      notify();
    },
  };
}

export function useToast() {
  const [toasts, setToasts] = React.useState<ToastItem[]>(memoryToasts);

  React.useEffect(() => {
    listeners.add(setToasts);
    return () => {
      listeners.delete(setToasts);
    };
  }, []);

  const dismiss = React.useCallback((id: string) => {
    memoryToasts = memoryToasts.filter((t) => t.id !== id);
    notify();
  }, []);

  return {
    toasts,
    toast,
    dismiss,
  };
}

export function Toaster() {
  const { toasts, dismiss } = useToast();

  return (
    <ToastProvider>
      {toasts.map(({ id, title, description, variant, action, duration = 4000 }) => {
        const Icon =
          variant === 'success'
            ? CheckCircle
            : variant === 'destructive'
            ? AlertCircle
            : variant === 'warning'
            ? TriangleAlert
            : Info;

        const iconColor =
          variant === 'success'
            ? 'text-[var(--cv-success)]'
            : variant === 'destructive'
            ? 'text-[var(--cv-danger)]'
            : variant === 'warning'
            ? 'text-[var(--cv-warning)]'
            : 'text-[var(--cv-accent-strong)]';

        return (
          <Toast
            key={id}
            variant={variant}
            duration={duration}
            onOpenChange={(open) => {
              if (!open) dismiss(id);
            }}
          >
            <div className="flex items-start gap-3 flex-1">
              <Icon className={cn('h-4 w-4 shrink-0 mt-0.5', iconColor)} />
              <div className="grid gap-1">
                {title && <ToastTitle>{title}</ToastTitle>}
                {description && <ToastDescription>{description}</ToastDescription>}
              </div>
            </div>
            {action && (
              <ToastAction altText={action.label} onClick={action.onClick}>
                {action.label}
              </ToastAction>
            )}
            <ToastClose />
          </Toast>
        );
      })}
      <ToastViewport />
    </ToastProvider>
  );
}
