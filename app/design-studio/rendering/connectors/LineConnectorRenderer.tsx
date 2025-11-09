import React from 'react';
import type { ConnectorRendererProps } from './types';
import type { ConnectionPointDirection } from '~/core/entities/design-studio/types/Connector';
import { EditableLabel } from '../../components/canvas/EditableLabel';
import { getPathMidpoint, type Point } from '../../utils/pathUtils';
import { findOptimalConnectionPoints } from '../../utils/canvas';

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
  const { pathData, pathPoints } = getPathData(
    start,
    end,
    sourceDirection,
    targetDirection,
    connector.style
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
 * Generate path data based on routing style
 * Returns both the SVG path string and the array of points that make up the path
 */
function getPathData(
  start: { x: number; y: number },
  end: { x: number; y: number },
  startDirection: ConnectionPointDirection,
  endDirection: ConnectionPointDirection,
  style: 'straight' | 'orthogonal' | 'curved'
): { pathData: string; pathPoints: Point[] } {
  switch (style) {
    case 'straight':
      return {
        pathData: `M ${start.x} ${start.y} L ${end.x} ${end.y}`,
        pathPoints: [start, end],
      };

    case 'curved':
      return getCurvedPath(start, end, startDirection, endDirection);

    case 'orthogonal':
    default:
      return getOrthogonalPath(start, end, startDirection, endDirection);
  }
}

/**
 * Generate curved (Bezier) path
 * For curved paths, we approximate the path with sample points along the Bezier curve
 */
function getCurvedPath(
  start: { x: number; y: number },
  end: { x: number; y: number },
  startDirection: ConnectionPointDirection,
  endDirection: ConnectionPointDirection
): { pathData: string; pathPoints: Point[] } {
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

  const pathData = `M ${start.x} ${start.y} C ${c1.x} ${c1.y}, ${c2.x} ${c2.y}, ${end.x} ${end.y}`;

  // Sample points along the Bezier curve for label positioning
  // We use 10 samples to approximate the curve
  const pathPoints: Point[] = [];
  const samples = 10;
  for (let i = 0; i <= samples; i++) {
    const t = i / samples;
    // Cubic Bezier formula: B(t) = (1-t)³P0 + 3(1-t)²tP1 + 3(1-t)t²P2 + t³P3
    const mt = 1 - t;
    const mt2 = mt * mt;
    const mt3 = mt2 * mt;
    const t2 = t * t;
    const t3 = t2 * t;

    pathPoints.push({
      x: mt3 * start.x + 3 * mt2 * t * c1.x + 3 * mt * t2 * c2.x + t3 * end.x,
      y: mt3 * start.y + 3 * mt2 * t * c1.y + 3 * mt * t2 * c2.y + t3 * end.y,
    });
  }

  return { pathData, pathPoints };
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
): { pathData: string; pathPoints: Point[] } {
  const pathPoints: Point[] = [start];

  // Determine if anchors are vertical (N/S) or horizontal (E/W)
  const isStartVertical = startDirection === 'N' || startDirection === 'S';
  const isEndVertical = endDirection === 'N' || endDirection === 'S';

  if (isStartVertical && isEndVertical) {
    // Both anchors are vertical (N/S): go vertical, then horizontal, then vertical
    const midY = (start.y + end.y) / 2;
    pathPoints.push({ x: start.x, y: midY });
    pathPoints.push({ x: end.x, y: midY });
  } else if (!isStartVertical && !isEndVertical) {
    // Both anchors are horizontal (E/W): go horizontal, then vertical, then horizontal
    const midX = (start.x + end.x) / 2;
    pathPoints.push({ x: midX, y: start.y });
    pathPoints.push({ x: midX, y: end.y });
  } else if (isStartVertical && !isEndVertical) {
    // Start is vertical, end is horizontal: go vertical then horizontal
    pathPoints.push({ x: start.x, y: end.y });
  } else {
    // Start is horizontal, end is vertical: go horizontal then vertical
    pathPoints.push({ x: end.x, y: start.y });
  }

  pathPoints.push(end);

  // Build SVG path string
  const pathData = pathPoints.map((p, i) => `${i === 0 ? 'M' : 'L'} ${p.x} ${p.y}`).join(' ');

  return { pathData, pathPoints };
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

