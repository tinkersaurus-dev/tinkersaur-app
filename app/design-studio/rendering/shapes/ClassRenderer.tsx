/**
 * Class Diagram Renderer
 *
 * Renders UML class diagram shapes with stereotype, class name, attributes, and methods.
 * Supports editable fields and dynamic add/delete operations.
 */

import { useState } from 'react';
import { FaPlus } from 'react-icons/fa';
import type { ShapeRendererProps } from './types';
import type { ClassShapeData } from '~/core/entities/design-studio/types/Shape';
import { ConnectionPointRenderer } from './ConnectionPointRenderer';
import { EditableLabel } from '../../components/canvas/editors/EditableLabel';
import { ShapeDropdown } from '../../components/canvas/editors/ShapeDropdown';
import { ClassItemEditor } from '../../components/canvas/editors/ClassItemEditor';
import { ShapeWrapper } from './ShapeWrapper';
import { CLASS_CONNECTION_POINTS } from '~/design-studio/utils/connectionPoints';

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

  // Calculate zoom-compensated values
  let borderWidth = 2 / zoom;
  const borderRadius = 2;
  const padding = 8;
  const fontSize = 12;
  const itemFontSize = 11;

  // Determine border color based on state
  let borderColor = 'var(--border)';
  if (isSelected) {
    borderColor = 'var(--primary)';
    borderWidth = 3 / zoom;
  } else if (isHovered) {
    borderColor = 'var(--secondary)';
  }

  // Determine background color
  let backgroundColor = 'var(--bg)';
  if (isSelected) {
    backgroundColor = 'var(--bg)';
  } else if (isHovered) {
    backgroundColor = 'var(--bg-light)';
  }

  const addButtonWidth = Math.min(32, 16 * zoom)

  return (
    <ShapeWrapper
      shape={shape}
      isSelected={isSelected}
      isHovered={isHovered}
      zoom={zoom}
      borderColor={borderColor}
      borderWidth={borderWidth}
      backgroundColor={backgroundColor}
      borderRadius={borderRadius}
      hoverPadding={30}
      onMouseDown={onMouseDown}
      onMouseEnter={onMouseEnter}
      onMouseLeave={onMouseLeave}
      onDoubleClick={onDoubleClick}
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
          isEditing={isEditing}
          onStartEdit={() => {}}
          onLabelChange={(newLabel) => onLabelChange?.(shape.id, 'shape', newLabel)}
          onFinishEdit={() => onFinishEditing?.()}
          fontSize={fontSize}
          style={{
            color: 'var(--text)',
            fontWeight: 'bold',
            pointerEvents: isEditing ? 'auto' : 'none',
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
              showDelete={isHovered}
              zoom={zoom}
            />
          ))
        )}

        

        {/* Add attribute button */}
        {isHovered && (
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
              showDelete={isHovered}
              zoom={zoom}
            />
          ))
        )}

        {/* Add method button */}
        {isHovered && (
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
      {isHovered &&
        onConnectionPointMouseDown &&
        onConnectionPointMouseUp &&
        CLASS_CONNECTION_POINTS.map((connectionPoint) => (
          <ConnectionPointRenderer
            key={connectionPoint.id}
            connectionPoint={connectionPoint}
            shapeWidth={width}
            shapeHeight={height}
            onMouseDown={handleConnectionPointMouseDown}
            onMouseUp={handleConnectionPointMouseUp}
          />
        ))}
    </ShapeWrapper>
  );
}
