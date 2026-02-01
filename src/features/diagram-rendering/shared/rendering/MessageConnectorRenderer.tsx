/**
 * MessageConnectorRenderer
 *
 * Specialized renderer for sequence diagram messages.
 * Messages connect directly to connection points on lifelines:
 * - True straight lines (supports diagonal when connection points differ in Y)
 * - Connection points use fixed pixel offsets for stable positioning
 * - Support for self-messages (loops back to same lifeline)
 * - Different arrow styles for different message types
 * - Messages stay connected when participants move
 */

import React from 'react';
import type { ConnectorRendererProps } from './connector-types';
import { EditableLabel } from '@/widgets/canvas/ui/editors/EditableLabel';
import { getConnectionPointsForShape, calculateAbsolutePosition } from '~/design-studio/utils/connectionPoints';
import { getStrokeDasharray } from './strokeStyles';
import { getSequenceDiagramMarker } from './svgMarkers';
import { THEME_CONFIG } from '@/shared/lib/config/theme-config';

/**
 * MessageConnectorRenderer Component
 */
export const MessageConnectorRenderer: React.FC<ConnectorRendererProps> = ({
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

  // Calculate source and target positions
  let sourceX: number;
  let sourceY: number;
  let targetX: number;
  let targetY: number;

  // If connector has explicit connection points stored, use them for exact positioning
  if (connector.sourceConnectionPoint && connector.targetConnectionPoint) {
    // Get connection point configurations for both shapes
    const sourceConnectionPoints = getConnectionPointsForShape(sourceShape.type, sourceShape.height);
    const targetConnectionPoints = getConnectionPointsForShape(targetShape.type, targetShape.height);

    // Find the specific connection points by ID
    const sourceCP = sourceConnectionPoints.find((cp) => cp.id === connector.sourceConnectionPoint);
    const targetCP = targetConnectionPoints.find((cp) => cp.id === connector.targetConnectionPoint);


    if (sourceCP && targetCP) {
      // Calculate exact positions using calculateAbsolutePosition (handles both percentage and fixed offsets)
      const sourcePos = calculateAbsolutePosition(sourceCP, {
        x: sourceShape.x,
        y: sourceShape.y,
        width: sourceShape.width,
        height: sourceShape.height,
      });
      const targetPos = calculateAbsolutePosition(targetCP, {
        x: targetShape.x,
        y: targetShape.y,
        width: targetShape.width,
        height: targetShape.height,
      });

      sourceX = sourcePos.x;
      sourceY = sourcePos.y;
      targetX = targetPos.x;
      targetY = targetPos.y;
    } else {
      // Fallback if connection points not found
      sourceX = sourceShape.x + sourceShape.width / 2;
      sourceY = sourceShape.y + 100;
      targetX = targetShape.x + targetShape.width / 2;
      targetY = sourceY;
    }
  } else {
    // Fallback to center-based positioning for backward compatibility
    sourceX = sourceShape.x + sourceShape.width / 2; // Center of source lifeline
    targetX = targetShape.x + targetShape.width / 2; // Center of target lifeline
    sourceY = connector.points?.[0]?.y || sourceShape.y + 100;
    targetY = sourceY;
  }

  const isSelfMessage = sourceShape.id === targetShape.id;

  // Calculate path based on message type (now supports true diagonal lines)
  const { pathData, labelX, labelY } = isSelfMessage
    ? getSelfMessagePath(sourceX, sourceY, targetX, targetY, context.zoom)
    : getStraightMessagePath(sourceX, sourceY, targetX, targetY);

  // Zoom-compensated stroke width
  const strokeWidth = THEME_CONFIG.stroke.connector / context.zoom;

  // Base color - darker when selected/hovered
  const strokeColor = context.isSelected
    ? 'var(--canvas-connector-stroke-selected)'
    : context.isHovered
    ? 'var(--canvas-connector-stroke-hover)'
    : 'var(--canvas-connector-stroke-default)';

  // Line style based on connector type
  const strokeDasharray = getStrokeDasharray(connector.lineType, strokeWidth);

  // Marker IDs for arrow heads
  const markerStartType = connector.markerStart || 'none';
  const markerEndType = connector.markerEnd || 'arrow';
  const markerStartId = `marker-start-${connector.id}`;
  const markerEndId = `marker-end-${connector.id}`;

  return (
    <g>
      {/* Define markers if needed */}
      <defs>
        {markerStartType !== 'none' && getSequenceDiagramMarker(markerStartId, markerStartType, strokeColor, strokeWidth)}
        {markerEndType !== 'none' && getSequenceDiagramMarker(markerEndId, markerEndType, strokeColor, strokeWidth)}
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

      {/* Editable label */}
      <foreignObject
        x={labelX - 50}
        y={labelY - 30}
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
            fontSize={8}
            style={{
              color: 'var(--text)',
              pointerEvents: isEditing ? 'auto' : 'none',
              background: 'var(--bg-light)',
              padding: '2px 4px',
              borderRadius: '2px',
              border: '1px solid var(--border)',
            }}
          />
        </div>
      </foreignObject>
    </g>
  );
};

/**
 * Generate straight message path (supports diagonal lines)
 */
function getStraightMessagePath(
  sourceX: number,
  sourceY: number,
  targetX: number,
  targetY: number
): { pathData: string; labelX: number; labelY: number } {
  return {
    pathData: `M ${sourceX} ${sourceY} L ${targetX} ${targetY}`,
    labelX: (sourceX + targetX) / 2,
    labelY: (sourceY + targetY) / 2 - 10,
  };
}

/**
 * Generate self-message path (loop back to same lifeline)
 * Now properly terminates at source and target connection points
 */
function getSelfMessagePath(
  sourceX: number,
  sourceY: number,
  targetX: number,
  targetY: number,
  _zoom: number
): { pathData: string; labelX: number; labelY: number } {
  const loopWidth = 40;

  // Calculate the vertical distance between source and target connection points
  const height = targetY - sourceY;

  // Create a rectangular loop to the right of the lifeline
  // Start at source connection point and end at target connection point
  const pathData = `
    M ${sourceX} ${sourceY}
    L ${sourceX + loopWidth} ${sourceY}
    L ${sourceX + loopWidth} ${targetY}
    L ${targetX} ${targetY}
  `;

  return {
    pathData,
    labelX: sourceX + loopWidth + 10,
    labelY: sourceY + height / 2,
  };
}

