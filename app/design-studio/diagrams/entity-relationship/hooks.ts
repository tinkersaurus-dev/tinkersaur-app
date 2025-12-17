/**
 * Entity Relationship Diagram Shape Editing Hook
 *
 * Provides functions to edit entity shapes:
 * - Add, delete, update entity attributes
 *
 * Uses command pattern for undo/redo support.
 */

import { useCallback } from 'react';
import { getEntityShapeData, type Shape, type EntityShapeData, type EntityAttributeData } from '~/core/entities/design-studio/types/Shape';
import type { Command } from '~/core/commands/command.types';
import type { CommandFactory } from '~/core/commands/CommandFactory';
import { AddEntityAttributeCommand } from './commands/AddEntityAttributeCommand';
import { DeleteEntityAttributeCommand } from './commands/DeleteEntityAttributeCommand';
import { UpdateEntityAttributeCommand } from './commands/UpdateEntityAttributeCommand';
import { calculateEntityHeight } from './utils';

interface UseEntityShapeEditingProps {
  diagramId: string;
  commandFactory: CommandFactory;
  getShape: (shapeId: string) => Shape | undefined;
  updateLocalShape?: (shapeId: string, updates: Partial<Shape>) => void;
  executeCommand: (command: Command) => Promise<void>;
}

export function useEntityShapeEditing({
  diagramId,
  commandFactory,
  getShape,
  updateLocalShape,
  executeCommand,
}: UseEntityShapeEditingProps) {
  /**
   * Add a new attribute to an entity shape
   */
  const addEntityAttribute = useCallback(
    async (shapeId: string, attribute?: EntityAttributeData) => {
      const defaultAttribute: EntityAttributeData = attribute || {
        type: 'string',
        name: 'newAttribute',
      };

      const command = new AddEntityAttributeCommand(
        {
          diagramId,
          shapeId,
          updateShapeFn: commandFactory.getInternalUpdateShapeFn(),
          getShapeFn: getShape,
          updateLocalShapeFn: commandFactory.getUpdateLocalShapeFn(diagramId),
        },
        defaultAttribute
      );

      await executeCommand(command);
    },
    [diagramId, commandFactory, getShape, executeCommand]
  );

  /**
   * Delete an attribute from an entity shape
   */
  const deleteEntityAttribute = useCallback(
    async (shapeId: string, attributeIndex: number) => {
      const shape = getShape(shapeId);
      if (!shape) return;

      const entityData = getEntityShapeData(shape);
      const attributeToDelete = entityData.attributes[attributeIndex];
      if (!attributeToDelete) return;

      const command = new DeleteEntityAttributeCommand(
        {
          diagramId,
          shapeId,
          updateShapeFn: commandFactory.getInternalUpdateShapeFn(),
          getShapeFn: getShape,
          updateLocalShapeFn: commandFactory.getUpdateLocalShapeFn(diagramId),
        },
        attributeIndex
      );

      await executeCommand(command);
    },
    [diagramId, commandFactory, getShape, executeCommand]
  );

  /**
   * Update an existing attribute (persists to database)
   */
  const updateEntityAttribute = useCallback(
    async (shapeId: string, attributeIndex: number, oldValue: EntityAttributeData, newValue: EntityAttributeData) => {
      // Check if attribute actually changed
      if (
        oldValue.type === newValue.type &&
        oldValue.name === newValue.name &&
        oldValue.key === newValue.key &&
        oldValue.comment === newValue.comment
      ) {
        return; // No change
      }

      const command = new UpdateEntityAttributeCommand(
        {
          diagramId,
          shapeId,
          updateShapeFn: commandFactory.getInternalUpdateShapeFn(),
          getShapeFn: getShape,
          updateLocalShapeFn: commandFactory.getUpdateLocalShapeFn(diagramId),
        },
        attributeIndex,
        oldValue,
        newValue
      );

      await executeCommand(command);
    },
    [diagramId, commandFactory, getShape, executeCommand]
  );

  /**
   * Update attribute locally only (does NOT persist to database)
   * Used during typing to avoid saving on every keystroke
   */
  const updateEntityAttributeLocal = useCallback(
    (shapeId: string, attributeIndex: number, newValue: EntityAttributeData) => {
      const shape = getShape(shapeId);
      if (!shape) return;

      const currentData = getEntityShapeData(shape);
      const attributes = currentData.attributes;

      const newAttributes = [...attributes];
      newAttributes[attributeIndex] = newValue;

      const newData: EntityShapeData = {
        ...currentData,
        attributes: newAttributes,
      };

      updateLocalShape?.(shapeId, {
        data: newData,
        height: calculateEntityHeight(newData),
      });
    },
    [getShape, updateLocalShape]
  );

  return {
    addEntityAttribute,
    deleteEntityAttribute,
    updateEntityAttribute,
    updateEntityAttributeLocal,
  };
}
