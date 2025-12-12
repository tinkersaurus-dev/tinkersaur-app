/**
 * Enumeration Diagram Renderer
 *
 * Renders UML enumeration shapes with stereotype, enumeration name, and literals.
 * Supports editable fields and dynamic add/delete operations for literals.
 */

import { useState, useRef, useEffect } from 'react';
import { FaPlus } from 'react-icons/fa';
import type { ShapeRendererProps } from '../../shared/rendering/types';
import { getEnumerationShapeData } from '~/core/entities/design-studio/types/Shape';
import { ConnectionPointRenderer } from '../../shared/rendering/ConnectionPointRenderer';
import { EditableLabel } from '~/design-studio/components/canvas/editors/EditableLabel';
import { ClassItemEditor } from '~/design-studio/diagrams/class/components/ClassItemEditor';
import { ShapeWrapper } from '../../shared/rendering/ShapeWrapper';
import { STANDARD_RECTANGLE_CONNECTION_POINTS } from '~/design-studio/utils/connectionPoints';
import { THEME_CONFIG } from '~/core/config/theme-config';
import { useCanvasEvents } from '~/design-studio/components/canvas/core/CanvasEventsContext';

export function EnumerationRenderer({
  shape,
  context,
  isEditing = false,
  onMouseDown,
  onMouseEnter,
  onMouseLeave,
  onDoubleClick,
  onLabelChange,
  onFinishEditing,
  onConnectionPointMouseDown,
  onConnectionPointMouseUp,
}: ShapeRendererProps): React.ReactElement {
  const { width, height } = shape;
  const { isSelected, isHovered, zoom } = context;

  // Get enumeration editing callbacks from context instead of props
  const {
    addLiteral,
    deleteLiteral,
    updateLiteral,
    updateLiteralLocal,
  } = useCanvasEvents();

  // Disable interactivity for preview shapes
  const isInteractive = !shape.isPreview;
  const showHover = isInteractive && isHovered;
  const showSelected = isInteractive && isSelected;

  // Wrap connection point handlers to prepend shape ID
  const handleConnectionPointMouseDown = (connectionPointId: string, e: React.MouseEvent) => {
    onConnectionPointMouseDown?.(`${shape.id}-${connectionPointId}`, e);
  };

  const handleConnectionPointMouseUp = (connectionPointId: string, e: React.MouseEvent) => {
    onConnectionPointMouseUp?.(`${shape.id}-${connectionPointId}`, e);
  };

  // Parse enumeration shape data using type-safe helper
  const enumerationData = getEnumerationShapeData(shape);
  const _stereotype = enumerationData.stereotype;
  const literals = enumerationData.literals;

  // Track which literal is being edited and its original value
  const [editingLiteral, setEditingLiteral] = useState<number | null>(null);
  const [editingLiteralOriginal, setEditingLiteralOriginal] = useState<string>('');

  // Measure actual rendered height for connection point placement
  const wrapperRef = useRef<HTMLDivElement>(null);
  const [measuredHeight, setMeasuredHeight] = useState(height);

  useEffect(() => {
    const element = wrapperRef.current;
    if (!element) return;

    const observer = new ResizeObserver((entries) => {
      for (const entry of entries) {
        setMeasuredHeight(entry.contentRect.height);
      }
    });

    observer.observe(element);
    return () => observer.disconnect();
  }, []);

  // Calculate zoom-compensated values
  let borderWidth = THEME_CONFIG.stroke.shapeBorder / zoom;
  const borderRadius = THEME_CONFIG.classRenderer.borderRadius;
  const padding = THEME_CONFIG.classRenderer.padding;
  const fontSize = THEME_CONFIG.classRenderer.fontSize;
  const itemFontSize = THEME_CONFIG.classRenderer.itemFontSize;

  // Determine border color based on state
  let borderColor = 'var(--border)';
  if (showSelected) {
    borderColor = 'var(--primary)';
    borderWidth = 3 / zoom;
  } else if (showHover) {
    borderColor = 'var(--secondary)';
  }

  // Determine background color
  let backgroundColor = 'var(--bg)';
  if (showSelected) {
    backgroundColor = 'var(--bg)';
  } else if (showHover) {
    backgroundColor = 'var(--bg-light)';
  }

  const addButtonWidth = Math.min(32, 16 * zoom);

  return (
    <ShapeWrapper
      ref={wrapperRef}
      shape={shape}
      isSelected={showSelected}
      isHovered={showHover}
      zoom={zoom}
      borderColor={borderColor}
      borderWidth={borderWidth}
      backgroundColor={backgroundColor}
      borderRadius={borderRadius}
      hoverPadding={30}
      onMouseDown={isInteractive ? onMouseDown : undefined}
      onMouseEnter={isInteractive ? onMouseEnter : undefined}
      onMouseLeave={isInteractive ? onMouseLeave : undefined}
      onDoubleClick={isInteractive ? onDoubleClick : undefined}
      style={{
        display: 'flex',
        flexDirection: 'column',
      }}
    >
      {/* Stereotype section - always show "enumeration" */}
      <div
        style={{
          padding: `${padding / 2}px ${padding}px`,
          borderBottom: `${1 / zoom}px solid var(--border)`,
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
        }}
      >
        <div
          style={{
            color: 'var(--text-muted)',
            fontStyle: 'italic',
            fontSize: fontSize * 0.9,
          }}
        >
          &lt;&lt;enumeration&gt;&gt;
        </div>
      </div>

      {/* Enumeration name section */}
      <div
        style={{
          padding: `${padding}px`,
          borderBottom: `${1 / zoom}px solid var(--border)`,
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
        }}
      >
        <EditableLabel
          label={shape.label || 'EnumerationName'}
          isEditing={isInteractive && isEditing}
          onStartEdit={() => {}}
          onLabelChange={(newLabel) => onLabelChange?.(shape.id, 'shape', newLabel)}
          onFinishEdit={() => onFinishEditing?.()}
          fontSize={fontSize}
          style={{
            color: 'var(--text)',
            fontWeight: 'bold',
            pointerEvents: isInteractive && isEditing ? 'auto' : 'none',
            textAlign: 'center',
          }}
        />
      </div>

      {/* Literals section */}
      <div
        style={{
          padding: `${padding / 2}px 0`,
          position: 'relative',
        }}
      >
        {literals.length === 0 ? (
          <div
            style={{
              padding: `${padding / 2}px ${padding}px`,
              color: 'var(--text-muted)',
              fontSize: itemFontSize,
              fontStyle: 'italic',
              textAlign: 'center',
            }}
          >
            No literals
          </div>
        ) : (
          literals.map((literal, index) => (
            <ClassItemEditor
              key={`${shape.id}-literal-${index}`}
              value={literal}
              isEditing={editingLiteral === index}
              onStartEdit={() => {
                setEditingLiteral(index);
                setEditingLiteralOriginal(literal);
              }}
              onChange={(newValue) => {
                // Update local state only (no database save)
                updateLiteralLocal(shape.id, index, newValue);
              }}
              onFinishEdit={() => {
                // Save to database only when editing finishes
                if (editingLiteral !== null && literals[editingLiteral] !== editingLiteralOriginal) {
                  updateLiteral(shape.id, editingLiteral, editingLiteralOriginal, literals[editingLiteral]);
                }
                setEditingLiteral(null);
                setEditingLiteralOriginal('');
              }}
              onDelete={() => {
                deleteLiteral(shape.id, index);
              }}
              fontSize={itemFontSize}
              showDelete={showHover}
              zoom={zoom}
            />
          ))
        )}

        {/* Add literal button */}
        {showHover && (
          <button
            data-interactive="true"
            onClick={() => {
              addLiteral(shape.id);
            }}
            style={{
              position: 'absolute',
              right: `${addButtonWidth / -1}px`,
              bottom: `0px`,
              width: `${addButtonWidth}px`,
              borderRadius: `2px`,
              cursor: 'pointer',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              fontSize: `10px`,
              color: 'var(--primary)',
            }}
            title="Add literal"
          >
            <FaPlus />
          </button>
        )}
      </div>

      {/* Connection points when hovered */}
      {showHover &&
        onConnectionPointMouseDown &&
        onConnectionPointMouseUp &&
        STANDARD_RECTANGLE_CONNECTION_POINTS.map((connectionPoint) => (
          <ConnectionPointRenderer
            key={connectionPoint.id}
            connectionPoint={connectionPoint}
            shapeWidth={width}
            shapeHeight={measuredHeight}
            onMouseDown={handleConnectionPointMouseDown}
            onMouseUp={handleConnectionPointMouseUp}
          />
        ))}
    </ShapeWrapper>
  );
}
