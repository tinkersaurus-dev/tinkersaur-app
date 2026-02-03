/**
 * Spinner component for loading states
 */

import { twMerge } from 'tailwind-merge';

export interface SpinnerProps {
  size?: 'sm' | 'md' | 'lg';
  className?: string;
}

const sizeClasses = {
  sm: 'w-4 h-4 border-2',
  md: 'w-5 h-5 border-2',
  lg: 'w-8 h-8 border-3',
};

export function Spinner({ size = 'md', className }: SpinnerProps) {
  return (
    <span
      className={twMerge(
        'inline-block border-current border-t-transparent rounded-full animate-spin',
        sizeClasses[size],
        className
      )}
    />
  );
}
