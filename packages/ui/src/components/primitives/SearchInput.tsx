import * as React from 'react';
import { Search, X } from 'lucide-react';
import { cn } from '../../utils/cn';

export interface SearchInputProps
  extends Omit<React.InputHTMLAttributes<HTMLInputElement>, 'type'> {
  shortcut?: string;
  onClear?: () => void;
}

export const SearchInput = React.forwardRef<HTMLInputElement, SearchInputProps>(
  ({ className, value, defaultValue, onChange, onClear, shortcut, ...props }, ref) => {
    const inputRef = React.useRef<HTMLInputElement | null>(null);
    const [internalValue, setInternalValue] = React.useState<string>(
      (value ?? defaultValue ?? '') as string,
    );

    React.useImperativeHandle(ref, () => inputRef.current as HTMLInputElement);

    const isControlled = value !== undefined;
    const currentValue = isControlled ? String(value) : internalValue;

    const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
      if (!isControlled) {
        setInternalValue(e.target.value);
      }
      onChange?.(e);
    };

    const handleClear = () => {
      if (!isControlled) {
        setInternalValue('');
      }
      if (inputRef.current) {
        inputRef.current.value = '';
        inputRef.current.focus();
      }
      onClear?.();
    };

    return (
      <div className={cn('relative flex items-center w-full', className)}>
        <Search className="absolute left-3 h-4 w-4 text-[var(--cv-text-subtle)] pointer-events-none" />
        <input
          ref={inputRef}
          type="text"
          value={value}
          defaultValue={defaultValue}
          onChange={handleChange}
          className={cn(
            'h-9 w-full rounded-cv border border-[var(--cv-border)] bg-[var(--cv-surface)] pl-9 pr-14 py-1 text-cv-sm text-[var(--cv-text)] shadow-xs transition-colors',
            'placeholder:text-[var(--cv-text-subtle)]',
            'focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-[var(--cv-border-focus)] focus-visible:border-[var(--cv-accent)]',
            'disabled:cursor-not-allowed disabled:opacity-50',
          )}
          {...props}
        />
        <div className="absolute right-2.5 flex items-center gap-1.5 pointer-events-auto">
          {Boolean(currentValue) && (
            <button
              type="button"
              onClick={handleClear}
              aria-label="Clear search"
              className="p-0.5 rounded-cv-sm text-[var(--cv-text-subtle)] hover:text-[var(--cv-text)] hover:bg-[var(--cv-surface-raised)] transition-colors cursor-pointer"
            >
              <X className="h-3.5 w-3.5" />
            </button>
          )}
          {shortcut && !currentValue && (
            <kbd className="pointer-events-none hidden sm:inline-flex h-5 select-none items-center gap-1 rounded-cv-sm border border-[var(--cv-border)] bg-[var(--cv-bg-elevated)] px-1.5 font-mono text-[10px] font-medium text-[var(--cv-text-subtle)]">
              {shortcut}
            </kbd>
          )}
        </div>
      </div>
    );
  },
);
SearchInput.displayName = 'SearchInput';
