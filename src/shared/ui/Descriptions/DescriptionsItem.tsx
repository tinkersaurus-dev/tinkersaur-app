/**
 * Descriptions Item Component
 * Used as a child of Descriptions component
 *
 * This component doesn't render directly - it's parsed by the parent Descriptions component
 */

import type { ReactNode } from 'react';

export interface DescriptionsItemProps {
  label?: ReactNode;
  span?: number;
  className?: string;
  style?: React.CSSProperties;
  labelStyle?: React.CSSProperties;
  contentStyle?: React.CSSProperties;
  children?: ReactNode;
}

export function DescriptionsItem(_props: DescriptionsItemProps): ReactNode {
  // This component doesn't render directly
  // It's parsed by the parent Descriptions component
  return null;
}
