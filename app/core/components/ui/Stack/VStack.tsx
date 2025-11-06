import type { CSSProperties, ReactNode, HTMLAttributes } from 'react';

export interface VStackProps extends Omit<HTMLAttributes<HTMLDivElement>, 'className' | 'style'> {
  children: ReactNode;
  gap?: 'none' | 'xs' | 'sm' | 'md' | 'lg' | 'xl';
  align?: 'start' | 'center' | 'end' | 'stretch';
  justify?: 'start' | 'center' | 'end' | 'between' | 'around' | 'evenly';
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

const alignMap = {
  start: 'items-start',
  center: 'items-center',
  end: 'items-end',
  stretch: 'items-stretch',
};

const justifyMap = {
  start: 'justify-start',
  center: 'justify-center',
  end: 'justify-end',
  between: 'justify-between',
  around: 'justify-around',
  evenly: 'justify-evenly',
};

export function VStack({
  children,
  gap = 'md',
  align = 'start',
  justify = 'start',
  className = '',
  style,
  ...rest
}: VStackProps) {
  const gapClass = gapMap[gap];
  const alignClass = alignMap[align];
  const justifyClass = justifyMap[justify];

  const classes = [
    'flex',
    'flex-col',
    gapClass,
    alignClass,
    justifyClass,
    className,
  ]
    .filter(Boolean)
    .join(' ');

  return (
    <div className={classes} style={style} {...rest}>
      {children}
    </div>
  );
}
