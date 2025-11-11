/**
 * useToolHandler Hook
 * Polymorphic tool selection handler that works with any diagram type
 * Eliminates duplication between BPMN, Class, and future diagram tool handlers
 */

import { useCallback } from 'react';
import type { BaseTool } from '../types/tools';
import type { CreateShapeDTO } from '../../core/entities/design-studio/types/Shape';
import type { UseContextMenuManagerReturn } from './useContextMenuManager';

/**
 * Configuration for the tool handler
 */
export interface UseToolHandlerConfig<T extends BaseTool> {
  /** Function to add a shape to the diagram */
  addShape?: (shape: CreateShapeDTO) => Promise<void>;
  /** Menu manager for closing menus after tool selection */
  menuManager: UseContextMenuManagerReturn;
  /** Function that maps a tool to a CreateShapeDTO */
  toolToShapeMapper: (tool: T, canvasX: number, canvasY: number) => CreateShapeDTO;
}

/**
 * Return type for useToolHandler
 */
export interface UseToolHandlerReturn<T extends BaseTool> {
  /** Handler function for tool selection */
  handleToolSelect: (tool: T, canvasX: number, canvasY: number) => Promise<void>;
}

/**
 * Generic hook for handling tool selection across different diagram types
 *
 * @example
 * ```tsx
 * const { handleToolSelect: handleBpmnToolSelect } = useToolHandler({
 *   addShape,
 *   menuManager,
 *   toolToShapeMapper: mapBpmnToolToShape,
 * });
 * ```
 */
export function useToolHandler<T extends BaseTool>(
  config: UseToolHandlerConfig<T>
): UseToolHandlerReturn<T> {
  const { addShape, menuManager, toolToShapeMapper } = config;

  const handleToolSelect = useCallback(
    async (tool: T, canvasX: number, canvasY: number) => {
      // Guard clause: ensure addShape is available
      if (!addShape) return;

      try {
        // Map tool to shape DTO using the provided mapper function
        const shapeDTO = toolToShapeMapper(tool, canvasX, canvasY);

        // Create the shape
        await addShape(shapeDTO);

        // Close the menu after successful shape creation
        menuManager.closeMenu();
      } catch (error) {
        // Log error but don't throw - let the UI remain stable
        console.error('Error creating shape from tool:', error);
        // Still close the menu even if shape creation failed
        menuManager.closeMenu();
      }
    },
    [addShape, menuManager, toolToShapeMapper]
  );

  return { handleToolSelect };
}
