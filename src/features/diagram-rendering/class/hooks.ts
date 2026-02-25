/**
 * Class Diagram Shape Editing Hooks
 *
 * Provides functions to edit class diagram shapes:
 * - Class shapes: stereotype, attributes, methods
 * - Enumeration shapes: literals
 *
 * Uses command pattern for undo/redo support.
 */

import { useCallback } from 'react';
import { getClassShapeData, getEnumerationShapeData, type Shape, type ClassShapeData, type EnumerationShapeData } from '@/entities/shape';
import type { Command } from '@/shared/model/commands';
import type { CommandFactory } from '@/features/canvas-commands/model/CommandFactory';

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

// ============================================================================
// Enumeration Shape Editing Hook
// ============================================================================

interface UseEnumerationShapeEditingProps {
  diagramId: string;
  commandFactory: CommandFactory;
  getShape: (shapeId: string) => Shape | undefined;
  updateLocalShape?: (shapeId: string, updates: Partial<Shape>) => void;
  executeCommand: (command: Command) => Promise<void>;
}

export function useEnumerationShapeEditing({
  diagramId,
  commandFactory,
  getShape,
  updateLocalShape,
  executeCommand,
}: UseEnumerationShapeEditingProps) {
  /**
   * Add a new literal to an enumeration shape
   */
  const addLiteral = useCallback(
    async (shapeId: string, literal: string = 'NEW_LITERAL') => {
      const command = commandFactory.createAddEnumerationLiteral(
        diagramId,
        shapeId,
        literal,
        getShape
      );

      await executeCommand(command);
    },
    [diagramId, commandFactory, getShape, executeCommand]
  );

  /**
   * Delete a literal from an enumeration shape
   */
  const deleteLiteral = useCallback(
    async (shapeId: string, literalIndex: number) => {
      const command = commandFactory.createDeleteEnumerationLiteral(
        diagramId,
        shapeId,
        literalIndex,
        getShape
      );

      await executeCommand(command);
    },
    [diagramId, commandFactory, getShape, executeCommand]
  );

  /**
   * Update an existing literal (persists to database)
   */
  const updateLiteral = useCallback(
    async (shapeId: string, literalIndex: number, oldValue: string, newValue: string) => {
      if (oldValue === newValue) return; // No change

      const command = commandFactory.createUpdateEnumerationLiteral(
        diagramId,
        shapeId,
        literalIndex,
        oldValue,
        newValue,
        getShape
      );

      await executeCommand(command);
    },
    [diagramId, commandFactory, getShape, executeCommand]
  );

  /**
   * Update literal locally only (does NOT persist to database)
   * Used during typing to avoid saving on every keystroke
   */
  const updateLiteralLocal = useCallback(
    (shapeId: string, literalIndex: number, newValue: string) => {
      const shape = getShape(shapeId);
      if (!shape) return;

      const currentData = getEnumerationShapeData(shape);
      const literals = currentData.literals;

      const newLiterals = [...literals];
      newLiterals[literalIndex] = newValue;

      const newData: EnumerationShapeData = {
        ...currentData,
        literals: newLiterals,
      };

      updateLocalShape?.(shapeId, {
        data: newData,
      });
    },
    [getShape, updateLocalShape]
  );

  return {
    addLiteral,
    deleteLiteral,
    updateLiteral,
    updateLiteralLocal,
  };
}
