import React, { useMemo } from 'react';
import type { ConnectorRendererProps } from './connector-types';
import { EditableLabel } from '~/design-studio/components/canvas/editors/EditableLabel';
import { getPathMidpoint } from '~/design-studio/utils/pathUtils';
import { findOptimalConnectionPoints } from '~/design-studio/utils/canvas';
import { getConnectionPointsForShape } from '~/design-studio/utils/connectionPoints';
import { getPathData } from './pathUtils';
import { THEME_CONFIG } from '~/core/config/theme-config';
import { DESIGN_STUDIO_CONFIG } from '~/design-studio/config/design-studio-config';
import { getClassConnectorToolByType } from '~/design-studio/diagrams/class/connectors';
import { getERConnectorToolByType } from '~/design-studio/diagrams/entity-relationship/connectors';

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
  // DYNAMIC CONNECTION POINT SELECTION
  // Get connection points from shapes based on their type
  // Memoized to avoid dependency issues with React hooks
  const sourceConnectionPoints = useMemo(
    () => sourceShape ? getConnectionPointsForShape(sourceShape.type, sourceShape.height) : [],
    [sourceShape]
  );
  const targetConnectionPoints = useMemo(
    () => targetShape ? getConnectionPointsForShape(targetShape.type, targetShape.height) : [],
    [targetShape]
  );

  // Calculate the closest pair to ensure connectors always connect optimally
  // Uses smart selection when shapes are available to avoid obstacles
  // Memoized to only recalculate when shape positions/dimensions or connector style changes
  const { sourceDirection, targetDirection, start, end } = useMemo(
    () => {
      if (!sourceShape || !targetShape) {
        return {
          sourceDirection: 'E' as const,
          targetDirection: 'W' as const,
          start: { x: 0, y: 0 },
          end: { x: 0, y: 0 }
        };
      }
      return findOptimalConnectionPoints(
        sourceConnectionPoints,
        targetConnectionPoints,
        sourceShape,
        targetShape,
        {
          shapes: context.allShapes,
          excludeShapeIds: [connector.sourceShapeId, connector.targetShapeId],
          useSmartSelection: connector.style === 'orthogonal' // Only use smart selection for orthogonal connectors
        }
      );
    },
    [
      sourceShape,
      targetShape,
      connector.style,
      connector.sourceShapeId,
      connector.targetShapeId,
      sourceConnectionPoints,
      targetConnectionPoints,
      context.allShapes,
    ]
  );

  // Build ALL connection points (in absolute coordinates) for visibility extensions
  // Memoized to avoid recalculating when shapes haven't moved
  const allConnectionPoints = useMemo(() => {
    const points: Array<{ x: number; y: number; direction: 'N' | 'S' | 'E' | 'W' }> = [];

    if (!sourceShape || !targetShape) {
      return points;
    }

    // Add all source connection points
    for (const point of sourceConnectionPoints) {
      points.push({
        x: sourceShape.x + point.position.x * sourceShape.width,
        y: sourceShape.y + point.position.y * sourceShape.height,
        direction: point.direction
      });
    }

    // Add all target connection points
    for (const point of targetConnectionPoints) {
      points.push({
        x: targetShape.x + point.position.x * targetShape.width,
        y: targetShape.y + point.position.y * targetShape.height,
        direction: point.direction
      });
    }

    return points;
  }, [
    sourceShape,
    targetShape,
    sourceConnectionPoints,
    targetConnectionPoints,
  ]);

  // Calculate the path based on routing style
  // Memoized to only recalculate when connection points or shapes change
  const { pathData, pathPoints } = useMemo(
    () => getPathData(
      start,
      end,
      sourceDirection,
      targetDirection,
      connector.style,
      {
        shapes: context.allShapes,
        excludeShapeIds: [connector.sourceShapeId, connector.targetShapeId],
        useAdvancedRouting: connector.style === 'orthogonal' && context.allShapes && context.allShapes.length > 2,
        allConnectionPoints: connector.style === 'orthogonal' ? allConnectionPoints : undefined
      }
    ),
    [
      start,
      end,
      sourceDirection,
      targetDirection,
      connector.style,
      connector.sourceShapeId,
      connector.targetShapeId,
      context.allShapes,
      allConnectionPoints,
    ]
  );

  // If shapes are missing, don't render
  if (!sourceShape || !targetShape) {
    return null;
  }

  // Calculate the actual midpoint along the path for label positioning
  const labelPosition = getPathMidpoint(pathPoints);

  // Zoom-compensated stroke width (2px at 100% zoom)
  const strokeWidth = THEME_CONFIG.stroke.connector / context.zoom;

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

  // Check if connector supports cardinality (check both class and ER connectors)
  const connectorConfig = getClassConnectorToolByType(connector.type) ?? getERConnectorToolByType(connector.type);
  const supportsCardinality = connectorConfig?.supportsCardinality ?? false;

  // Calculate cardinality label positions
  const cardinalityOffset = DESIGN_STUDIO_CONFIG.connectorLabel.cardinalityOffset / context.zoom;
  const sourceLabelPos = calculateCardinalityLabelPosition(start, sourceDirection, cardinalityOffset);
  const targetLabelPos = calculateCardinalityLabelPosition(end, targetDirection, cardinalityOffset);

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
        strokeWidth={THEME_CONFIG.stroke.hitbox / context.zoom}
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

      {/* Source cardinality label (non-editable) */}
      {supportsCardinality && connector.sourceCardinality && (
        <text
          x={sourceLabelPos.x}
          y={sourceLabelPos.y}
          fontSize={10 / context.zoom}
          fill="var(--canvas-label-display-text)"
          textAnchor={sourceLabelPos.textAnchor}
          dominantBaseline="middle"
          pointerEvents="none"
          style={{
            userSelect: 'none',
          }}
        >
          {connector.sourceCardinality}
        </text>
      )}

      {/* Target cardinality label (non-editable) */}
      {supportsCardinality && connector.targetCardinality && (
        <text
          x={targetLabelPos.x}
          y={targetLabelPos.y}
          fontSize={10 / context.zoom}
          fill="var(--canvas-label-display-text)"
          textAnchor={targetLabelPos.textAnchor}
          dominantBaseline="middle"
          pointerEvents="none"
          style={{
            userSelect: 'none',
          }}
        >
          {connector.targetCardinality}
        </text>
      )}
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
          <circle cx="5" cy="6" r="3" fill="white" stroke={color} strokeWidth={strokeWidth} />
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
          <circle cx="13" cy="6" r="3" fill="white" stroke={color} strokeWidth={strokeWidth} />
          {/* Crow's foot (three lines meeting at a point) */}
          <line x1="1" y1="1" x2="8" y2="6" stroke={color} strokeWidth={strokeWidth} />
          <line x1="1" y1="6" x2="8" y2="6" stroke={color} strokeWidth={strokeWidth} />
          <line x1="1" y1="11" x2="8" y2="6" stroke={color} strokeWidth={strokeWidth} />
        </marker>
      );

    default:
      return null;
  }
}

/**
 * Calculate position for cardinality label near an endpoint
 * @param point - The endpoint coordinates
 * @param direction - The direction from the endpoint (N, S, E, W)
 * @param offset - Distance from endpoint (in pixels)
 * @returns Position for the label
 */
function calculateCardinalityLabelPosition(
  point: { x: number; y: number },
  direction: string,
  offset: number
): { x: number; y: number; textAnchor: 'start' | 'middle' | 'end' } {
  let x = point.x;
  let y = point.y;
  let textAnchor: 'start' | 'middle' | 'end' = 'middle';

  switch (direction) {
    case 'N': // North - offset upward
      y -= offset;
      break;
    case 'S': // South - offset downward
      y += offset;
      break;
    case 'E': // East - offset to the right
      x += offset;
      textAnchor = 'start';
      break;
    case 'W': // West - offset to the left
      x -= offset;
      textAnchor = 'end';
      break;
  }

  return { x, y, textAnchor };
}

