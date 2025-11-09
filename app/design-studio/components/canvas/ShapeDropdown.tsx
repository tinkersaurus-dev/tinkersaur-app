import { useRef, type ChangeEvent } from 'react';
import './ShapeDropdown.css';

export interface ShapeDropdownProps {
  value: string | undefined;
  options: { value: string; label: string }[];
  onChange: (newValue: string) => void;
  fontSize?: number;
  className?: string;
  style?: React.CSSProperties;
  placeholder?: string;
}

export function ShapeDropdown({
  value,
  options,
  onChange,
  fontSize = 12,
  className,
  style,
  placeholder = 'Select...',
}: ShapeDropdownProps) {
  const selectRef = useRef<HTMLSelectElement>(null);

  const handleChange = (e: ChangeEvent<HTMLSelectElement>) => {
    onChange(e.target.value);
  };

  // Structural styles for the dropdown
  const selectStyle: React.CSSProperties = {
    fontSize: `${fontSize}px`,
    fontFamily: 'inherit',
    textAlign: 'center',
    outline: 'none',
    width: '100%',
    ...style,
  };


  return (
    <div
      data-interactive="true"
      className={className}
      style={{
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        ...style,
      }}
    >
      <select
        ref={selectRef}
        value={value || ''}
        onChange={handleChange}
        className="shape-dropdown"
        style={selectStyle}
      >
        <option value="">{placeholder}</option>
        {options.map((option) => (
          <option key={option.value} value={option.value}>
            {option.label}
          </option>
        ))}
      </select>
    </div>
  );
}
