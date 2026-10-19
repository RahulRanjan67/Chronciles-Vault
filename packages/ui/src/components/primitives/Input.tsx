import * as React from 'react';
import { cn } from '../../utils/cn';

export interface InputProps extends React.InputHTMLAttributes<HTMLInputElement> {
  label?: string;
  error?: string;
  hint?: string;
}

export const Input = React.forwardRef<HTMLInputElement, InputProps>(
  ({ className, type = 'text', label, error, hint, id, ...props }, ref) => {
    const generatedId = React.useId();
    const inputId = id ?? generatedId;
    const errorId = `${inputId}-error`;
    const hintId = `${inputId}-hint`;

    return (
      <div className="w-full flex flex-col gap-1.5">
        {label && (
          <label
            htmlFor={inputId}
            className="text-gm-xs font-medium text-[var(--gm-text-muted)] select-none"
          >
            {label}
          </label>
        )}
        <input
          id={inputId}
          type={type}
          ref={ref}
          aria-invalid={error ? 'true' : undefined}
          aria-describedby={
            error ? errorId : hint ? hintId : undefined
          }
          className={cn(
            'flex h-9 w-full rounded-cv border border-[var(--gm-border)] bg-[var(--gm-surface)] px-3 py-1 text-gm-sm text-[var(--gm-text)] shadow-xs transition-colors',
            'placeholder:text-[var(--gm-text-subtle)]',
            'focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-[var(--gm-border-focus)] focus-visible:border-[var(--gm-accent)]',
            'disabled:cursor-not-allowed disabled:opacity-50',
            error && 'border-[var(--gm-danger)] focus-visible:ring-[var(--gm-danger)]',
            className,
          )}
          {...props}
        />
        {error ? (
          <p id={errorId} className="text-gm-xs text-[var(--gm-danger)]">
            {error}
          </p>
        ) : hint ? (
          <p id={hintId} className="text-gm-xs text-[var(--gm-text-subtle)]">
            {hint}
          </p>
        ) : null}
      </div>
    );
  },
);
Input.displayName = 'Input';
