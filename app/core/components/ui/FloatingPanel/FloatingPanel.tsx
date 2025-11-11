import React, { useEffect } from 'react';
import { LuX } from 'react-icons/lu';

export interface FloatingPanelProps {
  open: boolean;
  onClose?: () => void;
  title?: React.ReactNode;
  children: React.ReactNode;
  footer?: React.ReactNode;
  width?: number | string;
  closable?: boolean;
  backdropClosable?: boolean;
  className?: string;
}

/**
 * FloatingPanel - A non-blocking overlay panel component
 *
 * Floats over content in a fixed position without blocking user interaction.
 * Useful for displaying contextual information while allowing continued work.
 *
 * Features:
 * - ESC key support
 * - Non-blocking (no backdrop)
 * - Fixed positioning (top-right corner)
 * - Customizable width, header, footer
 * - Smooth animations
 */
export function FloatingPanel({
  open,
  onClose,
  title,
  children,
  footer,
  width = 600,
  closable = true,
  backdropClosable = true,
  className = '',
}: FloatingPanelProps) {
  // Handle ESC key
  useEffect(() => {
    if (!open) return;

    const handleEsc = (e: KeyboardEvent) => {
      if (e.key === 'Escape' && closable) {
        onClose?.();
      }
    };

    document.addEventListener('keydown', handleEsc);
    return () => document.removeEventListener('keydown', handleEsc);
  }, [open, onClose, closable]);

  if (!open) return null;

  const panelWidth = typeof width === 'number' ? `${width}px` : width;

  const panelStyles = `
    fixed
    bg-[var(--bg-light)]
    border border-[var(--border)]
    rounded-sm
    shadow-lg
    max-h-[80vh]
    flex flex-col
    z-50
    animate-scale-in
    ${className}
  `.trim();

  const headerStyles = `
    flex items-center justify-between
    px-4 py-2
    border-b border-[var(--border)]
  `.trim();

  const titleStyles = `
    text-sm
    leading-normal
    font-medium
    text-[var(--text)]
  `.trim();

  const closeButtonStyles = `
    flex items-center justify-center
    rounded-sm
    text-[var(--text-muted)]
    hover:text-[var(--text)]
    hover:bg-[var(--bg-dark)]
    transition-all duration-[var(--transition-fast)]
    cursor-pointer
  `.trim();

  const bodyStyles = `
    px-4 py-2
    overflow-y-auto
    flex-1
  `.trim();

  const footerStyles = `
    flex items-center justify-end gap-3
    px-4 py-2
    border-t border-[var(--border)]
  `.trim();

  return (
    <div
      className={panelStyles}
      style={{
        width: panelWidth,
        top: '80px',
        right: '20px',
      }}
    >
      {/* Header */}
      {(title || closable) && (
        <div className={headerStyles}>
          <div className={titleStyles}>{title}</div>
          {closable && (
            <div className={closeButtonStyles} onClick={onClose}>
              <LuX />
            </div>
          )}
        </div>
      )}

      {/* Body */}
      <div className={bodyStyles}>{children}</div>

      {/* Footer */}
      {footer && <div className={footerStyles}>{footer}</div>}
    </div>
  );
}
