import React, { useEffect } from 'react';
import { createPortal } from 'react-dom';

export interface DrawerProps {
  open: boolean;
  onClose?: () => void;
  title?: React.ReactNode;
  children: React.ReactNode;
  footer?: React.ReactNode;
  width?: number | string;
  placement?: 'left' | 'right';
  closable?: boolean;
  maskClosable?: boolean;
  className?: string;
}

export function Drawer({
  open,
  onClose,
  title,
  children,
  footer,
  width = 400,
  placement = 'right',
  closable = true,
  maskClosable = true,
  className = '',
}: DrawerProps) {
  // Handle ESC key
  useEffect(() => {
    if (!open) return;

    const handleEsc = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        onClose?.();
      }
    };

    document.addEventListener('keydown', handleEsc);
    return () => document.removeEventListener('keydown', handleEsc);
  }, [open, onClose]);

  // Prevent body scroll when drawer is open
  useEffect(() => {
    if (open) {
      document.body.style.overflow = 'hidden';
      return () => {
        document.body.style.overflow = '';
      };
    }
  }, [open]);

  if (!open) return null;

  const handleMaskClick = (e: React.MouseEvent) => {
    if (maskClosable && e.target === e.currentTarget) {
      onClose?.();
    }
  };

  const drawerWidth = typeof width === 'number' ? `${width}px` : width;

  const overlayStyles = `
    fixed inset-0
    bg-black/50
    backdrop-blur-sm
    z-50
    transition-opacity duration-300
  `.trim();

  const drawerStyles = `
    fixed top-0 ${placement === 'right' ? 'right-0' : 'left-0'}
    h-full
    bg-[var(--bg-light)]
    shadow-2xl
    flex flex-col
    z-50
    transform transition-transform duration-300 ease-out
    ${className}
  `.trim();

  const headerStyles = `
    flex items-center justify-between
    px-6 py-4
    border-b border-[var(--border)]
    flex-shrink-0
  `.trim();

  const titleStyles = `
    text-lg
    leading-normal
    font-medium
    text-[var(--text)]
    flex-1
  `.trim();

  const closeButtonStyles = `
    w-8 h-8
    flex items-center justify-center
    rounded-sm
    text-[var(--text-muted)]
    hover:text-[var(--text)]
    hover:bg-[var(--bg-dark)]
    transition-all duration-[var(--transition-fast)]
    cursor-pointer
    flex-shrink-0
  `.trim();

  const bodyStyles = `
    px-6 py-4
    overflow-y-auto
    flex-1
  `.trim();

  const footerStyles = `
    flex items-center
    px-6 py-4
    border-t border-[var(--border)]
    flex-shrink-0
  `.trim();

  const drawerContent = (
    <div className={overlayStyles} onClick={handleMaskClick}>
      <div
        className={drawerStyles}
        style={{ width: drawerWidth }}
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        {(title || closable) && (
          <div className={headerStyles}>
            <div className={titleStyles}>{title}</div>
            {closable && (
              <div className={closeButtonStyles} onClick={onClose}>
                <svg
                  className="w-5 h-5"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M6 18L18 6M6 6l12 12"
                  />
                </svg>
              </div>
            )}
          </div>
        )}

        {/* Body */}
        <div className={bodyStyles}>{children}</div>

        {/* Footer */}
        {footer && <div className={footerStyles}>{footer}</div>}
      </div>
    </div>
  );

  return createPortal(drawerContent, document.body);
}
