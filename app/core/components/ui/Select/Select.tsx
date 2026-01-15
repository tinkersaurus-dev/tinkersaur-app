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

export interface SelectOption {
  value: string;
  label: string;
  disabled?: boolean;
}

export interface SelectProps {
  value?: string;
  defaultValue?: string;
  onChange?: (value: string) => void;
  options: SelectOption[];
  placeholder?: string;
  disabled?: boolean;
  size?: 'small' | 'medium' | 'large';
  className?: string;
  error?: boolean;
  showSearch?: boolean;
}

export function Select({
  value: controlledValue,
  defaultValue,
  onChange,
  options,
  placeholder = 'Select an option',
  disabled = false,
  size = 'medium',
  className = '',
  error = false,
  showSearch = false,
}: SelectProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [internalValue, setInternalValue] = useState(defaultValue || '');
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

  // Focus search input when dropdown opens
  useEffect(() => {
    if (isOpen && showSearch && searchInputRef.current) {
      searchInputRef.current.focus();
    }
    if (!isOpen) {
      setSearchQuery('');
    }
  }, [isOpen, showSearch]);

  const selectedOption = options.find(opt => opt.value === value);

  const filteredOptions = showSearch && searchQuery
    ? options.filter(opt =>
        opt.label.toLowerCase().includes(searchQuery.toLowerCase())
      )
    : options;

  const handleSelect = (optionValue: string) => {
    if (controlledValue === undefined) {
      setInternalValue(optionValue);
    }
    onChange?.(optionValue);
    setIsOpen(false);
  };

  const handleKeyDown = (e: React.KeyboardEvent, optionValue: string, optionDisabled?: boolean) => {
    if (e.key === 'Enter' || e.key === ' ') {
      e.preventDefault();
      if (!optionDisabled) {
        handleSelect(optionValue);
      }
    }
  };

  // Size styles
  const sizeStyles = {
    small: 'h-6 text-xs px-2',
    medium: 'h-9 text-base px-3',
    large: 'h-11 text-lg px-4',
  };

  const baseStyles = `
    flex items-center justify-between
    bg-[var(--bg-light)]
    border border-[var(--border-muted)]
    rounded-sm
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
    rounded-sm
    shadow-[var(--shadow)]
    max-h-64
    overflow-y-auto
    py-1
    z-50
    text-xs
  `.trim();

  const optionStyles = (optionDisabled?: boolean, isSelected?: boolean) => `
    px-3 py-2
    text-xs
    cursor-pointer
    transition-colors duration-[var(--transition-fast)]
    ${optionDisabled ? 'opacity-50 cursor-not-allowed' : 'hover:bg-[var(--bg-dark)]'}
    ${isSelected ? 'bg-[var(--bg-dark)] text-[var(--primary)] font-medium' : 'text-[var(--text)]'}
  `.trim();

  return (
    <>
      <div
        ref={refs.setReference}
        className={baseStyles}
        {...getReferenceProps()}
        aria-disabled={disabled}
      >
        <span className={selectedOption ? 'text-[var(--text)]' : 'text-[var(--text-muted)]'}>
          {selectedOption ? selectedOption.label : placeholder}
        </span>
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

      {isOpen && (
        <FloatingPortal>
          <FloatingFocusManager context={context} modal={false}>
            <div
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
                filteredOptions.map((option) => (
                  <div
                    key={option.value}
                    className={optionStyles(option.disabled, option.value === value)}
                    onClick={() => !option.disabled && handleSelect(option.value)}
                    onKeyDown={(e) => handleKeyDown(e, option.value, option.disabled)}
                    tabIndex={option.disabled ? -1 : 0}
                    role="option"
                    aria-selected={option.value === value}
                    aria-disabled={option.disabled}
                  >
                    {option.label}
                  </div>
                ))
              )}
            </div>
          </FloatingFocusManager>
        </FloatingPortal>
      )}
    </>
  );
}
