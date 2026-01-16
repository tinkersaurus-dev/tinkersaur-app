/**
 * SVG Marker Utilities
 *
 * Generates SVG marker elements (arrows, diamonds, etc.) for connectors.
 * Supports both class/ER diagrams and sequence diagrams with different visual styles.
 */

import React from 'react';

// Class/ER diagram marker types
export type ClassMarkerType =
  | 'arrow'
  | 'triangle'
  | 'circle'
  | 'diamond'
  | 'filled-diamond'
  | 'filled-triangle'
  | 'crow-one'
  | 'crow-zero-one'
  | 'crow-many'
  | 'crow-zero-many'
  | 'none';

// Sequence diagram marker types
export type SequenceMarkerType =
  | 'arrow'
  | 'filled-arrow'
  | 'cross'
  | 'circle'
  | 'diamond'
  | 'filled-diamond'
  | 'triangle'
  | 'none';

/**
 * Generate SVG marker for class/ER diagrams.
 * Uses fixed marker sizes with strokeWidth-based units.
 *
 * @param id - Unique marker ID for SVG reference
 * @param markerType - Type of marker to generate
 * @param color - Stroke/fill color
 * @param strokeWidth - Base stroke width
 */
export function getClassDiagramMarker(
  id: string,
  markerType: ClassMarkerType | string,
  color: string,
  strokeWidth: number
): React.ReactNode {
  const markerSize = 5;

  switch (markerType) {
    case 'arrow':
      return (
        <marker
          id={id}
          viewBox="0 0 10 10"
          refX="9"
          refY="5"
          markerWidth={markerSize}
          markerHeight={markerSize}
          orient="auto-start-reverse"
        >
          <path d="M 0 0 L 10 5 L 0 10 z" fill={color} />
        </marker>
      );

    case 'triangle':
      // Hollow triangle (for inheritance/generalization)
      return (
        <marker
          id={id}
          viewBox="0 0 10 10"
          refX="9"
          refY="5"
          markerWidth={markerSize}
          markerHeight={markerSize}
          orient="auto-start-reverse"
        >
          <path d="M 0 0 L 10 5 L 0 10 z" fill="var(--canvas-marker-fill)" stroke={color} strokeWidth={strokeWidth} />
        </marker>
      );

    case 'circle':
      return (
        <marker
          id={id}
          viewBox="0 0 10 10"
          refX="5"
          refY="5"
          markerWidth={markerSize}
          markerHeight={markerSize}
          orient="auto"
        >
          <circle cx="5" cy="5" r="3" fill="none" stroke={color} strokeWidth={strokeWidth} />
        </marker>
      );

    case 'diamond':
      // Hollow diamond (for aggregation)
      return (
        <marker
          id={id}
          viewBox="0 0 10 10"
          refX="5"
          refY="5"
          markerWidth={markerSize}
          markerHeight={markerSize}
          orient="auto"
        >
          <path d="M 5 0 L 10 5 L 5 10 L 0 5 z" fill="var(--canvas-marker-fill)" stroke={color} strokeWidth={strokeWidth} />
        </marker>
      );

    case 'filled-diamond':
      // Filled diamond (for composition)
      return (
        <marker
          id={id}
          viewBox="0 0 10 10"
          refX="5"
          refY="5"
          markerWidth={markerSize}
          markerHeight={markerSize}
          orient="auto"
        >
          <path d="M 5 0 L 10 5 L 5 10 L 0 5 z" fill={color} />
        </marker>
      );

    case 'filled-triangle':
      // Filled triangle (same as arrow, for consistency)
      return (
        <marker
          id={id}
          viewBox="0 0 10 10"
          refX="9"
          refY="5"
          markerWidth={markerSize}
          markerHeight={markerSize}
          orient="auto-start-reverse"
        >
          <path d="M 0 0 L 10 5 L 0 10 z" fill={color} />
        </marker>
      );

    // Crow's foot notation for ER diagrams
    case 'crow-one':
      // Exactly one: single vertical line (||)
      return (
        <marker
          id={id}
          viewBox="0 0 12 12"
          refX="10"
          refY="6"
          markerWidth={markerSize}
          markerHeight={markerSize}
          orient="auto-start-reverse"
        >
          <line x1="8" y1="2" x2="8" y2="10" stroke={color} strokeWidth={strokeWidth} />
          <line x1="10" y1="2" x2="10" y2="10" stroke={color} strokeWidth={strokeWidth} />
        </marker>
      );

    case 'crow-zero-one':
      // Zero or one: circle + vertical line (o|)
      return (
        <marker
          id={id}
          viewBox="0 0 16 12"
          refX="14"
          refY="6"
          markerWidth={markerSize * 1.3}
          markerHeight={markerSize}
          orient="auto-start-reverse"
        >
          <circle cx="5" cy="6" r="3" fill="var(--canvas-marker-fill)" stroke={color} strokeWidth={strokeWidth} />
          <line x1="12" y1="2" x2="12" y2="10" stroke={color} strokeWidth={strokeWidth} />
          <line x1="14" y1="2" x2="14" y2="10" stroke={color} strokeWidth={strokeWidth} />
        </marker>
      );

    case 'crow-many':
      // One or more: three-pronged fork (crow's foot) + vertical line (|{)
      return (
        <marker
          id={id}
          viewBox="0 0 14 12"
          refX="12"
          refY="6"
          markerWidth={markerSize * 1.2}
          markerHeight={markerSize}
          orient="auto-start-reverse"
        >
          {/* Crow's foot (three lines meeting at a point) */}
          <line x1="1" y1="1" x2="8" y2="6" stroke={color} strokeWidth={strokeWidth} />
          <line x1="1" y1="6" x2="8" y2="6" stroke={color} strokeWidth={strokeWidth} />
          <line x1="1" y1="11" x2="8" y2="6" stroke={color} strokeWidth={strokeWidth} />
          {/* Vertical line for "one" */}
          <line x1="12" y1="2" x2="12" y2="10" stroke={color} strokeWidth={strokeWidth} />
        </marker>
      );

    case 'crow-zero-many':
      // Zero or more: circle + three-pronged fork (o{)
      return (
        <marker
          id={id}
          viewBox="0 0 16 12"
          refX="8"
          refY="6"
          markerWidth={markerSize * 1.4}
          markerHeight={markerSize}
          orient="auto-start-reverse"
        >
          {/* Circle for "zero" */}
          <circle cx="13" cy="6" r="3" fill="var(--canvas-marker-fill)" stroke={color} strokeWidth={strokeWidth} />
          {/* Crow's foot (three lines meeting at a point) */}
          <line x1="1" y1="1" x2="8" y2="6" stroke={color} strokeWidth={strokeWidth} />
          <line x1="1" y1="6" x2="8" y2="6" stroke={color} strokeWidth={strokeWidth} />
          <line x1="1" y1="11" x2="8" y2="6" stroke={color} strokeWidth={strokeWidth} />
        </marker>
      );

    case 'none':
    default:
      return null;
  }
}

/**
 * Generate SVG marker for sequence diagrams.
 * Uses dynamic sizing with userSpaceOnUse units.
 *
 * @param id - Unique marker ID for SVG reference
 * @param markerType - Type of marker to generate
 * @param color - Stroke/fill color
 * @param strokeWidth - Base stroke width
 */
export function getSequenceDiagramMarker(
  id: string,
  markerType: SequenceMarkerType | string,
  color: string,
  strokeWidth: number
): React.ReactElement | null {
  const scale = strokeWidth / 2;
  const size = 8 * scale;

  switch (markerType) {
    case 'arrow':
      return (
        <marker
          id={id}
          markerWidth={size}
          markerHeight={size}
          refX={size / 2}
          refY={size / 2}
          orient="auto"
          markerUnits="userSpaceOnUse"
        >
          <path
            d={`M 0 0 L ${size} ${size / 2} L 0 ${size}`}
            fill="none"
            stroke={color}
            strokeWidth={strokeWidth}
            strokeLinejoin="round"
          />
        </marker>
      );

    case 'filled-arrow':
      return (
        <marker
          id={id}
          markerWidth={size}
          markerHeight={size}
          refX={size}
          refY={size / 2}
          orient="auto"
          markerUnits="userSpaceOnUse"
        >
          <path d={`M 0 0 L ${size} ${size / 2} L 0 ${size} Z`} fill={color} stroke="none" />
        </marker>
      );

    case 'cross':
      return (
        <marker
          id={id}
          markerWidth={size}
          markerHeight={size}
          refX={size / 2}
          refY={size / 2}
          orient="auto"
          markerUnits="userSpaceOnUse"
        >
          <g>
            <line x1={0} y1={0} x2={size} y2={size} stroke={color} strokeWidth={strokeWidth * 1.5} />
            <line x1={size} y1={0} x2={0} y2={size} stroke={color} strokeWidth={strokeWidth * 1.5} />
          </g>
        </marker>
      );

    case 'diamond':
      return (
        <marker
          id={id}
          markerWidth={size}
          markerHeight={size}
          refX={size / 2}
          refY={size / 2}
          orient="auto"
          markerUnits="userSpaceOnUse"
        >
          <path
            d={`M 0 ${size / 2} L ${size / 2} 0 L ${size} ${size / 2} L ${size / 2} ${size} Z`}
            fill="none"
            stroke={color}
            strokeWidth={strokeWidth}
          />
        </marker>
      );

    case 'filled-diamond':
      return (
        <marker
          id={id}
          markerWidth={size}
          markerHeight={size}
          refX={size / 2}
          refY={size / 2}
          orient="auto"
          markerUnits="userSpaceOnUse"
        >
          <path
            d={`M 0 ${size / 2} L ${size / 2} 0 L ${size} ${size / 2} L ${size / 2} ${size} Z`}
            fill={color}
            stroke="none"
          />
        </marker>
      );

    case 'circle':
      return (
        <marker
          id={id}
          markerWidth={size}
          markerHeight={size}
          refX={size / 2}
          refY={size / 2}
          orient="auto"
          markerUnits="userSpaceOnUse"
        >
          <circle cx={size / 2} cy={size / 2} r={size / 3} fill="none" stroke={color} strokeWidth={strokeWidth} />
        </marker>
      );

    case 'triangle':
      return (
        <marker
          id={id}
          markerWidth={size}
          markerHeight={size}
          refX={size}
          refY={size / 2}
          orient="auto"
          markerUnits="userSpaceOnUse"
        >
          <path d={`M 0 0 L ${size} ${size / 2} L 0 ${size} Z`} fill="none" stroke={color} strokeWidth={strokeWidth} />
        </marker>
      );

    case 'none':
      return null;

    default:
      return <marker id={id} />;
  }
}
