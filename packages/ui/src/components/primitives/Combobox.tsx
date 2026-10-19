import * as React from 'react';
import * as PopoverPrimitive from '@radix-ui/react-popover';
import { Check, ChevronsUpDown, Search, X } from 'lucide-react';
import { cn } from '../../utils/cn';

export interface ComboboxOption {
  value: string;
  label: string;
  disabled?: boolean;
}

export interface ComboboxProps {
  options: ComboboxOption[];
  value?: string;
  defaultValue?: string;
  onValueChange?: (value: string) => void;
  placeholder?: string;
  searchPlaceholder?: string;
  emptyText?: string;
  className?: string;
  disabled?: boolean;
}

export function Combobox({
  options,
  value,
  defaultValue,
  onValueChange,
  placeholder = 'Select an option…',
  searchPlaceholder = 'Search…',
  emptyText = 'No results found.',
  className,
  disabled = false,
}: ComboboxProps) {
  const [open, setOpen] = React.useState(false);
  const [internalValue, setInternalValue] = React.useState<string>(
    value ?? defaultValue ?? '',
  );
  const [query, setQuery] = React.useState('');

  const isControlled = value !== undefined;
  const selectedValue = isControlled ? value : internalValue;

  const selectedOption = options.find((opt) => opt.value === selectedValue);

  const filteredOptions = React.useMemo(() => {
    if (!query.trim()) return options;
    const lower = query.toLowerCase();
    return options.filter((opt) => opt.label.toLowerCase().includes(lower));
  }, [options, query]);

  const handleSelect = (val: string) => {
    if (!isControlled) {
      setInternalValue(val);
    }
    onValueChange?.(val);
    setOpen(false);
    setQuery('');
  };

  return (
    <PopoverPrimitive.Root open={open} onOpenChange={setOpen}>
      <PopoverPrimitive.Trigger asChild>
        <button
          type="button"
          role="combobox"
          aria-expanded={open}
          disabled={disabled}
          className={cn(
            'flex h-9 w-full items-center justify-between rounded-cv border border-[var(--gm-border)] bg-[var(--gm-surface)] px-3 py-2 text-gm-sm text-[var(--gm-text)] shadow-xs transition-colors cursor-pointer',
            'hover:bg-[var(--gm-surface-raised)] focus:outline-none focus:ring-1 focus:ring-[var(--gm-border-focus)] focus:border-[var(--gm-accent)]',
            'disabled:cursor-not-allowed disabled:opacity-50',
            !selectedOption && 'text-[var(--gm-text-subtle)]',
            className,
          )}
        >
          <span className="truncate">{selectedOption ? selectedOption.label : placeholder}</span>
          <ChevronsUpDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
        </button>
      </PopoverPrimitive.Trigger>

      <PopoverPrimitive.Portal>
        <PopoverPrimitive.Content
          align="start"
          sideOffset={4}
          className={cn(
            'z-[var(--gm-z-dropdown)] w-[var(--radix-popover-trigger-width)] min-w-[12rem] overflow-hidden rounded-gm-md border border-[var(--gm-border-strong)] bg-[var(--gm-bg-elevated)] p-1 text-[var(--gm-text)] shadow-lg outline-none',
            'data-[state=open]:animate-in data-[state=closed]:animate-out data-[state=closed]:fade-out-0 data-[state=open]:fade-in-0 data-[state=closed]:zoom-out-95 data-[state=open]:zoom-in-95',
          )}
        >
          <div className="relative flex items-center border-b border-[var(--gm-border)] px-2 pb-1.5 pt-1">
            <Search className="mr-2 h-3.5 w-3.5 text-[var(--gm-text-subtle)] shrink-0" />
            <input
              type="text"
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              placeholder={searchPlaceholder}
              className="w-full bg-transparent text-gm-sm text-[var(--gm-text)] placeholder:text-[var(--gm-text-subtle)] focus:outline-none"
            />
            {query && (
              <button
                type="button"
                onClick={() => setQuery('')}
                className="text-[var(--gm-text-subtle)] hover:text-[var(--gm-text)]"
              >
                <X className="h-3 w-3" />
              </button>
            )}
          </div>

          <div className="max-h-60 overflow-y-auto py-1">
            {filteredOptions.length === 0 ? (
              <div className="py-4 text-center text-gm-xs text-[var(--gm-text-muted)]">
                {emptyText}
              </div>
            ) : (
              filteredOptions.map((opt) => {
                const isSelected = opt.value === selectedValue;
                return (
                  <button
                    key={opt.value}
                    type="button"
                    disabled={opt.disabled}
                    onClick={() => handleSelect(opt.value)}
                    className={cn(
                      'relative flex w-full cursor-pointer select-none items-center rounded-gm-sm px-2 py-1.5 text-gm-sm outline-none transition-colors text-left',
                      'hover:bg-[var(--gm-surface)] hover:text-[var(--gm-text)] focus:bg-[var(--gm-surface)]',
                      isSelected ? 'text-[var(--gm-accent-strong)] font-medium' : 'text-[var(--gm-text)]',
                      opt.disabled && 'pointer-events-none opacity-50',
                    )}
                  >
                    <span className="flex-1 truncate">{opt.label}</span>
                    {isSelected && (
                      <Check className="ml-2 h-4 w-4 text-[var(--gm-accent-strong)] shrink-0" />
                    )}
                  </button>
                );
              })
            )}
          </div>
        </PopoverPrimitive.Content>
      </PopoverPrimitive.Portal>
    </PopoverPrimitive.Root>
  );
}
