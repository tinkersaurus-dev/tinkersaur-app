/**
 * Empty Component
 * Displays empty state placeholder with optional image and description
 */

import type { ReactNode, CSSProperties } from 'react';

// Simple empty state using Tinkersaur logo
const SimpleEmptyImage = () => (
  <img
    src="/images/tinkersaur-logo-lg.png"
    alt="No data"
    style={{
      opacity: 0.3,
      width: '128px',
      height: '128px'
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
