import React, { useEffect } from 'react';
import { createPortal } from 'react-dom';

export interface ModalProps {
  open: boolean;
  onCancel?: () => void;
  onOk?: () => void;
  title?: React.ReactNode;
  children: React.ReactNode;
  footer?: React.ReactNode;
  width?: number | string;
  okText?: string;
  cancelText?: string;
  okButtonProps?: {
    disabled?: boolean;
    loading?: boolean;
  };
  cancelButtonProps?: {
    disabled?: boolean;
  };
  closable?: boolean;
  maskClosable?: boolean;
  className?: string;
}

export function Modal({
  open,
  onCancel,
  onOk,
  title,
  children,
  footer,
  width = 520,
  okText = 'OK',
  cancelText = 'Cancel',
  okButtonProps = {},
  cancelButtonProps = {},
  closable = true,
  maskClosable = true,
  className = '',
}: ModalProps) {
  // Handle ESC key
  useEffect(() => {
    if (!open) return;

    const handleEsc = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        onCancel?.();
      }
    };

    document.addEventListener('keydown', handleEsc);
    return () => document.removeEventListener('keydown', handleEsc);
  }, [open, onCancel]);

  // Prevent body scroll when modal is open
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
      onCancel?.();
    }
  };

  const modalWidth = typeof width === 'number' ? `${width}px` : width;

  const overlayStyles = `
    fixed inset-0
    bg-black/50
    backdrop-blur-sm
    flex items-center justify-center
    z-50
    animate-fade-in
  `.trim();

  const modalStyles = `
    bg-[var(--bg-light)]
    rounded-sm
    shadow-2xl
    max-h-[90vh]
    flex flex-col
    animate-scale-in
    ${className}
  `.trim();

  const headerStyles = `
    flex items-center justify-between
    px-6 py-4
    border-b border-[var(--border)]
  `.trim();

  const titleStyles = `
    text-xl
    leading-normal
    font-medium
    text-[var(--text)]
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
  `.trim();

  const bodyStyles = `
    px-6 py-4
    overflow-y-auto
    flex-1
  `.trim();

  const footerStyles = `
    flex items-center justify-end gap-3
    px-6 py-4
    border-t border-[var(--border)]
  `.trim();

  const buttonBaseStyles = `
    px-4 h-10
    rounded-sm
    text-base
    leading-normal
    font-medium
    transition-all duration-[var(--transition-base)]
    cursor-pointer
    disabled:opacity-50 disabled:cursor-not-allowed
  `.trim();

  const cancelButtonStyles = `
    ${buttonBaseStyles}
    bg-[var(--bg)]
    border border-[var(--border)]
    text-[var(--text)]
    hover:border-[var(--primary)]
    hover:text-[var(--primary)]
  `.trim();

  const okButtonStyles = `
    ${buttonBaseStyles}
    bg-[var(--primary)]
    text-white
    hover:opacity-90
  `.trim();

  const defaultFooter = (
    <>
      <button
        type="button"
        className={cancelButtonStyles}
        onClick={onCancel}
        disabled={cancelButtonProps.disabled}
      >
        {cancelText}
      </button>
      <button
        type="button"
        className={okButtonStyles}
        onClick={onOk}
        disabled={okButtonProps.disabled || okButtonProps.loading}
      >
        {okButtonProps.loading ? 'Loading...' : okText}
      </button>
    </>
  );

  const modalContent = (
    <div className={overlayStyles} onClick={handleMaskClick}>
      <div className={modalStyles} style={{ width: modalWidth }}>
        {/* Header */}
        {(title || closable) && (
          <div className={headerStyles}>
            <div className={titleStyles}>{title}</div>
            {closable && (
              <div className={closeButtonStyles} onClick={onCancel}>
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
        {(footer !== null) && (
          <div className={footerStyles}>
            {footer !== undefined ? footer : defaultFooter}
          </div>
        )}
      </div>
    </div>
  );

  return createPortal(modalContent, document.body);
}
