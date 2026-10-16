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
            className="text-cv-xs font-medium text-[var(--cv-text-muted)] select-none"
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
            'flex h-9 w-full rounded-cv border border-[var(--cv-border)] bg-[var(--cv-surface)] px-3 py-1 text-cv-sm text-[var(--cv-text)] shadow-xs transition-colors',
            'placeholder:text-[var(--cv-text-subtle)]',
            'focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-[var(--cv-border-focus)] focus-visible:border-[var(--cv-accent)]',
            'disabled:cursor-not-allowed disabled:opacity-50',
            error && 'border-[var(--cv-danger)] focus-visible:ring-[var(--cv-danger)]',
            className,
          )}
          {...props}
        />
        {error ? (
          <p id={errorId} className="text-cv-xs text-[var(--cv-danger)]">
            {error}
          </p>
        ) : hint ? (
          <p id={hintId} className="text-cv-xs text-[var(--cv-text-subtle)]">
            {hint}
          </p>
        ) : null}
      </div>
    );
  },
);
Input.displayName = 'Input';
