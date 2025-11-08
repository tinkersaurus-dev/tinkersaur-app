import React from 'react';
import type { ConnectorRendererProps } from './types';
import type { ConnectionPointDirection } from '~/core/entities/design-studio/types/Connector';
import { EditableLabel } from '../../components/canvas/EditableLabel';

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
  // Instead of using stored connection points, we calculate the closest pair
  // This ensures connectors always connect optimally even when shapes move
  const { sourceDirection, targetDirection, start, end } = findOptimalConnectionPoints(
    sourceShape,
    targetShape
  );

  // Calculate the path based on routing style
  const pathData = getPathData(
    start,
    end,
    sourceDirection,
    targetDirection,
    connector.style
  );

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

  // Arrow head marker ID
  const markerId = `arrow-${connector.id}`;

  return (
    <g>
      {/* Define arrow head marker if needed */}
      {connector.arrowType !== 'none' && (
        <defs>
          {getArrowMarker(markerId, connector.arrowType, strokeColor, strokeWidth)}
        </defs>
      )}

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
        markerEnd={connector.arrowType !== 'none' ? `url(#${markerId})` : undefined}
        pointerEvents="none"
      />

      {/* Editable label in foreignObject */}
      <foreignObject
        x={(start.x + end.x) / 2 - 50}
        y={(start.y + end.y) / 2 - 20}
        width={100}
        height={40}
        style={{ overflow: 'visible' }}
      >
        <EditableLabel
          label={connector.label}
          isEditing={isEditing}
          zoom={context.zoom}
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
      </foreignObject>
    </g>
  );
};

/**
 * Generate path data based on routing style
 */
function getPathData(
  start: { x: number; y: number },
  end: { x: number; y: number },
  startDirection: ConnectionPointDirection,
  endDirection: ConnectionPointDirection,
  style: 'straight' | 'orthogonal' | 'curved'
): string {
  switch (style) {
    case 'straight':
      return `M ${start.x} ${start.y} L ${end.x} ${end.y}`;

    case 'curved':
      return getCurvedPath(start, end, startDirection, endDirection);

    case 'orthogonal':
    default:
      return getOrthogonalPath(start, end, startDirection, endDirection);
  }
}

/**
 * Generate curved (Bezier) path
 */
function getCurvedPath(
  start: { x: number; y: number },
  end: { x: number; y: number },
  startDirection: ConnectionPointDirection,
  endDirection: ConnectionPointDirection
): string {
  const offset = 50; // Control point offset distance

  // Calculate control point based on direction
  const getControlOffset = (
    pos: { x: number; y: number },
    direction: ConnectionPointDirection
  ): { x: number; y: number } => {
    switch (direction) {
      case 'N':
        return { x: pos.x, y: pos.y - offset };
      case 'S':
        return { x: pos.x, y: pos.y + offset };
      case 'E':
        return { x: pos.x + offset, y: pos.y };
      case 'W':
        return { x: pos.x - offset, y: pos.y };
    }
  };

  const c1 = getControlOffset(start, startDirection);
  const c2 = getControlOffset(end, endDirection);

  return `M ${start.x} ${start.y} C ${c1.x} ${c1.y}, ${c2.x} ${c2.y}, ${end.x} ${end.y}`;
}

/**
 * Generate orthogonal (Manhattan) path with right angles
 * Based on the reference implementation from contextstudio
 *
 * This implementation creates cleaner paths by determining routing direction
 * based on the anchor positions (vertical vs horizontal orientation)
 */
function getOrthogonalPath(
  start: { x: number; y: number },
  end: { x: number; y: number },
  startDirection: ConnectionPointDirection,
  endDirection: ConnectionPointDirection
): string {
  const path: { x: number; y: number }[] = [start];

  // Determine if anchors are vertical (N/S) or horizontal (E/W)
  const isStartVertical = startDirection === 'N' || startDirection === 'S';
  const isEndVertical = endDirection === 'N' || endDirection === 'S';

  if (isStartVertical && isEndVertical) {
    // Both anchors are vertical (N/S): go vertical, then horizontal, then vertical
    const midY = (start.y + end.y) / 2;
    path.push({ x: start.x, y: midY });
    path.push({ x: end.x, y: midY });
  } else if (!isStartVertical && !isEndVertical) {
    // Both anchors are horizontal (E/W): go horizontal, then vertical, then horizontal
    const midX = (start.x + end.x) / 2;
    path.push({ x: midX, y: start.y });
    path.push({ x: midX, y: end.y });
  } else if (isStartVertical && !isEndVertical) {
    // Start is vertical, end is horizontal: go vertical then horizontal
    path.push({ x: start.x, y: end.y });
  } else {
    // Start is horizontal, end is vertical: go horizontal then vertical
    path.push({ x: end.x, y: start.y });
  }

  path.push(end);

  // Build SVG path string
  return path.map((p, i) => `${i === 0 ? 'M' : 'L'} ${p.x} ${p.y}`).join(' ');
}

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
 * Generate arrow marker SVG element
 */
function getArrowMarker(
  id: string,
  arrowType: string,
  color: string,
  strokeWidth: number
): React.ReactNode {
  const markerSize = 8;

  switch (arrowType) {
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
          <path d="M 5 0 L 10 5 L 5 10 L 0 5 z" fill="none" stroke={color} strokeWidth={strokeWidth} />
        </marker>
      );

    default:
      return null;
  }
}

/**
 * Standard connection point directions (N, S, E, W)
 */
const STANDARD_DIRECTIONS: ConnectionPointDirection[] = ['N', 'S', 'E', 'W'];

/**
 * Calculate connection point position for a simplified shape interface
 */
function calcConnectionPoint(
  shape: { x: number; y: number; width: number; height: number },
  direction: ConnectionPointDirection
): { x: number; y: number } {
  const { x, y, width, height } = shape;
  switch (direction) {
    case 'N':
      return { x: x + width / 2, y };
    case 'S':
      return { x: x + width / 2, y: y + height };
    case 'E':
      return { x: x + width, y: y + height / 2 };
    case 'W':
      return { x, y: y + height / 2 };
  }
}

/**
 * Find the optimal pair of connection points between two shapes
 * This calculates the shortest distance between all possible connection point pairs
 * and returns the best match, ensuring connectors always connect optimally
 */
function findOptimalConnectionPoints(
  sourceShape: { x: number; y: number; width: number; height: number },
  targetShape: { x: number; y: number; width: number; height: number }
): {
  sourceDirection: ConnectionPointDirection;
  targetDirection: ConnectionPointDirection;
  start: { x: number; y: number };
  end: { x: number; y: number };
} {
  let minDistance = Infinity;
  let bestSourceDir: ConnectionPointDirection = 'E';
  let bestTargetDir: ConnectionPointDirection = 'W';
  let bestStart = { x: 0, y: 0 };
  let bestEnd = { x: 0, y: 0 };

  // Check all combinations of connection points
  for (const sourceDir of STANDARD_DIRECTIONS) {
    const sourcePos = calcConnectionPoint(sourceShape, sourceDir);

    for (const targetDir of STANDARD_DIRECTIONS) {
      const targetPos = calcConnectionPoint(targetShape, targetDir);

      // Calculate Euclidean distance
      const distance = Math.hypot(targetPos.x - sourcePos.x, targetPos.y - sourcePos.y);

      if (distance < minDistance) {
        minDistance = distance;
        bestSourceDir = sourceDir;
        bestTargetDir = targetDir;
        bestStart = sourcePos;
        bestEnd = targetPos;
      }
    }
  }

  return {
    sourceDirection: bestSourceDir,
    targetDirection: bestTargetDir,
    start: bestStart,
    end: bestEnd,
  };
}
