/**
 * Typography Utilities
 *
 * Helper functions for working with typography tokens in the application.
 * These utilities provide an easier way to apply typography presets to components.
 */

import type {
  FontSize,
  LineHeight,
  FontWeight,
  LetterSpacing,
  TypographyPreset,
} from './typography.types';

/**
 * Get the CSS variable for a font size token
 */
export function getFontSizeVar(size: FontSize): string {
  return `var(--font-size-${size})`;
}

/**
 * Get the CSS variable for a line height token
 */
export function getLineHeightVar(lineHeight: LineHeight): string {
  return `var(--line-height-${lineHeight})`;
}

/**
 * Get the CSS variable for a font weight token
 */
export function getFontWeightVar(weight: FontWeight): string {
  return `var(--font-weight-${weight})`;
}

/**
 * Get the CSS variable for a letter spacing token
 */
export function getLetterSpacingVar(letterSpacing: LetterSpacing): string {
  return `var(--letter-spacing-${letterSpacing})`;
}

/**
 * Get Tailwind class names for a typography preset
 *
 * @example
 * getTypographyClasses('h1')
 * // Returns: 'text-[var(--typography-h1-size)] leading-[var(--typography-h1-line-height)] font-[var(--typography-h1-weight)] tracking-[var(--typography-h1-letter-spacing)]'
 */
export function getTypographyClasses(preset: TypographyPreset): string {
  return [
    `text-[var(--typography-${preset}-size)]`,
    `leading-[var(--typography-${preset}-line-height)]`,
    `font-[var(--typography-${preset}-weight)]`,
    `tracking-[var(--typography-${preset}-letter-spacing)]`,
  ].join(' ');
}

/**
 * Get inline styles object for a typography preset
 * Useful for React components that need inline styles
 *
 * @example
 * getTypographyStyles('h1')
 * // Returns: { fontSize: 'var(--typography-h1-size)', lineHeight: 'var(--typography-h1-line-height)', ... }
 */
export function getTypographyStyles(preset: TypographyPreset): React.CSSProperties {
  return {
    fontSize: `var(--typography-${preset}-size)`,
    lineHeight: `var(--typography-${preset}-line-height)`,
    fontWeight: `var(--typography-${preset}-weight)`,
    letterSpacing: `var(--typography-${preset}-letter-spacing)`,
  };
}

/**
 * Build custom typography classes from individual tokens
 *
 * @example
 * buildTypographyClasses({ size: 'lg', weight: 'bold' })
 * // Returns: 'text-[var(--font-size-lg)] font-[var(--font-weight-bold)]'
 */
export function buildTypographyClasses(config: {
  size?: FontSize;
  lineHeight?: LineHeight;
  weight?: FontWeight;
  letterSpacing?: LetterSpacing;
}): string {
  const classes: string[] = [];

  if (config.size) {
    classes.push(`text-[var(--font-size-${config.size})]`);
  }
  if (config.lineHeight) {
    classes.push(`leading-[var(--line-height-${config.lineHeight})]`);
  }
  if (config.weight) {
    classes.push(`font-[var(--font-weight-${config.weight})]`);
  }
  if (config.letterSpacing) {
    classes.push(`tracking-[var(--letter-spacing-${config.letterSpacing})]`);
  }

  return classes.join(' ');
}
