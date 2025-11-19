import React from 'react';
import type { ConnectorRendererProps } from './types';
import { EditableLabel } from '../../components/canvas/editors/EditableLabel';
import { getPathMidpoint } from '../../utils/pathUtils';
import { findOptimalConnectionPoints } from '../../utils/canvas';
import { getConnectionPointsForShape } from '../../utils/connectionPoints';
import { getPathData } from './pathUtils';

/**
 * LineConnectorRenderer
 *
 * Renders line connectors with support for:
 * - Orthogonal routing (Manhattan routing with right angles)
 * - Curved routing (Bezier curves)
 * - Straight routing (direct lines)
 * - Arrow heads (arrow, circle, diamond, none)
 * - Line styles (solid, dotted, dashed)
 * - Editable labels
 *
 * IMPORTANT: Connection points are calculated dynamically at render time
 * to always connect to the closest connection points as shapes move.
 */
export const LineConnectorRenderer: React.FC<ConnectorRendererProps> = ({
  connector,
  sourceShape,
  targetShape,
  context,
  isEditing = false,
  onMouseDown,
  onMouseEnter,
  onMouseLeave,
  onDoubleClick,
  onLabelChange,
  onFinishEditing,
}) => {
  // If shapes are missing, don't render
  if (!sourceShape || !targetShape) {
    return null;
  }

  // DYNAMIC CONNECTION POINT SELECTION
  // Get connection points from shapes based on their type
  const sourceConnectionPoints = getConnectionPointsForShape(sourceShape.type, sourceShape.height);
  const targetConnectionPoints = getConnectionPointsForShape(targetShape.type, targetShape.height);

  // Calculate the closest pair to ensure connectors always connect optimally
  const { sourceDirection, targetDirection, start, end } = findOptimalConnectionPoints(
    sourceConnectionPoints,
    targetConnectionPoints,
    sourceShape,
    targetShape
  );

  // Calculate the path based on routing style
  const { pathData, pathPoints } = getPathData(
    start,
    end,
    sourceDirection,
    targetDirection,
    connector.style,
    {
      shapes: context.allShapes,
      excludeShapeIds: [connector.sourceShapeId, connector.targetShapeId],
      useAdvancedRouting: connector.style === 'orthogonal' && context.allShapes && context.allShapes.length > 2
    }
  );

  // Calculate the actual midpoint along the path for label positioning
  const labelPosition = getPathMidpoint(pathPoints);

  // Zoom-compensated stroke width (2px at 100% zoom)
  const strokeWidth = 2 / context.zoom;

  // Base color - darker when selected/hovered
  const strokeColor = context.isSelected
    ? 'var(--canvas-connector-stroke-selected)'
    : context.isHovered
    ? 'var(--canvas-connector-stroke-hover)'
    : 'var(--canvas-connector-stroke-default)';

  // Line style
  const strokeDasharray = getStrokeDasharray(connector.lineType, strokeWidth);

  // Marker IDs
  const markerStartType = connector.markerStart || 'none';
  const markerEndType = connector.markerEnd || 'arrow';
  const markerStartId = `marker-start-${connector.id}`;
  const markerEndId = `marker-end-${connector.id}`;

  return (
    <g>
      {/* Define markers if needed */}
      <defs>
        {markerStartType !== 'none' && getMarker(markerStartId, markerStartType, strokeColor, strokeWidth)}
        {markerEndType !== 'none' && getMarker(markerEndId, markerEndType, strokeColor, strokeWidth)}
      </defs>

      {/* Invisible wider path for easier clicking */}
      <path
        d={pathData}
        stroke="transparent"
        strokeWidth={12 / context.zoom}
        fill="none"
        style={{ cursor: context.readOnly ? 'default' : 'pointer', pointerEvents: 'auto' }}
        onMouseDown={(e) => onMouseDown?.(e, connector.id)}
        onDoubleClick={(e) => {
          e.stopPropagation();
          onDoubleClick?.(connector.id);
        }}
        onMouseEnter={(e) => onMouseEnter?.(e, connector.id)}
        onMouseLeave={(e) => onMouseLeave?.(e, connector.id)}
      />

      {/* Visible path */}
      <path
        d={pathData}
        stroke={strokeColor}
        strokeWidth={strokeWidth}
        strokeDasharray={strokeDasharray}
        fill="none"
        strokeLinecap="round"
        strokeLinejoin="round"
        markerStart={markerStartType !== 'none' ? `url(#${markerStartId})` : undefined}
        markerEnd={markerEndType !== 'none' ? `url(#${markerEndId})` : undefined}
        pointerEvents="none"
      />

      {/* Editable label in foreignObject */}
      <foreignObject
        x={labelPosition.x - 50}
        y={labelPosition.y - 30}
        width={100}
        height={60}
        style={{ overflow: 'visible' }}
      >
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', height: '100%' }}>
          <EditableLabel
            label={connector.label}
            isEditing={isEditing}
            onStartEdit={() => onDoubleClick?.(connector.id)}
            onLabelChange={(newLabel) => onLabelChange?.(connector.id, 'connector', newLabel)}
            onFinishEdit={() => onFinishEditing?.()}
            fontSize={12}
            style={{
              color: 'var(--canvas-label-display-text:)',
              pointerEvents: isEditing ? 'auto' : 'none',
              background: strokeColor,
              borderRadius: '5px',
            }}
          />
        </div>
      </foreignObject>
    </g>
  );
};

/**
 * Get stroke dash array based on line type
 */
function getStrokeDasharray(lineType: string, strokeWidth: number): string | undefined {
  switch (lineType) {
    case 'dotted':
      return `${strokeWidth} ${strokeWidth * 2}`;
    case 'dashed':
      return `${strokeWidth * 4} ${strokeWidth * 2}`;
    case 'solid':
    default:
      return undefined;
  }
}

/**
 * Generate marker SVG element (arrow heads, diamonds, etc.)
 */
function getMarker(
  id: string,
  markerType: string,
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
          <path d="M 0 0 L 10 5 L 0 10 z" fill="white" stroke={color} strokeWidth={strokeWidth} />
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
          <path d="M 5 0 L 10 5 L 5 10 L 0 5 z" fill="white" stroke={color} strokeWidth={strokeWidth} />
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

    default:
      return null;
  }
}

