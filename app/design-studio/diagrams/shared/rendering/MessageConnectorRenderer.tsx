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
import { EditableLabel } from '~/design-studio/components/canvas/editors/EditableLabel';
import { getConnectionPointsForShape, calculateAbsolutePosition } from '~/design-studio/utils/connectionPoints';
import { THEME_CONFIG } from '~/core/config/theme-config';

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

/**
 * Get stroke dasharray based on line type
 */
function getStrokeDasharray(lineType: 'solid' | 'dotted' | 'dashed', strokeWidth: number): string | undefined {
  switch (lineType) {
    case 'dashed':
      return `${THEME_CONFIG.dashPatterns.dashed.dashLength * strokeWidth} ${THEME_CONFIG.dashPatterns.dashed.gapLength * strokeWidth}`;
    case 'dotted':
      return `${THEME_CONFIG.dashPatterns.dotted.dashLength * strokeWidth} ${THEME_CONFIG.dashPatterns.dotted.gapLength * strokeWidth}`;
    case 'solid':
    default:
      return undefined;
  }
}

/**
 * Generate SVG marker (arrow head, diamond, etc.)
 */
function getMarker(
  id: string,
  type: string,
  color: string,
  strokeWidth: number
): React.ReactElement {
  const scale = strokeWidth / 2;
  const size = 8 * scale;

  switch (type) {
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

    default:
      return <marker id={id} />;
  }
}
