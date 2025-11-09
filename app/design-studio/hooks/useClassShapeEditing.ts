/**
 * Class Shape Editing Hook
 *
 * Provides functions to edit class diagram shapes (stereotype, attributes, methods).
 * Uses command pattern for undo/redo support.
 */

import { useCallback } from 'react';
import type { Shape, ClassShapeData } from '~/core/entities/design-studio/types/Shape';
import type { Diagram } from '~/core/entities/design-studio/types';
import type { Command } from '~/core/commands/command.types';
import { AddClassAttributeCommand } from '~/core/commands/canvas/AddClassAttributeCommand';
import { DeleteClassAttributeCommand } from '~/core/commands/canvas/DeleteClassAttributeCommand';
import { AddClassMethodCommand } from '~/core/commands/canvas/AddClassMethodCommand';
import { DeleteClassMethodCommand } from '~/core/commands/canvas/DeleteClassMethodCommand';
import { UpdateClassAttributeCommand } from '~/core/commands/canvas/UpdateClassAttributeCommand';
import { UpdateClassMethodCommand } from '~/core/commands/canvas/UpdateClassMethodCommand';
import { UpdateShapeDataCommand } from '~/core/commands/canvas/UpdateShapeDataCommand';

interface UseClassShapeEditingProps {
  diagramId: string;
  updateShape: (
    diagramId: string,
    shapeId: string,
    updates: Partial<Shape>
  ) => Promise<Diagram | null>;
  getShape: (shapeId: string) => Shape | undefined;
  updateLocalShape?: (shapeId: string, updates: Partial<Shape>) => void;
  executeCommand: (command: Command) => Promise<void>;
}

export function useClassShapeEditing({
  diagramId,
  updateShape,
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

      const currentData = (shape.data || {}) as unknown as ClassShapeData;
      const oldData = { ...currentData };
      const newData = { ...currentData, stereotype: newStereotype };

      const command = new UpdateShapeDataCommand(
        diagramId,
        shapeId,
        oldData,
        newData,
        updateShape,
        updateLocalShape
      );

      await executeCommand(command);
    },
    [diagramId, updateShape, getShape, updateLocalShape, executeCommand]
  );

  /**
   * Add a new attribute to a class shape
   */
  const addAttribute = useCallback(
    async (shapeId: string, attribute: string = '+ newAttribute: type') => {
      const command = new AddClassAttributeCommand(
        diagramId,
        shapeId,
        attribute,
        updateShape,
        getShape,
        updateLocalShape
      );

      await executeCommand(command);
    },
    [diagramId, updateShape, getShape, updateLocalShape, executeCommand]
  );

  /**
   * Delete an attribute from a class shape
   */
  const deleteAttribute = useCallback(
    async (shapeId: string, attributeIndex: number) => {
      const command = new DeleteClassAttributeCommand(
        diagramId,
        shapeId,
        attributeIndex,
        updateShape,
        getShape,
        updateLocalShape
      );

      await executeCommand(command);
    },
    [diagramId, updateShape, getShape, updateLocalShape, executeCommand]
  );

  /**
   * Update an existing attribute (persists to database)
   */
  const updateAttribute = useCallback(
    async (shapeId: string, attributeIndex: number, newValue: string) => {
      const shape = getShape(shapeId);
      if (!shape) return;

      const currentData = (shape.data || {}) as unknown as ClassShapeData;
      const attributes = currentData.attributes || [];
      const oldValue = attributes[attributeIndex];

      if (oldValue === newValue) return; // No change

      const command = new UpdateClassAttributeCommand(
        diagramId,
        shapeId,
        attributeIndex,
        oldValue,
        newValue,
        updateShape,
        getShape,
        updateLocalShape
      );

      await executeCommand(command);
    },
    [diagramId, updateShape, getShape, updateLocalShape, executeCommand]
  );

  /**
   * Update attribute locally only (does NOT persist to database)
   * Used during typing to avoid saving on every keystroke
   */
  const updateAttributeLocal = useCallback(
    (shapeId: string, attributeIndex: number, newValue: string) => {
      const shape = getShape(shapeId);
      if (!shape) return;

      const currentData = (shape.data || {}) as unknown as ClassShapeData;
      const attributes = currentData.attributes || [];

      const newAttributes = [...attributes];
      newAttributes[attributeIndex] = newValue;

      const newData: ClassShapeData = {
        ...currentData,
        attributes: newAttributes,
      };

      updateLocalShape?.(shapeId, {
        data: newData as unknown as Record<string, unknown>,
      });
    },
    [getShape, updateLocalShape]
  );

  /**
   * Add a new method to a class shape
   */
  const addMethod = useCallback(
    async (shapeId: string, method: string = '+ newMethod(): returnType') => {
      const command = new AddClassMethodCommand(
        diagramId,
        shapeId,
        method,
        updateShape,
        getShape,
        updateLocalShape
      );

      await executeCommand(command);
    },
    [diagramId, updateShape, getShape, updateLocalShape, executeCommand]
  );

  /**
   * Delete a method from a class shape
   */
  const deleteMethod = useCallback(
    async (shapeId: string, methodIndex: number) => {
      const command = new DeleteClassMethodCommand(
        diagramId,
        shapeId,
        methodIndex,
        updateShape,
        getShape,
        updateLocalShape
      );

      await executeCommand(command);
    },
    [diagramId, updateShape, getShape, updateLocalShape, executeCommand]
  );

  /**
   * Update an existing method (persists to database)
   */
  const updateMethod = useCallback(
    async (shapeId: string, methodIndex: number, newValue: string) => {
      const shape = getShape(shapeId);
      if (!shape) return;

      const currentData = (shape.data || {}) as unknown as ClassShapeData;
      const methods = currentData.methods || [];
      const oldValue = methods[methodIndex];

      if (oldValue === newValue) return; // No change

      const command = new UpdateClassMethodCommand(
        diagramId,
        shapeId,
        methodIndex,
        oldValue,
        newValue,
        updateShape,
        getShape,
        updateLocalShape
      );

      await executeCommand(command);
    },
    [diagramId, updateShape, getShape, updateLocalShape, executeCommand]
  );

  /**
   * Update method locally only (does NOT persist to database)
   * Used during typing to avoid saving on every keystroke
   */
  const updateMethodLocal = useCallback(
    (shapeId: string, methodIndex: number, newValue: string) => {
      const shape = getShape(shapeId);
      if (!shape) return;

      const currentData = (shape.data || {}) as unknown as ClassShapeData;
      const methods = currentData.methods || [];

      const newMethods = [...methods];
      newMethods[methodIndex] = newValue;

      const newData: ClassShapeData = {
        ...currentData,
        methods: newMethods,
      };

      updateLocalShape?.(shapeId, {
        data: newData as unknown as Record<string, unknown>,
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
