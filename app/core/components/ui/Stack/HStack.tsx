import type { CSSProperties, ReactNode, HTMLAttributes } from 'react';
import { Stack } from './Stack';

export interface HStackProps extends Omit<HTMLAttributes<HTMLDivElement>, 'className' | 'style'> {
  children: ReactNode;
  gap?: 'none' | 'xs' | 'sm' | 'md' | 'lg' | 'xl';
  align?: 'start' | 'center' | 'end' | 'stretch' | 'baseline';
  justify?: 'start' | 'center' | 'end' | 'between' | 'around' | 'evenly';
  wrap?: boolean;
  className?: string;
  style?: CSSProperties;
}

export function HStack(props: HStackProps) {
  return <Stack direction="row" {...props} />;
}
