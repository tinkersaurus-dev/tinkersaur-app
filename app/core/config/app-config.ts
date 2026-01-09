/**
 * Application Configuration
 *
 * Central configuration for application-wide settings including:
 * - Pagination defaults
 * - Table display settings
 * - UI component defaults
 */

export const APP_CONFIG = {
  /**
   * Pagination Configuration
   */
  pagination: {
    /** Default number of items per page */
    defaultPageSize: 10,
    /** Available page size options for the page size selector */
    pageSizeOptions: [10, 20, 50],
    /** Number of pages before showing ellipsis in pagination controls */
    ellipsisThreshold: 7,
    /** Maximum number of page buttons to show in middle section */
    maxMiddleButtons: 5,
    /** Number of page buttons to show near the end */
    endButtonCount: 4,
  },

  /**
   * Table Configuration
   */
  table: {
    /** Default column width presets (pixels) */
    columnWidths: {
      xs: 80,
      sm: 100,
      md: 120,
      lg: 150,
    },
  },

  /**
   * UI Component Defaults
   *
   * Note: These are default values that can be overridden via props.
   * They're documented here for reference and potential environment-based customization.
   */
  ui: {
    modal: {
      /** Default modal width (pixels) */
      defaultWidth: 520,
    },
    sider: {
      /** Default sidebar width (pixels) */
      defaultWidth: 200,
    },
    floatingPanel: {
      /** Default floating panel width (pixels) */
      defaultWidth: 600,
    },
    layout: {
      /** Max content width for Solution Management pages (pixels) */
      solutionManagementMaxWidth: 1900,
    },
  },
} as const;

/**
 * Type-safe access to configuration values
 */
export type AppConfig = typeof APP_CONFIG;
