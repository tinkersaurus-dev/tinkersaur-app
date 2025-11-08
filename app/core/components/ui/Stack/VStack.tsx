import type { CSSProperties, ReactNode, HTMLAttributes } from 'react';
import { Stack } from './Stack';

export interface VStackProps extends Omit<HTMLAttributes<HTMLDivElement>, 'className' | 'style'> {
  children: ReactNode;
  gap?: 'none' | 'xs' | 'sm' | 'md' | 'lg' | 'xl';
  align?: 'start' | 'center' | 'end' | 'stretch';
  justify?: 'start' | 'center' | 'end' | 'between' | 'around' | 'evenly';
  className?: string;
  style?: CSSProperties;
}

export function VStack(props: VStackProps) {
  return <Stack direction="column" {...props} />;
}
