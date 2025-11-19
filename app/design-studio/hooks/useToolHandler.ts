/**
 * useToolHandler Hook
 * Polymorphic tool selection handler that works with any diagram type
 * Eliminates duplication between BPMN, Class, and future diagram tool handlers
 */

import { useCallback } from 'react';
import type { BaseTool } from '../types/tools';
import type { CreateShapeDTO } from '../../core/entities/design-studio/types/Shape';
import type { CreateConnectorDTO } from '../../core/entities/design-studio/types/Connector';
import type { UseContextMenuManagerReturn, PendingConnector } from './useContextMenuManager';
import {
  getOppositeAnchor,
  calculateShapeCenterForAnchorPosition,
  connectionPointDirectionToAnchor,
  getDefaultShapeDimensions,
} from '../utils/connectorGeometry';

/**
 * Configuration for the tool handler
 */
export interface UseToolHandlerConfig<T extends BaseTool> {
  /** Function to add a shape to the diagram */
  addShape?: (shape: CreateShapeDTO) => Promise<string>;
  /** Function to add a connector to the diagram */
  addConnector?: (connector: CreateConnectorDTO) => Promise<void>;
  /** Active connector type for the diagram */
  activeConnectorType?: string;
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
  const { addShape, addConnector, activeConnectorType, menuManager, toolToShapeMapper } = config;

  const handleToolSelect = useCallback(
    async (tool: T, canvasX: number, canvasY: number) => {
      // Guard clause: ensure addShape is available
      if (!addShape) return;

      try {
        // Check if there's a pending connector in the menu metadata
        const menuConfig = menuManager.activeMenuConfig;
        const pendingConnector = menuConfig?.metadata?.pendingConnector as PendingConnector | undefined;

        let finalCanvasX = canvasX;
        let finalCanvasY = canvasY;

        if (pendingConnector) {
          // Calculate the opposite anchor for the new shape
          const sourceAnchor = connectionPointDirectionToAnchor(pendingConnector.sourceDirection);
          const targetAnchor = getOppositeAnchor(sourceAnchor);

          // Get shape dimensions from the tool or use defaults
          const dimensions = getDefaultShapeDimensions(tool.shapeType || 'default');

          // Calculate shape center position so the target anchor aligns with the click position
          const centerPosition = calculateShapeCenterForAnchorPosition(
            { x: canvasX, y: canvasY },
            dimensions,
            targetAnchor
          );

          finalCanvasX = centerPosition.x;
          finalCanvasY = centerPosition.y;
        }

        // Map tool to shape DTO using the provided mapper function
        const shapeDTO = toolToShapeMapper(tool, finalCanvasX, finalCanvasY);

        // Create the shape and get the generated ID
        const createdShapeId = await addShape(shapeDTO);

        // If there's a pending connector, create the connector too
        if (pendingConnector && addConnector && activeConnectorType) {
          // Parse the source connection point ID from the full ID
          // Full format: "{shapeId}-{connectionPointId}"
          // Example: "a1b2c3d4-e5f6-7890-abcd-ef1234567890-n-40"
          // We need to extract just the connection point part (after the UUID)
          const sourceIdParts = pendingConnector.sourceConnectionPointId.split('-');
          // UUID has 5 parts, connection point ID is everything after
          const sourceConnectionPoint = sourceIdParts.slice(5).join('-');

          // Get the target connection point direction (opposite of source)
          const targetDirection = getOppositeAnchor(connectionPointDirectionToAnchor(pendingConnector.sourceDirection));
          // Connection point format is typically "{direction}-{percentage}" like "n-40" or "s-50"
          // For now, we'll use a default center position (50%)
          const targetConnectionPoint = `${targetDirection.toLowerCase()}-50`;

          const connectorDTO: CreateConnectorDTO = {
            type: activeConnectorType,
            sourceShapeId: pendingConnector.sourceShapeId,
            targetShapeId: createdShapeId,
            sourceConnectionPoint,
            targetConnectionPoint,
            style: 'orthogonal',
            markerStart: 'none',
            markerEnd: 'arrow',
            lineType: 'solid',
            zIndex: 0,
          };

          await addConnector(connectorDTO);
        }

        // Close the menu after successful shape (and connector) creation
        menuManager.closeMenu();
      } catch (error) {
        // Log error but don't throw - let the UI remain stable
        console.error('Error creating shape from tool:', error);
        // Still close the menu even if shape creation failed
        menuManager.closeMenu();
      }
    },
    [addShape, addConnector, activeConnectorType, menuManager, toolToShapeMapper]
  );

  return { handleToolSelect };
}
