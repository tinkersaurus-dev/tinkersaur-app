import type { CSSProperties, ReactNode, HTMLAttributes } from 'react';

export interface CardStackProps extends Omit<HTMLAttributes<HTMLDivElement>, 'className' | 'style'> {
  children: ReactNode;
  /** Gap between cards */
  gap?: 'none' | 'xs' | 'sm' | 'md' | 'lg' | 'xl';
  /**
   * Layout mode:
   * - 'stack': Vertical flex column (default, for narrow containers like sidebars)
   * - 'grid': CSS Grid - use className for responsive columns (e.g. "grid-cols-1 lg:grid-cols-2 qhd:grid-cols-3")
   * - 'wrap': Flexbox with wrap for flowing layout
   */
  layout?: 'stack' | 'grid' | 'wrap';
  /** Minimum card width for auto-fit grid (e.g. "200px"). Only used when no grid-cols classes provided. */
  minCardWidth?: string;
  className?: string;
  style?: CSSProperties;
}

const gapMap = {
  none: 'gap-0',
  xs: 'gap-1',
  sm: 'gap-2',
  md: 'gap-4',
  lg: 'gap-6',
  xl: 'gap-8',
};

export function CardStack({
  children,
  gap = 'sm',
  layout = 'stack',
  minCardWidth = '280px',
  className = '',
  style,
  ...rest
}: CardStackProps) {
  const gapClass = gapMap[gap];

  const layoutClasses = {
    stack: 'flex flex-col',
    grid: 'grid',
    wrap: 'flex flex-wrap',
  };

  const classes = [layoutClasses[layout], gapClass, className]
    .filter(Boolean)
    .join(' ');

  // For grid layout, use auto-fit if no grid-cols classes are provided via className
  const computedStyle: CSSProperties = { ...style };
  if (layout === 'grid' && !className.includes('grid-cols')) {
    computedStyle.gridTemplateColumns = `repeat(auto-fit, minmax(${minCardWidth}, 1fr))`;
  }

  return (
    <div className={classes} style={computedStyle} {...rest}>
      {children}
    </div>
  );
}
