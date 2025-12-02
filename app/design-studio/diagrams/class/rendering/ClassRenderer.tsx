/**
 * Class Diagram Renderer
 *
 * Renders UML class diagram shapes with stereotype, class name, attributes, and methods.
 * Supports editable fields and dynamic add/delete operations.
 */

import { useState, useRef, useEffect } from 'react';
import { FaPlus } from 'react-icons/fa';
import type { ShapeRendererProps } from '../../shared/rendering/types';
import type { ClassShapeData } from '~/core/entities/design-studio/types/Shape';
import { ConnectionPointRenderer } from '../../shared/rendering/ConnectionPointRenderer';
import { EditableLabel } from '~/design-studio/components/canvas/editors/EditableLabel';
import { ShapeDropdown } from '~/design-studio/components/canvas/editors/ShapeDropdown';
import { ClassItemEditor } from '../components/ClassItemEditor';
import { ShapeWrapper } from '../../shared/rendering/ShapeWrapper';
import { STANDARD_RECTANGLE_CONNECTION_POINTS } from '~/design-studio/utils/connectionPoints';
import { THEME_CONFIG } from '~/core/config/theme-config';

const STEREOTYPE_OPTIONS = [
  { value: 'interface', label: '<<interface>>' },
  { value: 'abstract', label: '<<abstract>>' },
  { value: 'entity', label: '<<entity>>' },
  { value: 'service', label: '<<service>>' },
  { value: 'controller', label: '<<controller>>' },
  { value: 'repository', label: '<<repository>>' },
];



export function ClassRenderer({
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
  onClassStereotypeChange,
  onClassAddAttribute,
  onClassDeleteAttribute,
  onClassUpdateAttribute,
  onClassUpdateAttributeLocal,
  onClassAddMethod,
  onClassDeleteMethod,
  onClassUpdateMethod,
  onClassUpdateMethodLocal,
}: ShapeRendererProps): React.ReactElement {
  const { width, height } = shape;
  const { isSelected, isHovered, zoom } = context;

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

  // Parse class shape data
  const classData = (shape.data || {}) as unknown as ClassShapeData;
  const stereotype = classData.stereotype;
  const attributes = classData.attributes || [];
  const methods = classData.methods || [];

  // Track which attribute/method is being edited and their original values
  const [editingAttribute, setEditingAttribute] = useState<number | null>(null);
  const [editingAttributeOriginal, setEditingAttributeOriginal] = useState<string>('');
  const [editingMethod, setEditingMethod] = useState<number | null>(null);
  const [editingMethodOriginal, setEditingMethodOriginal] = useState<string>('');

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

  const addButtonWidth = Math.min(32, 16 * zoom)

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
      {/* Stereotype section */}
      <div
        style={{
          padding: `${padding / 2}px ${padding}px`,
          borderBottom: `${1 / zoom}px solid var(--border)`,
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          //minHeight: `${lineHeight}px`,
        }}
      >
        <ShapeDropdown
          value={stereotype}
          options={STEREOTYPE_OPTIONS}
          onChange={(newValue) => {
            onClassStereotypeChange?.(shape.id, newValue || undefined);
          }}
          fontSize={fontSize * 0.9}
          placeholder="<<stereotype>>"
          style={{
            color: 'var(--text-muted)',
            fontStyle: 'italic',
          }}
        />
      </div>

      {/* Class name section */}
      <div
        style={{
          padding: `${padding}px`,
          borderBottom: `${1 / zoom}px solid var(--border)`,
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          //minHeight: `${lineHeight}px`,
        }}
      >
        <EditableLabel
          label={shape.label || 'ClassName'}
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

      {/* Attributes section */}
      <div
        style={{
          padding: `${padding / 2}px 0`,
          borderBottom: `${1 / zoom}px solid var(--border)`,
          //minHeight: `${lineHeight}px`,
          position: 'relative',
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
            <ClassItemEditor
              key={index}
              value={attr}
              isEditing={editingAttribute === index}
              onStartEdit={() => {
                setEditingAttribute(index);
                setEditingAttributeOriginal(attr);
              }}
              onChange={(newValue) => {
                // Update local state only (no database save)
                onClassUpdateAttributeLocal?.(shape.id, index, newValue);
              }}
              onFinishEdit={() => {
                // Save to database only when editing finishes
                if (editingAttribute !== null && attributes[editingAttribute] !== editingAttributeOriginal) {
                  onClassUpdateAttribute?.(shape.id, editingAttribute, attributes[editingAttribute]);
                }
                setEditingAttribute(null);
                setEditingAttributeOriginal('');
              }}
              onDelete={() => {
                onClassDeleteAttribute?.(shape.id, index);
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
              onClassAddAttribute?.(shape.id);
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

      {/* Methods section */}
      <div
        style={{
          padding: `${padding / 2}px 0`,
          //minHeight: `${lineHeight}px`,
          position: 'relative',
        }}
      >
        {methods.length === 0 ? (
          <div
            style={{
              padding: `${padding / 2}px ${padding}px`,
              color: 'var(--text-muted)',
              fontSize: `${itemFontSize}px`,
              fontStyle: 'italic',
              textAlign: 'center',
            }}
          >
            No methods
          </div>
        ) : (
          methods.map((method, index) => (
            <ClassItemEditor
              key={index}
              value={method}
              isEditing={editingMethod === index}
              onStartEdit={() => {
                setEditingMethod(index);
                setEditingMethodOriginal(method);
              }}
              onChange={(newValue) => {
                // Update local state only (no database save)
                onClassUpdateMethodLocal?.(shape.id, index, newValue);
              }}
              onFinishEdit={() => {
                // Save to database only when editing finishes
                if (editingMethod !== null && methods[editingMethod] !== editingMethodOriginal) {
                  onClassUpdateMethod?.(shape.id, editingMethod, methods[editingMethod]);
                }
                setEditingMethod(null);
                setEditingMethodOriginal('');
              }}
              onDelete={() => {
                onClassDeleteMethod?.(shape.id, index);
              }}
              fontSize={itemFontSize}
              showDelete={showHover}
              zoom={zoom}
            />
          ))
        )}

        {/* Add method button */}
        {showHover && (
          <button
            data-interactive="true"
            onClick={() => {
              onClassAddMethod?.(shape.id);
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
            title="Add method"
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
