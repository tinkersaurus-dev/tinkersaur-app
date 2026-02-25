import { useCallback, useMemo } from 'react';
import { commandManager } from '@/shared/model/commands';
import type { CommandFactory } from '@/features/canvas-commands/model/CommandFactory';
import type { Shape } from '@/entities/shape';

// Import tool definitions from each diagram type
import { bpmnToolGroups, type Tool as BpmnTool } from '@/features/diagram-rendering/bpmn/tools';
import { sequenceToolGroups, type Tool as SequenceTool } from '@/features/diagram-rendering/sequence/tools';
import { architectureToolGroups, type Tool as ArchitectureTool } from '@/features/diagram-rendering/architecture/tools';

// Union type for all shape tools
export type ShapeTool = BpmnTool | SequenceTool | ArchitectureTool;

interface UseShapeSubtypeManagerProps {
  diagramId: string;
  diagramType: 'bpmn' | 'dataflow' | 'class' | 'sequence' | 'architecture' | 'entity-relationship' | undefined;
  commandFactory: CommandFactory;
}

interface UseShapeSubtypeManagerReturn {
  /**
   * Get available shape tools (subtypes) for a given shape type
   * Returns only tools that match the shape's type
   */
  getAvailableSubtypes: (shapeType: string) => ShapeTool[];

  /**
   * Handle shape subtype change from context menu
   * Changes the shape's subtype and updates any associated data
   */
  handleShapeSubtypeChange: (shapeTool: ShapeTool, shapeId: string) => Promise<void>;

  /**
   * Check if a shape type has multiple subtypes available
   * Used to determine if the context menu should be shown
   */
  hasMultipleSubtypes: (shapeType: string) => boolean;

  /**
   * Get the current shape tool for a shape (based on its type and subtype)
   */
  getShapeToolForShape: (shape: Shape) => ShapeTool | undefined;
}

/**
 * Hook to manage shape subtype changes through the context menu
 */
export function useShapeSubtypeManager({
  diagramId,
  diagramType,
  commandFactory,
}: UseShapeSubtypeManagerProps): UseShapeSubtypeManagerReturn {
  // Get all shape tools for the current diagram type
  const allShapeTools = useMemo((): ShapeTool[] => {
    const tools: ShapeTool[] = [];

    if (diagramType === 'bpmn') {
      for (const group of bpmnToolGroups) {
        // Skip global tools group (AI tools, etc.)
        if (group.type === 'global') continue;
        tools.push(...group.tools);
      }
    } else if (diagramType === 'sequence') {
      for (const group of sequenceToolGroups) {
        if (group.type === 'global') continue;
        tools.push(...group.tools);
      }
    } else if (diagramType === 'architecture') {
      for (const group of architectureToolGroups) {
        if (group.type === 'global') continue;
        tools.push(...group.tools);
      }
    }

    return tools;
  }, [diagramType]);

  // Get available subtypes for a specific shape type
  const getAvailableSubtypes = useCallback(
    (shapeType: string): ShapeTool[] => {
      return allShapeTools.filter((tool) => tool.shapeType === shapeType);
    },
    [allShapeTools]
  );

  // Check if a shape type has multiple subtypes
  const hasMultipleSubtypes = useCallback(
    (shapeType: string): boolean => {
      return getAvailableSubtypes(shapeType).length > 1;
    },
    [getAvailableSubtypes]
  );

  // Get the shape tool matching a shape's type and subtype
  const getShapeToolForShape = useCallback(
    (shape: Shape): ShapeTool | undefined => {
      return allShapeTools.find(
        (tool) =>
          tool.shapeType === shape.type &&
          tool.shapeSubtype === shape.subtype
      );
    },
    [allShapeTools]
  );

  // Handle shape subtype change from context menu
  const handleShapeSubtypeChange = useCallback(
    async (shapeTool: ShapeTool, shapeId: string) => {
      if (!shapeId || !shapeTool.shapeSubtype) return;

      // Build the subtype data
      const subtypeData: {
        id: string;
        subtype: string;
        data?: Record<string, unknown>;
      } = {
        id: shapeId,
        subtype: shapeTool.shapeSubtype,
      };

      // For architecture services, also update the icon in data for backwards compatibility
      if (shapeTool.shapeType === 'architecture-service' && 'initialData' in shapeTool) {
        const initialData = shapeTool.initialData as Record<string, unknown> | undefined;
        if (initialData?.icon) {
          subtypeData.data = { icon: initialData.icon };
        }
      }

      // Create and execute the command
      const command = commandFactory.createChangeShapeSubtype(
        diagramId,
        shapeId,
        subtypeData
      );

      await commandManager.execute(command, diagramId);
    },
    [diagramId, commandFactory]
  );

  return {
    getAvailableSubtypes,
    handleShapeSubtypeChange,
    hasMultipleSubtypes,
    getShapeToolForShape,
  };
}
