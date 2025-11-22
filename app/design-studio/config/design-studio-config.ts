/**
 * Design Studio Configuration
 *
 * Central configuration for the design studio including:
 * - Cache settings for performance optimization
 * - Routing algorithm parameters
 * - Default shape dimensions for different diagram types
 * - Layout and spacing constants
 */

export const DESIGN_STUDIO_CONFIG = {
  /**
   * Cache Configuration
   */
  cache: {
    /** Time-to-live for visibility graph cache (milliseconds) */
    visibilityGraphTTL: 5000,
    /** Maximum number of cached visibility graphs */
    maxCacheSize: 10,
  },

  /**
   * Connector Routing Configuration
   */
  routing: {
    /** Distance from shape boundaries for routing (pixels) */
    nudgeDistance: 20,
    /** Width of routing corridors for connection points (pixels) */
    corridorWidth: 40,
    /** Maximum distance threshold for creating graph edges (pixels) */
    maxGraphConnectionDistance: 2000,
    /** Control point offset for curved paths (pixels) */
    curveControlPointOffset: 50,
    /** Number of points to sample along Bezier curves for hit testing */
    curveSamples: 10,
    /** Maximum number of connection point pairs to evaluate for smart selection */
    maxConnectionPointTrials: 16,
  },

  /**
   * Default Shape Dimensions
   */
  shapes: {
    /** Fallback dimensions for unrecognized shapes */
    default: {
      width: 120,
      height: 80,
    },

    /** BPMN diagram element dimensions (based on BPMN 2.0 specification) */
    bpmn: {
      task: {
        width: 120,
        height: 80,
      },
      startEvent: {
        width: 40,
        height: 40,
      },
      endEvent: {
        width: 40,
        height: 40,
      },
      intermediateEvent: {
        width: 60,
        height: 60,
      },
      gateway: {
        width: 40,
        height: 40,
      },
    },

    /** Class diagram element dimensions */
    class: {
      classBox: {
        width: 180,
        height: 120,
      },
      /** Default size for class tool palette */
      toolDefault: {
        width: 200,
        height: 150,
      },
      /** Geometry calculation fallback */
      geometryDefault: {
        width: 160,
        height: 120,
      },
      interface: {
        width: 160,
        height: 100,
      },
    },

    /** Sequence diagram element dimensions */
    sequence: {
      lifeline: {
        width: 100,
        height: 400, // This is the DEFAULT_LIFELINE_HEIGHT
      },
      participantBox: {
        width: 120,
        height: 80,
      },
      actor: {
        width: 60,
        height: 100,
      },
      note: {
        width: 120,
        height: 80,
      },
    },

    /** Architecture diagram element dimensions */
    architecture: {
      service: {
        width: 120,
        height: 80,
      },
      group: {
        width: 300,
        height: 200,
      },
      junction: {
        width: 20,
        height: 20,
      },
    },

    /** Preview and import container dimensions */
    preview: {
      width: 300,
      height: 200,
    },

    /** Generate diagram tool dimensions */
    generateDiagram: {
      width: 280,
      height: 280,
    },
  },

  /**
   * Class Diagram Layout Configuration
   */
  classLayout: {
    /** Line height for class text content */
    lineHeight: 28,
    /** Line height for class items (methods, attributes) */
    itemLineHeight: 28,
    /** Height of stereotype section */
    stereotypeSectionHeight: 28,
    /** Height of class name section */
    classNameSectionHeight: 40,
    /** Height of empty sections */
    emptySectionHeight: 28,
    /** Border buffer for height calculations */
    borderBuffer: 4,
    /** Minimum total height for class boxes */
    minHeight: 150,
  },

  /**
   * Sequence Diagram Activation Configuration
   */
  sequenceActivation: {
    /** Default activation box length (2 connection point intervals) */
    defaultActivationLength: 80,
  },

  /**
   * Connection Point Configuration
   */
  connectionPoint: {
    /** Visual size of connection point handles (compensated for zoom) */
    visualSize: 12,
  },

  /**
   * Connector Label Configuration
   */
  connectorLabel: {
    /** Distance from connector endpoint for cardinality labels (pixels) */
    cardinalityOffset: 20,
  },

  /**
   * Mermaid Editor Configuration
   */
  mermaidEditor: {
    /** Padding around Mermaid code editor */
    padding: 12,
  },
} as const;

/**
 * Type-safe access to configuration values
 */
export type DesignStudioConfig = typeof DESIGN_STUDIO_CONFIG;
