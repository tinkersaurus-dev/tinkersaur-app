/**
 * Class Shape Editing Hook
 *
 * Provides functions to edit class diagram shapes (stereotype, attributes, methods).
 * Uses command pattern for undo/redo support.
 */

import { useCallback } from 'react';
import { getClassShapeData, type Shape, type ClassShapeData } from '~/core/entities/design-studio/types/Shape';
import type { Command } from '~/core/commands/command.types';
import type { CommandFactory } from '~/core/commands/CommandFactory';

interface UseClassShapeEditingProps {
  diagramId: string;
  commandFactory: CommandFactory;
  getShape: (shapeId: string) => Shape | undefined;
  updateLocalShape?: (shapeId: string, updates: Partial<Shape>) => void;
  executeCommand: (command: Command) => Promise<void>;
}

export function useClassShapeEditing({
  diagramId,
  commandFactory,
  getShape,
  updateLocalShape,
  executeCommand,
}: UseClassShapeEditingProps) {
  /**
   * Update stereotype for a class shape
   */
  const updateStereotype = useCallback(
    async (shapeId: string, newStereotype: string | undefined) => {
      const shape = getShape(shapeId);
      if (!shape) return;

      const currentData = getClassShapeData(shape);
      const oldData = { ...currentData };
      const newData = { ...currentData, stereotype: newStereotype };

      const command = commandFactory.createUpdateShapeData(
        diagramId,
        shapeId,
        oldData,
        newData
      );

      await executeCommand(command);
    },
    [diagramId, commandFactory, getShape, executeCommand]
  );

  /**
   * Add a new attribute to a class shape
   */
  const addAttribute = useCallback(
    async (shapeId: string, attribute: string = '+ newAttribute: type') => {
      const command = commandFactory.createAddClassAttribute(
        diagramId,
        shapeId,
        attribute,
        getShape
      );

      await executeCommand(command);
    },
    [diagramId, commandFactory, getShape, executeCommand]
  );

  /**
   * Delete an attribute from a class shape
   */
  const deleteAttribute = useCallback(
    async (shapeId: string, attributeIndex: number) => {
      const command = commandFactory.createDeleteClassAttribute(
        diagramId,
        shapeId,
        attributeIndex,
        getShape
      );

      await executeCommand(command);
    },
    [diagramId, commandFactory, getShape, executeCommand]
  );

  /**
   * Update an existing attribute (persists to database)
   */
  const updateAttribute = useCallback(
    async (shapeId: string, attributeIndex: number, oldValue: string, newValue: string) => {
      if (oldValue === newValue) return; // No change

      const command = commandFactory.createUpdateClassAttribute(
        diagramId,
        shapeId,
        attributeIndex,
        oldValue,
        newValue,
        getShape
      );

      await executeCommand(command);
    },
    [diagramId, commandFactory, getShape, executeCommand]
  );

  /**
   * Update attribute locally only (does NOT persist to database)
   * Used during typing to avoid saving on every keystroke
   */
  const updateAttributeLocal = useCallback(
    (shapeId: string, attributeIndex: number, newValue: string) => {
      const shape = getShape(shapeId);
      if (!shape) return;

      const currentData = getClassShapeData(shape);
      const attributes = currentData.attributes;

      const newAttributes = [...attributes];
      newAttributes[attributeIndex] = newValue;

      const newData: ClassShapeData = {
        ...currentData,
        attributes: newAttributes,
      };

      updateLocalShape?.(shapeId, {
        data: newData,
      });
    },
    [getShape, updateLocalShape]
  );

  /**
   * Add a new method to a class shape
   */
  const addMethod = useCallback(
    async (shapeId: string, method: string = '+ newMethod(): returnType') => {
      const command = commandFactory.createAddClassMethod(
        diagramId,
        shapeId,
        method,
        getShape
      );

      await executeCommand(command);
    },
    [diagramId, commandFactory, getShape, executeCommand]
  );

  /**
   * Delete a method from a class shape
   */
  const deleteMethod = useCallback(
    async (shapeId: string, methodIndex: number) => {
      const command = commandFactory.createDeleteClassMethod(
        diagramId,
        shapeId,
        methodIndex,
        getShape
      );

      await executeCommand(command);
    },
    [diagramId, commandFactory, getShape, executeCommand]
  );

  /**
   * Update an existing method (persists to database)
   */
  const updateMethod = useCallback(
    async (shapeId: string, methodIndex: number, oldValue: string, newValue: string) => {
      if (oldValue === newValue) return; // No change

      const command = commandFactory.createUpdateClassMethod(
        diagramId,
        shapeId,
        methodIndex,
        oldValue,
        newValue,
        getShape
      );

      await executeCommand(command);
    },
    [diagramId, commandFactory, getShape, executeCommand]
  );

  /**
   * Update method locally only (does NOT persist to database)
   * Used during typing to avoid saving on every keystroke
   */
  const updateMethodLocal = useCallback(
    (shapeId: string, methodIndex: number, newValue: string) => {
      const shape = getShape(shapeId);
      if (!shape) return;

      const currentData = getClassShapeData(shape);
      const methods = currentData.methods;

      const newMethods = [...methods];
      newMethods[methodIndex] = newValue;

      const newData: ClassShapeData = {
        ...currentData,
        methods: newMethods,
      };

      updateLocalShape?.(shapeId, {
        data: newData,
      });
    },
    [getShape, updateLocalShape]
  );

  return {
    updateStereotype,
    addAttribute,
    deleteAttribute,
    updateAttribute,
    updateAttributeLocal,
    addMethod,
    deleteMethod,
    updateMethod,
    updateMethodLocal,
  };
}
