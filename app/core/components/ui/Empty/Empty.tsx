/**
 * Empty Component
 * Displays empty state placeholder with optional image and description
 */

import type { ReactNode, CSSProperties } from 'react';
import { MdOutlineInbox } from 'react-icons/md';

// Simple empty state icon using react-icons
const SimpleEmptyImage = () => (
  <MdOutlineInbox
    size={64}
    style={{
      color: 'var(--border-muted)',
      opacity: 0.5
    }}
  />
);

export interface EmptyProps {
  description?: ReactNode;
  image?: 'simple' | ReactNode;
  className?: string;
  style?: CSSProperties;
}

export const PRESENTED_IMAGE_SIMPLE = 'simple';

export function Empty({
  description = 'No Data',
  image,
  className = '',
  style,
}: EmptyProps) {
  // Base styles
  const baseStyles = 'flex flex-col items-center justify-center py-12 text-[var(--text-muted)]';

  // Combine styles
  const emptyClassName = [baseStyles, className].filter(Boolean).join(' ');

  // Render image based on prop
  const renderImage = () => {
    if (image === 'simple' || image === PRESENTED_IMAGE_SIMPLE) {
      return <SimpleEmptyImage />;
    }
    if (image) {
      return <div className="mb-4">{image}</div>;
    }
    return null;
  };

  return (
    <div className={emptyClassName} style={style}>
      {renderImage()}
      <div className="text-sm mt-2">{description}</div>
    </div>
  );
}

// Export static property for backwards compatibility
Empty.PRESENTED_IMAGE_SIMPLE = PRESENTED_IMAGE_SIMPLE;
