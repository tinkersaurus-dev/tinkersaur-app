/**
 * Enumeration Shape Editing Hook
 *
 * Provides functions to edit enumeration diagram shapes (literals).
 * Uses command pattern for undo/redo support.
 */

import { useCallback } from 'react';
import type { Shape, EnumerationShapeData } from '~/core/entities/design-studio/types/Shape';
import type { Command } from '~/core/commands/command.types';
import type { CommandFactory } from '~/core/commands/CommandFactory';

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
    async (shapeId: string, literalIndex: number, newValue: string) => {
      const shape = getShape(shapeId);
      if (!shape) return;

      const currentData = (shape.data || {}) as unknown as EnumerationShapeData;
      const literals = currentData.literals || [];
      const oldValue = literals[literalIndex];

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

      const currentData = (shape.data || {}) as unknown as EnumerationShapeData;
      const literals = currentData.literals || [];

      const newLiterals = [...literals];
      newLiterals[literalIndex] = newValue;

      const newData: EnumerationShapeData = {
        ...currentData,
        literals: newLiterals,
      };

      updateLocalShape?.(shapeId, {
        data: newData as unknown as Record<string, unknown>,
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
