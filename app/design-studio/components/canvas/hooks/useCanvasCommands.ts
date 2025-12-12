/**
 * Canvas Commands Hook
 *
 * Encapsulates command execution and CRUD operation wrappers for the canvas.
 * Provides a clean interface for executing commands and editing specialized shapes.
 *
 * This hook consolidates:
 * - Command execution via CommandManager
 * - Class shape editing (stereotype, attributes, methods)
 * - Enumeration shape editing (literals)
 */

import { useCallback } from 'react';
import { commandManager } from '~/core/commands/CommandManager';
import { useClassShapeEditing } from '~/design-studio/diagrams/class/hooks';
import { useEnumerationShapeEditing } from '~/design-studio/diagrams/enumeration/hooks';
import type { Command } from '~/core/commands/command.types';
import type { CommandFactory } from '~/core/commands/CommandFactory';
import type { Shape } from '~/core/entities/design-studio/types/Shape';

export interface UseCanvasCommandsProps {
  diagramId: string;
  commandFactory: CommandFactory;
  getShape: (shapeId: string) => Shape | undefined;
  updateLocalShape: (shapeId: string, updates: Partial<Shape>) => void;
}

export interface UseCanvasCommandsReturn {
  // Command execution
  executeCommand: (command: Command) => Promise<void>;

  // Class shape editing
  updateStereotype: (shapeId: string, stereotype: string | undefined) => void;
  addAttribute: (shapeId: string, attribute?: string) => void;
  deleteAttribute: (shapeId: string, attributeIndex: number) => void;
  updateAttribute: (shapeId: string, attributeIndex: number, oldValue: string, newValue: string) => void;
  updateAttributeLocal: (shapeId: string, attributeIndex: number, newValue: string) => void;
  addMethod: (shapeId: string, method?: string) => void;
  deleteMethod: (shapeId: string, methodIndex: number) => void;
  updateMethod: (shapeId: string, methodIndex: number, oldValue: string, newValue: string) => void;
  updateMethodLocal: (shapeId: string, methodIndex: number, newValue: string) => void;

  // Enumeration shape editing
  addLiteral: (shapeId: string, literal?: string) => void;
  deleteLiteral: (shapeId: string, literalIndex: number) => void;
  updateLiteral: (shapeId: string, literalIndex: number, oldValue: string, newValue: string) => void;
  updateLiteralLocal: (shapeId: string, literalIndex: number, newValue: string) => void;
}

export function useCanvasCommands({
  diagramId,
  commandFactory,
  getShape,
  updateLocalShape,
}: UseCanvasCommandsProps): UseCanvasCommandsReturn {
  // Helper function to execute commands
  const executeCommand = useCallback(
    async (command: Command) => {
      await commandManager.execute(command, diagramId);
    },
    [diagramId]
  );

  // Class shape editing hook
  const {
    updateStereotype,
    addAttribute,
    deleteAttribute,
    updateAttribute,
    updateAttributeLocal,
    addMethod,
    deleteMethod,
    updateMethod,
    updateMethodLocal,
  } = useClassShapeEditing({
    diagramId,
    commandFactory,
    getShape,
    updateLocalShape,
    executeCommand,
  });

  // Enumeration shape editing hook
  const {
    addLiteral,
    deleteLiteral,
    updateLiteral,
    updateLiteralLocal,
  } = useEnumerationShapeEditing({
    diagramId,
    commandFactory,
    getShape,
    updateLocalShape,
    executeCommand,
  });

  return {
    // Command execution
    executeCommand,

    // Class shape editing
    updateStereotype,
    addAttribute,
    deleteAttribute,
    updateAttribute,
    updateAttributeLocal,
    addMethod,
    deleteMethod,
    updateMethod,
    updateMethodLocal,

    // Enumeration shape editing
    addLiteral,
    deleteLiteral,
    updateLiteral,
    updateLiteralLocal,
  };
}
