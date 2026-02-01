import React, { useMemo } from 'react';
import type { ConnectorRendererProps } from './connector-types';
import { EditableLabel } from '@/widgets/canvas/ui/editors/EditableLabel';
import { getPathMidpoint } from '@/widgets/canvas/lib/utils/pathUtils';
import { findOptimalConnectionPoints } from '@/widgets/canvas/lib/utils/canvas';
import { getConnectionPointsForShape } from '@/widgets/canvas/lib/utils/connectionPoints';
import { getPathData } from './pathUtils';
import { getStrokeDasharray } from './strokeStyles';
import { getClassDiagramMarker } from './svgMarkers';
import { calculateCardinalityLabelPosition } from './labelPositioning';
import { THEME_CONFIG } from '@/shared/lib/config/theme-config';
import { DESIGN_STUDIO_CONFIG } from '@/shared/config/design-studio';
import { getClassConnectorToolByType } from '@/features/diagram-rendering/class/connectors';
import { getERConnectorToolByType } from '@/features/diagram-rendering/entity-relationship/connectors';

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
        {markerStartType !== 'none' && getClassDiagramMarker(markerStartId, markerStartType, strokeColor, strokeWidth)}
        {markerEndType !== 'none' && getClassDiagramMarker(markerEndId, markerEndType, strokeColor, strokeWidth)}
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
