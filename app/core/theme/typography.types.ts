/**
 * Typography Type Definitions
 *
 * This file provides TypeScript types for the typography theming system.
 * These types ensure type safety when working with typography tokens.
 */

export type FontSize =
  | 'xs'
  | 'sm'
  | 'base'
  | 'lg'
  | 'xl'
  | '2xl'
  | '3xl'
  | '4xl'
  | '5xl'
  | '6xl';

export type LineHeight =
  | 'none'
  | 'tight'
  | 'snug'
  | 'normal'
  | 'relaxed'
  | 'loose';

export type FontWeight =
  | 'light'
  | 'normal'
  | 'medium'
  | 'semibold'
  | 'bold'
  | 'extrabold';

export type LetterSpacing =
  | 'tighter'
  | 'tight'
  | 'normal'
  | 'wide'
  | 'wider'
  | 'widest';

export type HeadingLevel = 'h1' | 'h2' | 'h3' | 'h4' | 'h5' | 'h6';

export type BodySize = 'lg' | 'base' | 'sm';

export type UITypography = 'label' | 'caption' | 'overline' | 'button';

export type DisplaySize = 'lg' | 'md';

export type TypographyPreset =
  | HeadingLevel
  | `body-${BodySize}`
  | UITypography
  | `display-${DisplaySize}`;

/**
 * Typography preset configuration
 */
export interface TypographyConfig {
  size: FontSize;
  lineHeight: LineHeight;
  weight: FontWeight;
  letterSpacing: LetterSpacing;
}

/**
 * Map of typography presets to their configurations
 */
export const typographyPresets: Record<TypographyPreset, TypographyConfig> = {
  // Headings
  h1: { size: '5xl', lineHeight: 'tight', weight: 'bold', letterSpacing: 'tight' },
  h2: { size: '4xl', lineHeight: 'tight', weight: 'bold', letterSpacing: 'tight' },
  h3: { size: '3xl', lineHeight: 'snug', weight: 'semibold', letterSpacing: 'normal' },
  h4: { size: '2xl', lineHeight: 'snug', weight: 'semibold', letterSpacing: 'normal' },
  h5: { size: 'xl', lineHeight: 'normal', weight: 'medium', letterSpacing: 'normal' },
  h6: { size: 'lg', lineHeight: 'normal', weight: 'medium', letterSpacing: 'normal' },

  // Body
  'body-lg': { size: 'lg', lineHeight: 'relaxed', weight: 'normal', letterSpacing: 'normal' },
  'body-base': { size: 'base', lineHeight: 'normal', weight: 'normal', letterSpacing: 'normal' },
  'body-sm': { size: 'sm', lineHeight: 'normal', weight: 'normal', letterSpacing: 'normal' },

  // UI Elements
  label: { size: 'sm', lineHeight: 'normal', weight: 'medium', letterSpacing: 'normal' },
  caption: { size: 'xs', lineHeight: 'normal', weight: 'normal', letterSpacing: 'normal' },
  overline: { size: 'xs', lineHeight: 'normal', weight: 'semibold', letterSpacing: 'wider' },
  button: { size: 'base', lineHeight: 'normal', weight: 'medium', letterSpacing: 'normal' },

  // Display
  'display-lg': { size: '6xl', lineHeight: 'none', weight: 'extrabold', letterSpacing: 'tighter' },
  'display-md': { size: '5xl', lineHeight: 'tight', weight: 'bold', letterSpacing: 'tight' },
};
