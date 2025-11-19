import React from 'react';
import { Button } from '~/core/components/ui/Button';

export interface ToolbarButton {
  id: string;
  icon: React.ReactNode;
  onClick: (buttonElement?: HTMLButtonElement) => void;
  tooltip?: string;
  disabled?: boolean;
  active?: boolean;
}

export interface CanvasToolbarProps {
  placement: 'top' | 'bottom' | 'left' | 'right';
  buttons: ToolbarButton[];
}

const CanvasToolbar: React.FC<CanvasToolbarProps> = ({ placement, buttons }) => {
  const isVertical = placement === 'left' || placement === 'right';

  // Position styles based on placement
  const positionStyles: React.CSSProperties = {
    top: placement === 'top' ? '12px' : placement === 'bottom' ? undefined : '50%',
    bottom: placement === 'bottom' ? '12px' : undefined,
    left: placement === 'left' ? '12px' : placement === 'right' ? undefined : '50%',
    right: placement === 'right' ? '12px' : undefined,
    transform:
      placement === 'top' || placement === 'bottom'
        ? 'translateX(-50%)'
        : placement === 'left' || placement === 'right'
        ? 'translateY(-50%)'
        : undefined,
  };

  return (
    <div
      className="absolute z-10 flex gap-1 p-1"
      style={positionStyles}
    >
      <div
        className={`flex gap-1 ${isVertical ? 'flex-col' : 'flex-row'}`}
      >
        {buttons.map((button) => (
          <Button
            key={button.id}
            size="small"
            variant="default"
            icon={button.icon}
            onClick={(e) => {
              const buttonElement = e.currentTarget as HTMLButtonElement;
              button.onClick(buttonElement);
            }}
            disabled={button.disabled}
            title={button.tooltip}
            className={`
              bg-transparent hover:bg-[var(--highlight)]
              transition-colors duration-150
              ${button.active ? 'bg-[var(--highlight)] border-[var(--primary)]' : 'border-transparent'}
            `}
          />
        ))}
      </div>
    </div>
  );
};

export default CanvasToolbar;
