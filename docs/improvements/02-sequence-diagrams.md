# Sequence Diagram Support Improvement

**Priority**: Critical
**Gap Severity**: Major
**Estimated New Code**: ~730 lines

---

## Overview

The VS Code extension has complete sequence diagram support with automatic activation calculation, while tinkersaur-app has incomplete stubs that aren't integrated into the main canvas.

### Current State

**Tinkersaur-App:**
- Folder structure exists but implementation incomplete
- Has some components (`SequenceLifelineRenderer`, `SequenceNoteRenderer`)
- Has activation calculator stub
- Not integrated into main canvas
- No auto-calculation of activation boxes
- No lifeline controls

**VS Code Extension:**
- Complete sequence diagram support
- Automatic activation box calculation when messages change
- Lifeline extend/shrink controls with validation
- Specialized message connector rendering
- Full Mermaid import/export

---

## Implementation Guide

### 2.1 Activation Box Calculation

**Create: `app/design-studio/diagrams/sequence/activationCalculator.ts`**

```typescript
import type { Shape } from '~/core/entities/design-studio/types/Shape';
import type { Connector } from '~/core/entities/design-studio/types/Connector';

/**
 * Represents a period of activation on a lifeline
 */
export interface Activation {
  /** Y position where activation starts */
  startY: number;
  /** Y position where activation ends */
  endY: number;
  /** Nesting level (for recursive calls) */
  level: number;
}

/**
 * Calculate activation boxes for all lifelines based on message connectors
 *
 * Algorithm:
 * 1. Filter for sequence lifelines and message connectors
 * 2. For each lifeline, find all messages involving it
 * 3. Group messages by activation periods (overlapping Y ranges)
 * 4. Calculate nesting levels for overlapping activations
 * 5. Return map of lifeline ID -> activations array
 */
export function calculateAllLifelineActivations(
  shapes: Shape[],
  connectors: Connector[]
): Map<string, Activation[]> {
  const activationsMap = new Map<string, Activation[]>();

  // Get all sequence lifelines
  const lifelines = shapes.filter((s) => s.type === 'sequence-lifeline');

  // Get all message connectors
  const messages = connectors.filter((c) =>
    c.type?.startsWith('sequence-message-')
  );

  for (const lifeline of lifelines) {
    const activations = calculateLifelineActivations(lifeline, messages, shapes);
    activationsMap.set(lifeline.id, activations);
  }

  return activationsMap;
}

/**
 * Calculate activations for a single lifeline
 */
function calculateLifelineActivations(
  lifeline: Shape,
  messages: Connector[],
  allShapes: Shape[]
): Activation[] {
  // Find all messages where this lifeline is the target (receives a message)
  const incomingMessages = messages.filter((m) => m.targetId === lifeline.id);

  // Find all messages where this lifeline is the source (sends a message)
  const outgoingMessages = messages.filter((m) => m.sourceId === lifeline.id);

  // Build activation periods
  const activationPeriods: { startY: number; endY: number }[] = [];

  for (const incoming of incomingMessages) {
    const startY = getMessageY(incoming, allShapes);

    // Find the corresponding return message or next incoming message
    let endY = startY + 40; // Default activation height

    // Look for return message from this lifeline to the sender
    const returnMessage = messages.find(
      (m) =>
        m.sourceId === lifeline.id &&
        m.targetId === incoming.sourceId &&
        m.type === 'sequence-message-return' &&
        getMessageY(m, allShapes) > startY
    );

    if (returnMessage) {
      endY = getMessageY(returnMessage, allShapes);
    } else {
      // Look for next outgoing message
      const nextOutgoing = outgoingMessages
        .filter((m) => getMessageY(m, allShapes) > startY)
        .sort((a, b) => getMessageY(a, allShapes) - getMessageY(b, allShapes))[0];

      if (nextOutgoing) {
        endY = getMessageY(nextOutgoing, allShapes);
      }
    }

    activationPeriods.push({ startY, endY });
  }

  // Merge overlapping periods and calculate nesting levels
  const mergedActivations = mergeAndNestActivations(activationPeriods);

  return mergedActivations;
}

/**
 * Get the Y position of a message (average of source and target Y positions)
 */
function getMessageY(connector: Connector, shapes: Shape[]): number {
  const sourceShape = shapes.find((s) => s.id === connector.sourceId);
  const targetShape = shapes.find((s) => s.id === connector.targetId);

  if (!sourceShape || !targetShape) return 0;

  // For horizontal messages, use the Y position
  // Messages are typically drawn at the same Y level
  return Math.min(sourceShape.y, targetShape.y) + 20; // Offset from top of lifeline header
}

/**
 * Merge overlapping activation periods and calculate nesting levels
 */
function mergeAndNestActivations(
  periods: { startY: number; endY: number }[]
): Activation[] {
  if (periods.length === 0) return [];

  // Sort by start position
  const sorted = [...periods].sort((a, b) => a.startY - b.startY);

  const result: Activation[] = [];

  for (const period of sorted) {
    // Check if this period overlaps with any existing activation
    let level = 0;
    for (const existing of result) {
      if (
        period.startY < existing.endY &&
        period.endY > existing.startY
      ) {
        level = Math.max(level, existing.level + 1);
      }
    }

    result.push({
      startY: period.startY,
      endY: period.endY,
      level,
    });
  }

  return result;
}
```

**Key Algorithm Details:**

1. **Message Detection**: Finds incoming messages (where lifeline is target)
2. **Return Message Matching**: Looks for return messages to determine activation end
3. **Default Height**: Uses 40px default if no return message found
4. **Nesting Calculation**: Overlapping activations get incremented level for visual offset
5. **Y Position**: Calculated from message connector positions

---

### 2.2 Lifeline Height Validation

**Create: `app/design-studio/diagrams/sequence/heightCalculator.ts`**

```typescript
import type { Shape } from '~/core/entities/design-studio/types/Shape';
import type { Connector } from '~/core/entities/design-studio/types/Connector';

export const LIFELINE_EXTENSION_INCREMENT = 100;
export const DEFAULT_LIFELINE_HEIGHT = 300;
const HEADER_HEIGHT = 50;
const BOTTOM_PADDING = 20;

/**
 * Check if lifelines can be shrunk without cutting off messages
 *
 * Returns:
 * - canShrink: boolean indicating if shrinking is safe
 * - reason: explanation if shrinking is blocked
 */
export function canShrinkLifelines(
  shapes: Shape[],
  connectors: Connector[]
): { canShrink: boolean; reason?: string } {
  const lifelines = shapes.filter((s) => s.type === 'sequence-lifeline');

  if (lifelines.length === 0) {
    return { canShrink: false, reason: 'No lifelines present' };
  }

  // Find the lowest message position across all lifelines
  let maxMessageY = 0;

  for (const lifeline of lifelines) {
    const messages = connectors.filter(
      (c) => c.sourceId === lifeline.id || c.targetId === lifeline.id
    );

    for (const message of messages) {
      // Get the Y position of this message relative to the lifeline
      const messageY = getMessageYRelativeToLifeline(message, lifeline, shapes);
      maxMessageY = Math.max(maxMessageY, messageY);
    }
  }

  // Calculate minimum required height
  const minRequiredHeight = maxMessageY + BOTTOM_PADDING;

  // Calculate what the new height would be after shrinking
  const currentMinHeight = Math.min(...lifelines.map((l) => l.height));
  const newHeight = Math.max(
    DEFAULT_LIFELINE_HEIGHT,
    currentMinHeight - LIFELINE_EXTENSION_INCREMENT
  );

  if (newHeight < minRequiredHeight) {
    return {
      canShrink: false,
      reason: `Cannot shrink: Messages extend to Y=${maxMessageY.toFixed(0)}. Minimum height is ${minRequiredHeight.toFixed(0)}px.`,
    };
  }

  return { canShrink: true };
}

/**
 * Get message Y position relative to lifeline top
 */
function getMessageYRelativeToLifeline(
  connector: Connector,
  lifeline: Shape,
  allShapes: Shape[]
): number {
  const sourceShape = allShapes.find((s) => s.id === connector.sourceId);
  const targetShape = allShapes.find((s) => s.id === connector.targetId);

  if (!sourceShape || !targetShape) return 0;

  // Calculate message Y position
  const messageY = Math.min(sourceShape.y, targetShape.y) + HEADER_HEIGHT;

  // Calculate relative to lifeline top
  return messageY - lifeline.y;
}
```

**Key Implementation Details:**

1. **Message Scanning**: Checks all messages connected to any lifeline
2. **Minimum Height Calculation**: Finds lowest message position + padding
3. **Validation**: Compares proposed new height against minimum required
4. **User Feedback**: Returns reason string for tooltip/notification

---

### 2.3 Sequence Lifeline Component

**Create: `app/design-studio/diagrams/sequence/components/SequenceLifeline.tsx`**

```typescript
import React from 'react';
import type { Shape } from '~/core/entities/design-studio/types/Shape';
import type { Activation } from '../activationCalculator';

interface SequenceLifelineProps {
  shape: Shape;
  isSelected: boolean;
  isHovered: boolean;
  isEditing: boolean;
  onMouseDown: (e: React.MouseEvent, shapeId: string) => void;
  onMouseEnter: (e: React.MouseEvent, shapeId: string) => void;
  onMouseLeave: (e: React.MouseEvent, shapeId: string) => void;
  onDoubleClick: (shapeId: string) => void;
  onLabelChange: (shapeId: string, newLabel: string) => void;
  onFinishEdit: () => void;
  onConnectionPointMouseDown?: (connectionPointId: string, e: React.MouseEvent) => void;
  onConnectionPointMouseUp?: (connectionPointId: string, e: React.MouseEvent) => void;
}

const HEADER_HEIGHT = 50;
const HEADER_WIDTH = 120;
const ACTIVATION_WIDTH = 10;
const ACTIVATION_OFFSET = 5; // Offset for nested activations

/**
 * Sequence Lifeline Component
 *
 * Structure:
 * - Header box (rectangle with participant name)
 * - Dashed vertical line (lifespan)
 * - Activation boxes (solid rectangles on the line)
 * - Connection points for messages
 */
export function SequenceLifeline({
  shape,
  isSelected,
  isHovered,
  isEditing,
  onMouseDown,
  onMouseEnter,
  onMouseLeave,
  onDoubleClick,
  onLabelChange,
  onFinishEdit,
  onConnectionPointMouseDown,
  onConnectionPointMouseUp,
}: SequenceLifelineProps) {
  // Extract activations from shape data
  const activations: Activation[] = (shape.data as { activations?: Activation[] })?.activations || [];

  // Calculate lifeline center X for the dashed line
  const lineX = shape.x + HEADER_WIDTH / 2;

  return (
    <g>
      {/* Header box */}
      <rect
        x={shape.x}
        y={shape.y}
        width={HEADER_WIDTH}
        height={HEADER_HEIGHT}
        fill="white"
        stroke={isSelected ? '#3b82f6' : isHovered ? '#60a5fa' : '#000'}
        strokeWidth={isSelected ? 2 : 1}
        rx={5}
        ry={5}
        onMouseDown={(e) => onMouseDown(e, shape.id)}
        onMouseEnter={(e) => onMouseEnter(e, shape.id)}
        onMouseLeave={(e) => onMouseLeave(e, shape.id)}
        onDoubleClick={() => onDoubleClick(shape.id)}
        style={{ cursor: 'move' }}
      />

      {/* Label */}
      {!isEditing && (
        <text
          x={shape.x + HEADER_WIDTH / 2}
          y={shape.y + HEADER_HEIGHT / 2}
          textAnchor="middle"
          dominantBaseline="middle"
          fontSize={14}
          fontWeight={500}
          fill="#000"
          pointerEvents="none"
        >
          {shape.label}
        </text>
      )}

      {/* Editable label */}
      {isEditing && (
        <foreignObject
          x={shape.x + 5}
          y={shape.y + HEADER_HEIGHT / 2 - 10}
          width={HEADER_WIDTH - 10}
          height={20}
        >
          <input
            type="text"
            value={shape.label}
            onChange={(e) => onLabelChange(shape.id, e.target.value)}
            onBlur={onFinishEdit}
            onKeyDown={(e) => {
              if (e.key === 'Enter') onFinishEdit();
            }}
            autoFocus
            style={{
              width: '100%',
              fontSize: '14px',
              textAlign: 'center',
              border: '1px solid #3b82f6',
              borderRadius: '2px',
              padding: '2px',
            }}
          />
        </foreignObject>
      )}

      {/* Dashed vertical lifeline */}
      <line
        x1={lineX}
        y1={shape.y + HEADER_HEIGHT}
        x2={lineX}
        y2={shape.y + shape.height}
        stroke="#000"
        strokeWidth={1}
        strokeDasharray="5,5"
        pointerEvents="none"
      />

      {/* Activation boxes */}
      {activations.map((activation, index) => {
        // Calculate X offset based on nesting level
        const xOffset = activation.level * ACTIVATION_OFFSET;
        const activationX = lineX - ACTIVATION_WIDTH / 2 + xOffset;

        return (
          <rect
            key={index}
            x={activationX}
            y={shape.y + activation.startY}
            width={ACTIVATION_WIDTH}
            height={activation.endY - activation.startY}
            fill="white"
            stroke="#000"
            strokeWidth={1}
            pointerEvents="none"
          />
        );
      })}

      {/* Connection points (every 20px along the lifeline) */}
      {Array.from({ length: Math.floor(shape.height / 20) }).map((_, index) => {
        const connectionPointY = shape.y + HEADER_HEIGHT + index * 20;
        const connectionPointId = `${shape.id}-cp-${index}`;

        return (
          <circle
            key={connectionPointId}
            cx={lineX}
            cy={connectionPointY}
            r={4}
            fill={isHovered ? '#3b82f6' : 'transparent'}
            stroke="transparent"
            strokeWidth={8} // Large hit area
            style={{ cursor: 'crosshair' }}
            onMouseDown={(e) => onConnectionPointMouseDown?.(connectionPointId, e)}
            onMouseUp={(e) => onConnectionPointMouseUp?.(connectionPointId, e)}
          />
        );
      })}
    </g>
  );
}
```

**Key Implementation Details:**

1. **Activation Rendering**: Reads `shape.data.activations` array to draw activation boxes
2. **Nesting Offset**: Each nesting level offsets activation box by 5px
3. **Connection Points**: Generates connection points every 20px along lifeline
4. **Dashed Line**: Uses `strokeDasharray="5,5"` for lifeline
5. **Header**: 120px x 50px rounded rectangle

---

### 2.4 Message Connector Renderer

**Create: `app/design-studio/diagrams/sequence/components/MessageConnector.tsx`**

```typescript
import React from 'react';
import type { Connector } from '~/core/entities/design-studio/types/Connector';
import type { Shape } from '~/core/entities/design-studio/types/Shape';

interface MessageConnectorProps {
  connector: Connector;
  sourceShape: Shape | null;
  targetShape: Shape | null;
  isSelected: boolean;
  isHovered: boolean;
  isEditing: boolean;
  onMouseDown: (e: React.MouseEvent, connectorId: string) => void;
  onMouseEnter: (e: React.MouseEvent, connectorId: string) => void;
  onMouseLeave: (e: React.MouseEvent, connectorId: string) => void;
  onDoubleClick: (connectorId: string) => void;
  onLabelChange: (connectorId: string, newLabel: string) => void;
  onFinishEditing: () => void;
}

const HEADER_HEIGHT = 50;
const LIFELINE_WIDTH = 120;

/**
 * Message Connector Renderer for Sequence Diagrams
 *
 * Message Types:
 * - sequence-message-sync: Solid line with solid arrowhead
 * - sequence-message-async: Solid line with open arrowhead
 * - sequence-message-return: Dashed line with open arrowhead
 */
export function MessageConnectorRenderer({
  connector,
  sourceShape,
  targetShape,
  isSelected,
  isHovered,
  isEditing,
  onMouseDown,
  onMouseEnter,
  onMouseLeave,
  onDoubleClick,
  onLabelChange,
  onFinishEditing,
}: MessageConnectorProps) {
  if (!sourceShape || !targetShape) return null;

  // Calculate message line coordinates
  const sourceX = sourceShape.x + LIFELINE_WIDTH / 2;
  const targetX = targetShape.x + LIFELINE_WIDTH / 2;

  // Messages are drawn horizontally at the same Y level
  // Use connector's stored Y position or calculate from shapes
  const y = sourceShape.y + HEADER_HEIGHT + 20; // Default offset

  // Determine line style based on message type
  const isReturn = connector.type === 'sequence-message-return';
  const isSync = connector.type === 'sequence-message-sync';
  const strokeDasharray = isReturn ? '5,5' : undefined;

  // Calculate arrowhead
  const arrowLength = 10;
  const arrowWidth = 6;
  const isLeftToRight = targetX > sourceX;
  const arrowDir = isLeftToRight ? 1 : -1;

  const arrowTipX = targetX;
  const arrowTipY = y;
  const arrowBaseX = targetX - arrowDir * arrowLength;

  return (
    <g>
      {/* Message line */}
      <line
        x1={sourceX}
        y1={y}
        x2={targetX - arrowDir * arrowLength}
        y2={y}
        stroke={isSelected ? '#3b82f6' : isHovered ? '#60a5fa' : '#000'}
        strokeWidth={isSelected ? 2 : 1}
        strokeDasharray={strokeDasharray}
        onMouseDown={(e) => onMouseDown(e, connector.id)}
        onMouseEnter={(e) => onMouseEnter(e, connector.id)}
        onMouseLeave={(e) => onMouseLeave(e, connector.id)}
        onDoubleClick={() => onDoubleClick(connector.id)}
        style={{ cursor: 'pointer' }}
      />

      {/* Arrowhead */}
      {isSync ? (
        // Solid arrowhead for sync messages
        <polygon
          points={`${arrowTipX},${arrowTipY} ${arrowBaseX},${arrowTipY - arrowWidth} ${arrowBaseX},${arrowTipY + arrowWidth}`}
          fill={isSelected ? '#3b82f6' : isHovered ? '#60a5fa' : '#000'}
          stroke="none"
          pointerEvents="none"
        />
      ) : (
        // Open arrowhead for async and return messages
        <>
          <line
            x1={arrowTipX}
            y1={arrowTipY}
            x2={arrowBaseX}
            y2={arrowTipY - arrowWidth}
            stroke={isSelected ? '#3b82f6' : isHovered ? '#60a5fa' : '#000'}
            strokeWidth={isSelected ? 2 : 1}
            pointerEvents="none"
          />
          <line
            x1={arrowTipX}
            y1={arrowTipY}
            x2={arrowBaseX}
            y2={arrowTipY + arrowWidth}
            stroke={isSelected ? '#3b82f6' : isHovered ? '#60a5fa' : '#000'}
            strokeWidth={isSelected ? 2 : 1}
            pointerEvents="none"
          />
        </>
      )}

      {/* Label */}
      {connector.label && !isEditing && (
        <text
          x={(sourceX + targetX) / 2}
          y={y - 5}
          textAnchor="middle"
          dominantBaseline="baseline"
          fontSize={12}
          fill="#000"
          pointerEvents="none"
        >
          {connector.label}
        </text>
      )}

      {/* Editable label */}
      {isEditing && (
        <foreignObject
          x={(sourceX + targetX) / 2 - 50}
          y={y - 25}
          width={100}
          height={20}
        >
          <input
            type="text"
            value={connector.label || ''}
            onChange={(e) => onLabelChange(connector.id, e.target.value)}
            onBlur={onFinishEditing}
            onKeyDown={(e) => {
              if (e.key === 'Enter') onFinishEditing();
            }}
            autoFocus
            style={{
              width: '100%',
              fontSize: '12px',
              textAlign: 'center',
              border: '1px solid #3b82f6',
              borderRadius: '2px',
              padding: '2px',
            }}
          />
        </foreignObject>
      )}

      {/* Invisible wider line for easier clicking */}
      <line
        x1={sourceX}
        y1={y}
        x2={targetX}
        y2={y}
        stroke="transparent"
        strokeWidth={10}
        onMouseDown={(e) => onMouseDown(e, connector.id)}
        onMouseEnter={(e) => onMouseEnter(e, connector.id)}
        onMouseLeave={(e) => onMouseLeave(e, connector.id)}
        onDoubleClick={() => onDoubleClick(connector.id)}
        style={{ cursor: 'pointer' }}
      />
    </g>
  );
}
```

**Key Implementation Details:**

1. **Message Types**: Sync (solid arrow), async (open arrow), return (dashed + open arrow)
2. **Horizontal Layout**: All messages drawn horizontally
3. **Arrow Calculation**: 10px length, 6px width, direction based on source/target X
4. **Hit Area**: Transparent 10px wide line for easier clicking
5. **Label Positioning**: Centered above message line

---

### 2.5 Lifeline Controls

**Create: `app/design-studio/components/canvas/ui/LifelineControls.tsx`**

```typescript
import React from 'react';

interface LifelineControlsProps {
  onExtend: () => void;
  onShrink: () => void;
  canShrink: boolean;
  shrinkDisabledReason?: string;
}

/**
 * Lifeline Controls Component
 *
 * Displays extend/shrink buttons for sequence diagram lifelines
 * Shows tooltip when shrinking is disabled
 */
export function LifelineControls({
  onExtend,
  onShrink,
  canShrink,
  shrinkDisabledReason,
}: LifelineControlsProps) {
  return (
    <div
      style={{
        position: 'absolute',
        top: '10px',
        right: '10px',
        display: 'flex',
        gap: '8px',
        background: 'white',
        padding: '8px',
        borderRadius: '6px',
        boxShadow: '0 2px 8px rgba(0,0,0,0.1)',
        zIndex: 100,
      }}
    >
      <button
        onClick={onExtend}
        style={{
          padding: '6px 12px',
          background: '#3b82f6',
          color: 'white',
          border: 'none',
          borderRadius: '4px',
          cursor: 'pointer',
          fontSize: '14px',
          fontWeight: 500,
        }}
        title="Extend all lifelines by 100px"
      >
        Extend Lifelines
      </button>

      <button
        onClick={onShrink}
        disabled={!canShrink}
        style={{
          padding: '6px 12px',
          background: canShrink ? '#10b981' : '#d1d5db',
          color: canShrink ? 'white' : '#9ca3af',
          border: 'none',
          borderRadius: '4px',
          cursor: canShrink ? 'pointer' : 'not-allowed',
          fontSize: '14px',
          fontWeight: 500,
        }}
        title={canShrink ? 'Shrink all lifelines by 100px' : shrinkDisabledReason}
      >
        Shrink Lifelines
      </button>
    </div>
  );
}
```

---

### 2.6 Diagram Features Integration

**Create: `app/design-studio/diagrams/sequence/features.ts`**

```typescript
import type { Shape } from '~/core/entities/design-studio/types/Shape';
import type { Connector } from '~/core/entities/design-studio/types/Connector';
import { calculateAllLifelineActivations } from './activationCalculator';
import { canShrinkLifelines, LIFELINE_EXTENSION_INCREMENT, DEFAULT_LIFELINE_HEIGHT } from './heightCalculator';

/**
 * Sequence Diagram Features
 *
 * Implements diagram-specific behaviors:
 * - Auto-calculate activation boxes when connectors change
 * - Provide extend/shrink lifeline handlers
 */
export const sequenceDiagramFeatures = {
  /**
   * Recalculate activation boxes whenever connectors change
   */
  onConnectorsChanged: (
    shapes: Shape[],
    connectors: Connector[],
    updateShape: (id: string, updates: Partial<Shape>) => void
  ) => {
    const activationsMap = calculateAllLifelineActivations(shapes, connectors);

    activationsMap.forEach((newActivations, shapeId) => {
      const shape = shapes.find((s) => s.id === shapeId);
      if (!shape) return;

      const currentActivations = (shape.data as { activations?: unknown })?.activations || [];

      // Only update if activations changed
      const changed = JSON.stringify(currentActivations) !== JSON.stringify(newActivations);
      if (changed) {
        updateShape(shapeId, {
          data: {
            ...(shape.data || {}),
            activations: newActivations,
          },
        });
      }
    });
  },

  /**
   * Get control handlers for lifeline operations
   */
  getControlHandlers: (context: {
    shapes: Shape[];
    connectors: Connector[];
    updateShape: (id: string, updates: Partial<Shape>) => void;
  }) => {
    const { shapes, updateShape } = context;

    return {
      onExtendLifelines: () => {
        const lifelines = shapes.filter((s) => s.type === 'sequence-lifeline');
        lifelines.forEach((lifeline) => {
          updateShape(lifeline.id, {
            height: lifeline.height + LIFELINE_EXTENSION_INCREMENT,
          });
        });
      },

      onShrinkLifelines: () => {
        const lifelines = shapes.filter((s) => s.type === 'sequence-lifeline');
        lifelines.forEach((lifeline) => {
          const newHeight = Math.max(
            DEFAULT_LIFELINE_HEIGHT,
            lifeline.height - LIFELINE_EXTENSION_INCREMENT
          );
          updateShape(lifeline.id, { height: newHeight });
        });
      },

      canShrink: () => canShrinkLifelines(shapes, context.connectors),
    };
  },
};
```

---

## Files Summary

### Files to Create
1. `app/design-studio/diagrams/sequence/activationCalculator.ts` (~150 lines)
2. `app/design-studio/diagrams/sequence/heightCalculator.ts` (~80 lines)
3. `app/design-studio/diagrams/sequence/components/SequenceLifeline.tsx` (~180 lines)
4. `app/design-studio/diagrams/sequence/components/MessageConnector.tsx` (~150 lines)
5. `app/design-studio/components/canvas/ui/LifelineControls.tsx` (~70 lines)
6. `app/design-studio/diagrams/sequence/features.ts` (~100 lines)

---

## Testing Strategy

### Unit Tests

1. **Activation Calculator**
   - Test with various message patterns
   - Test nesting level calculation
   - Test return message matching

### Integration Tests

1. **Sequence Diagrams**
   - Add messages and verify activation boxes update
   - Extend/shrink lifelines and verify validation
   - Test height constraints

### Performance Targets

- **Activation Calculation**: <10ms for diagrams with <50 shapes
