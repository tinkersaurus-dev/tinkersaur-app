import React, { useState, useRef, useEffect } from 'react';
import {
  useFloating,
  autoUpdate,
  offset,
  flip,
  size as floatingSize,
  useClick,
  useDismiss,
  useRole,
  useInteractions,
  FloatingPortal,
  FloatingFocusManager,
} from '@floating-ui/react';
import { LuX } from 'react-icons/lu';

export interface MultiSelectOption {
  value: string;
  label: string;
  disabled?: boolean;
}

export interface MultiSelectProps {
  value?: string[];
  defaultValue?: string[];
  onChange?: (value: string[]) => void;
  options: MultiSelectOption[];
  placeholder?: string;
  disabled?: boolean;
  size?: 'small' | 'medium' | 'large';
  className?: string;
  error?: boolean;
  showSearch?: boolean;
  maxDisplayItems?: number;
}

export function MultiSelect({
  value: controlledValue,
  defaultValue,
  onChange,
  options,
  placeholder = 'Select options',
  disabled = false,
  size = 'medium',
  className = '',
  error = false,
  showSearch = true,
  maxDisplayItems = 2,
}: MultiSelectProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [internalValue, setInternalValue] = useState<string[]>(defaultValue || []);
  const [searchQuery, setSearchQuery] = useState('');
  const searchInputRef = useRef<HTMLInputElement>(null);

  const value = controlledValue !== undefined ? controlledValue : internalValue;

  const { refs, floatingStyles, context } = useFloating({
    open: isOpen,
    onOpenChange: setIsOpen,
    middleware: [
      offset(4),
      flip({ padding: 8 }),
      floatingSize({
        apply({ rects, elements }: { rects: { reference: { width: number } }; elements: { floating: { style: CSSStyleDeclaration } } }) {
          Object.assign(elements.floating.style, {
            minWidth: `${rects.reference.width}px`,
          });
        },
        padding: 8,
      }),
    ],
    whileElementsMounted: autoUpdate,
  });

  const click = useClick(context);
  const dismiss = useDismiss(context);
  const role = useRole(context);

  const { getReferenceProps, getFloatingProps } = useInteractions([
    click,
    dismiss,
    role,
  ]);

  useEffect(() => {
    if (isOpen && showSearch && searchInputRef.current) {
      searchInputRef.current.focus();
    }
    if (!isOpen) {
      setSearchQuery('');
    }
  }, [isOpen, showSearch]);

  const selectedOptions = options.filter(opt => value.includes(opt.value));

  const filteredOptions = showSearch && searchQuery
    ? options.filter(opt =>
        opt.label.toLowerCase().includes(searchQuery.toLowerCase())
      )
    : options;

  const handleToggle = (optionValue: string) => {
    const newValue = value.includes(optionValue)
      ? value.filter(v => v !== optionValue)
      : [...value, optionValue];

    if (controlledValue === undefined) {
      setInternalValue(newValue);
    }
    onChange?.(newValue);
  };

  const handleClear = (e: React.MouseEvent) => {
    e.stopPropagation();
    if (controlledValue === undefined) {
      setInternalValue([]);
    }
    onChange?.([]);
  };

  const handleKeyDown = (e: React.KeyboardEvent, optionValue: string, optionDisabled?: boolean) => {
    if (e.key === 'Enter' || e.key === ' ') {
      e.preventDefault();
      if (!optionDisabled) {
        handleToggle(optionValue);
      }
    }
  };

  const sizeStyles = {
    small: 'h-6 text-xs px-2',
    medium: 'h-9 text-sm px-3',
    large: 'h-11 text-md px-4',
  };

  const baseStyles = `
    flex items-center justify-between gap-2
    bg-[var(--bg)]
    border border-[var(--border-muted)]
    rounded-[var(--radius-sm)]
    cursor-pointer
    transition-all duration-[var(--transition-base)]
    ${sizeStyles[size]}
    ${disabled ? 'opacity-50 cursor-not-allowed' : 'hover:border-[var(--primary)]'}
    ${error ? 'border-[var(--danger)]' : ''}
    ${isOpen ? 'border-[var(--primary)] ring-2 ring-[var(--primary)] ring-opacity-20' : ''}
    ${className}
  `.trim();

  const dropdownStyles = `
    bg-[var(--bg-light)]
    border border-[var(--border-muted)]
    rounded-[var(--radius-sm)]
    shadow-[var(--shadow)]
    max-h-64
    overflow-y-auto
    py-1
    z-50
  `.trim();

  const optionStyles = (optionDisabled?: boolean, isSelected?: boolean) => `
    px-3 py-2
    text-sm
    cursor-pointer
    flex items-center gap-2
    transition-colors duration-[var(--transition-fast)]
    ${optionDisabled ? 'opacity-50 cursor-not-allowed' : 'hover:bg-[var(--bg-dark)]'}
    ${isSelected ? 'bg-[var(--bg-dark)]' : ''}
  `.trim();

  const renderSelectedDisplay = () => {
    if (selectedOptions.length === 0) {
      return <span className="text-[var(--text-muted)]">{placeholder}</span>;
    }

    if (selectedOptions.length <= maxDisplayItems) {
      return (
        <div className="flex flex-wrap gap-1">
          {selectedOptions.map(opt => (
            <span
              key={opt.value}
              className="inline-flex items-center gap-1 px-2 py-0.5 bg-[var(--bg-dark)] rounded text-xs"
            >
              {opt.label}
            </span>
          ))}
        </div>
      );
    }

    return (
      <span className="text-[var(--text)]">
        {selectedOptions.length} selected
      </span>
    );
  };

  return (
    <>
      <div
        ref={refs.setReference}
        className={baseStyles}
        {...getReferenceProps()}
        aria-disabled={disabled}
      >
        <div className="flex-1 overflow-hidden">
          {renderSelectedDisplay()}
        </div>
        <div className="flex items-center gap-1">
          {value.length > 0 && !disabled && (
            <button
              type="button"
              onClick={handleClear}
              className="p-0.5 hover:bg-[var(--bg-dark)] rounded text-[var(--text-muted)] hover:text-[var(--text)]"
            >
              <LuX className="w-3 h-3" />
            </button>
          )}
          <svg
            className={`w-4 h-4 text-[var(--text-muted)] transition-transform duration-[var(--transition-fast)] ${
              isOpen ? 'rotate-180' : ''
            }`}
            fill="none"
            stroke="currentColor"
            viewBox="0 0 24 24"
          >
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
          </svg>
        </div>
      </div>

      {isOpen && (
        <FloatingPortal>
          <FloatingFocusManager context={context} modal={false}>
            <div
              // eslint-disable-next-line react-hooks/refs
              ref={refs.setFloating}
              style={floatingStyles}
              className={dropdownStyles}
              {...getFloatingProps()}
            >
              {showSearch && (
                <div className="px-2 pb-2 pt-1">
                  <input
                    ref={searchInputRef}
                    type="text"
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    placeholder="Search..."
                    className="w-full h-8 px-2 text-xs bg-[var(--bg)] border border-[var(--border)] rounded-[var(--radius-md)] focus:outline-none focus:border-[var(--primary)] focus:ring-2 focus:ring-[var(--primary)] focus:ring-opacity-20"
                  />
                </div>
              )}
              {filteredOptions.length === 0 ? (
                <div className="px-3 py-2 text-[var(--text-muted)] text-xs text-center">
                  No options found
                </div>
              ) : (
                filteredOptions.map((option) => {
                  const isSelected = value.includes(option.value);
                  return (
                    <div
                      key={option.value}
                      className={optionStyles(option.disabled, isSelected)}
                      onClick={() => !option.disabled && handleToggle(option.value)}
                      onKeyDown={(e) => handleKeyDown(e, option.value, option.disabled)}
                      tabIndex={option.disabled ? -1 : 0}
                      role="option"
                      aria-selected={isSelected}
                      aria-disabled={option.disabled}
                    >
                      <input
                        type="checkbox"
                        checked={isSelected}
                        readOnly
                        className="w-4 h-4 rounded border-[var(--border)] cursor-pointer accent-[var(--primary)]"
                      />
                      <span className={isSelected ? 'text-[var(--primary)] font-medium' : 'text-[var(--text)]'}>
                        {option.label}
                      </span>
                    </div>
                  );
                })
              )}
            </div>
          </FloatingFocusManager>
        </FloatingPortal>
      )}
    </>
  );
}
