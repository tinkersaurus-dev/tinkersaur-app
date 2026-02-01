/**
 * Stroke Style Utilities
 *
 * Provides consistent stroke styling across all connector types.
 * Uses THEME_CONFIG for centralized dash pattern configuration.
 */

import { THEME_CONFIG } from '@/shared/lib/config/theme-config';

export type LineType = 'solid' | 'dotted' | 'dashed';

/**
 * Calculate stroke dasharray based on line type and stroke width.
 * Uses centralized theme configuration for consistent dash patterns.
 *
 * @param lineType - The type of line ('solid', 'dotted', 'dashed')
 * @param strokeWidth - The base stroke width (typically zoom-compensated)
 * @returns SVG stroke-dasharray value or undefined for solid lines
 */
export function getStrokeDasharray(
  lineType: LineType | string,
  strokeWidth: number
): string | undefined {
  switch (lineType) {
    case 'dashed':
      return `${THEME_CONFIG.dashPatterns.dashed.dashLength * strokeWidth} ${THEME_CONFIG.dashPatterns.dashed.gapLength * strokeWidth}`;
    case 'dotted':
      return `${THEME_CONFIG.dashPatterns.dotted.dashLength * strokeWidth} ${THEME_CONFIG.dashPatterns.dotted.gapLength * strokeWidth}`;
    case 'solid':
    default:
      return undefined;
  }
}
