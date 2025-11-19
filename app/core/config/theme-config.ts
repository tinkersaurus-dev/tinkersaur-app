/**
 * Theme Configuration
 *
 * Central configuration for visual styling including:
 * - Typography (font sizes)
 * - Spacing scale
 * - Z-index hierarchy
 * - Stroke widths and visual styling
 * - Border radius values
 */

export const THEME_CONFIG = {
  /**
   * Typography Scale
   */
  typography: {
    fontSize: {
      /** Extra small: 8px - Used for tiny labels, metadata */
      xs: 8,
      /** Small: 10px - Used for secondary text, captions */
      sm: 10,
      /** Base: 11px - Default item text size */
      base: 11,
      /** Medium: 12px - Primary text size */
      md: 12,
      /** Large: 14px - Headers, emphasis */
      lg: 14,
    },
  },

  /**
   * Spacing Scale
   */
  spacing: {
    /** Extra small: 4px */
    xs: 4,
    /** Small: 8px */
    sm: 8,
    /** Medium: 12px */
    md: 12,
    /** Large: 16px */
    lg: 16,
  },

  /**
   * Z-Index Hierarchy
   *
   * Defines the stacking order of UI elements.
   * Higher values appear on top of lower values.
   */
  zIndex: {
    /** Base canvas layer */
    canvas: 1,
    /** Connection points on shapes */
    connectionPoints: 100,
    /** Drawing preview layer */
    drawingPreview: 1000,
    /** Editable labels and editors */
    editable: 1000,
    /** Dropdown menus and popovers */
    dropdown: 9999,
    /** Debug overlays (panels) */
    debugPanel: 10000,
    /** Debug overlays (SVG) */
    debugSvg: 9999,
  },

  /**
   * Stroke Widths
   */
  stroke: {
    /** Default stroke width for connectors (before zoom compensation) */
    connector: 2,
    /** Stroke width for invisible hitbox (before zoom compensation) */
    hitbox: 12,
    /** Default stroke width for shape borders */
    shapeBorder: 2,
  },

  /**
   * Border Radius
   */
  borderRadius: {
    /** Small radius for subtle rounding */
    sm: 2,
    /** Medium radius for standard UI elements */
    md: 4,
    /** Large radius for prominent elements */
    lg: 8,
  },

  /**
   * Dash Patterns
   *
   * Multipliers for creating dashed line patterns.
   * Applied as: [dashLength * strokeWidth, gapLength * strokeWidth]
   */
  dashPatterns: {
    /** Standard dashed line pattern */
    dashed: {
      dashLength: 5,
      gapLength: 5,
    },
    /** Dotted line pattern */
    dotted: {
      dashLength: 1,
      gapLength: 3,
    },
  },

  /**
   * Class Diagram Visual Styling
   */
  classRenderer: {
    /** Border radius for class boxes */
    borderRadius: 2,
    /** Padding inside class boxes */
    padding: 8,
    /** Font size for class name */
    fontSize: 12,
    /** Font size for class items (methods, attributes) */
    itemFontSize: 11,
  },
} as const;

/**
 * Type-safe access to theme values
 */
export type ThemeConfig = typeof THEME_CONFIG;
