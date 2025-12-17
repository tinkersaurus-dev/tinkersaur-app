/**
 * Entity Relationship Diagram Renderer
 *
 * Renders ER diagram entity shapes with entity name and typed attributes.
 * Attributes include type, name, optional key markers (PK/FK/UK), and optional comments.
 * Supports editable fields and dynamic add/delete operations.
 */

import { useState, useRef, useEffect } from 'react';
import { FaPlus } from 'react-icons/fa';
import type { ShapeRendererProps } from '../../shared/rendering/types';
import { getEntityShapeData, type EntityAttributeData } from '~/core/entities/design-studio/types/Shape';
import { ConnectionPointRenderer } from '../../shared/rendering/ConnectionPointRenderer';
import { EditableLabel } from '~/design-studio/components/canvas/editors/EditableLabel';
import { EntityAttributeEditor } from '../components/EntityAttributeEditor';
import { ShapeWrapper } from '../../shared/rendering/ShapeWrapper';
import { STANDARD_RECTANGLE_CONNECTION_POINTS } from '~/design-studio/utils/connectionPoints';
import { THEME_CONFIG } from '~/core/config/theme-config';
import { useCanvasEvents } from '~/design-studio/components/canvas/core/CanvasEventsContext';

export function EntityRenderer({
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

  // Get entity editing callbacks from context
  const {
    addEntityAttribute,
    deleteEntityAttribute,
    updateEntityAttribute,
    updateEntityAttributeLocal,
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

  // Parse entity shape data using type-safe helper
  const entityData = getEntityShapeData(shape);
  const attributes = entityData.attributes;

  // Track which attribute is being edited and its original value
  const [editingAttribute, setEditingAttribute] = useState<number | null>(null);
  const [editingAttributeOriginal, setEditingAttributeOriginal] = useState<EntityAttributeData | null>(null);

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
      {/* Entity name section */}
      <div
        style={{
          padding: `${padding}px`,
          borderBottom: `${1 / zoom}px solid var(--border)`,
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          backgroundColor: 'var(--bg-subtle)',
        }}
      >
        <EditableLabel
          label={shape.label || 'Entity'}
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
            textTransform: 'uppercase',
            letterSpacing: '0.5px',
          }}
        />
      </div>

      {/* Attributes section */}
      <div
        style={{
          padding: `${padding / 2}px 0`,
          position: 'relative',
          flexGrow: 1,
        }}
      >
        {attributes.length === 0 ? (
          <div
            style={{
              padding: `${padding / 2}px ${padding}px`,
              color: 'var(--text-muted)',
              fontSize: itemFontSize,
              fontStyle: 'italic',
              textAlign: 'center',
            }}
          >
            No attributes
          </div>
        ) : (
          attributes.map((attr, index) => (
            <EntityAttributeEditor
              key={`${shape.id}-attr-${index}`}
              attribute={attr}
              isEditing={editingAttribute === index}
              onStartEdit={() => {
                setEditingAttribute(index);
                setEditingAttributeOriginal({ ...attr });
              }}
              onChange={(newAttribute) => {
                // Update local state only (no database save)
                updateEntityAttributeLocal?.(shape.id, index, newAttribute);
              }}
              onFinishEdit={() => {
                // Save to database only when editing finishes
                if (editingAttribute !== null && editingAttributeOriginal) {
                  const currentAttr = attributes[editingAttribute];
                  // Check if attribute changed
                  if (
                    currentAttr.type !== editingAttributeOriginal.type ||
                    currentAttr.name !== editingAttributeOriginal.name ||
                    currentAttr.key !== editingAttributeOriginal.key ||
                    currentAttr.comment !== editingAttributeOriginal.comment
                  ) {
                    updateEntityAttribute?.(shape.id, editingAttribute, editingAttributeOriginal, currentAttr);
                  }
                }
                setEditingAttribute(null);
                setEditingAttributeOriginal(null);
              }}
              onDelete={() => {
                deleteEntityAttribute?.(shape.id, index);
              }}
              fontSize={itemFontSize}
              showDelete={showHover}
              zoom={zoom}
            />
          ))
        )}

        {/* Add attribute button */}
        {showHover && (
          <button
            data-interactive="true"
            onClick={() => {
              addEntityAttribute?.(shape.id);
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
            title="Add attribute"
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
