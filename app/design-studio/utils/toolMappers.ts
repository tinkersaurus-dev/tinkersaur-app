/**
 * Tool Mapper Utilities
 * Functions that map diagram tools to CreateShapeDTO objects
 */

import type { CreateShapeDTO } from '../../core/entities/design-studio/types/Shape';
import type { Tool as BpmnTool } from '~/design-studio/diagrams/bpmn/tools';
import type { Tool as ClassTool } from '~/design-studio/diagrams/class/tools';
import type { Tool as SequenceTool } from '~/design-studio/diagrams/sequence/tools';
import type { Tool as ArchitectureTool } from '~/design-studio/diagrams/architecture/tools';
import type { Tool as EntityRelationshipTool } from '~/design-studio/diagrams/entity-relationship/tools';
import type { Tool as GlobalTool } from '../config/global-tools';

/**
 * Maps a BPMN tool to a CreateShapeDTO
 * Centers the shape at the canvas coordinates
 * Applies optional creationOffset for positioning adjustment
 *
 * @param tool - The BPMN tool to map
 * @param canvasX - X coordinate on the canvas
 * @param canvasY - Y coordinate on the canvas
 * @returns CreateShapeDTO for the shape to be created
 */
export function mapBpmnToolToShape(
  tool: BpmnTool,
  canvasX: number,
  canvasY: number
): CreateShapeDTO {
  const offsetX = tool.creationOffset?.x ?? 0;
  const offsetY = tool.creationOffset?.y ?? 0;

  return {
    type: tool.shapeType,
    subtype: tool.shapeSubtype,
    x: canvasX - tool.defaultSize.width / 2 + offsetX,
    y: canvasY - tool.defaultSize.height / 2 + offsetY,
    width: tool.defaultSize.width,
    height: tool.defaultSize.height,
    label: tool.name,
    zIndex: 0,
    locked: false,
    isPreview: false,
  };
}

/**
 * Maps a Class diagram tool to a CreateShapeDTO
 * Centers the shape at the canvas coordinates and includes initial data
 * Applies optional creationOffset for positioning adjustment
 *
 * @param tool - The Class tool to map
 * @param canvasX - X coordinate on the canvas
 * @param canvasY - Y coordinate on the canvas
 * @returns CreateShapeDTO for the shape to be created
 */
export function mapClassToolToShape(
  tool: ClassTool,
  canvasX: number,
  canvasY: number
): CreateShapeDTO {
  const offsetX = tool.creationOffset?.x ?? 0;
  const offsetY = tool.creationOffset?.y ?? 0;

  return {
    type: tool.shapeType,
    subtype: tool.shapeSubtype,
    x: canvasX - tool.defaultSize.width / 2 + offsetX,
    y: canvasY - tool.defaultSize.height / 2 + offsetY,
    width: tool.defaultSize.width,
    height: tool.defaultSize.height,
    label: tool.name,
    zIndex: 0,
    locked: false,
    isPreview: false,
    data: tool.initialData,
  };
}

/**
 * Maps a Sequence diagram tool to a CreateShapeDTO
 * Centers the shape at the canvas coordinates and includes initial data
 * Applies optional creationOffset for positioning adjustment
 *
 * @param tool - The Sequence tool to map
 * @param canvasX - X coordinate on the canvas
 * @param canvasY - Y coordinate on the canvas
 * @returns CreateShapeDTO for the shape to be created
 */
export function mapSequenceToolToShape(
  tool: SequenceTool,
  canvasX: number,
  canvasY: number
): CreateShapeDTO {
  const offsetX = tool.creationOffset?.x ?? 0;
  const offsetY = tool.creationOffset?.y ?? 0;

  return {
    type: tool.shapeType,
    subtype: tool.shapeSubtype,
    x: canvasX - tool.defaultSize.width / 2 + offsetX,
    y: canvasY - tool.defaultSize.height / 2 + offsetY,
    width: tool.defaultSize.width,
    height: tool.defaultSize.height,
    label: tool.name,
    zIndex: 0,
    locked: false,
    isPreview: false,
    data: tool.initialData,
  };
}

/**
 * Maps an Architecture diagram tool to a CreateShapeDTO
 * Centers the shape at the canvas coordinates and includes initial data
 * Applies optional creationOffset for positioning adjustment
 *
 * @param tool - The Architecture tool to map
 * @param canvasX - X coordinate on the canvas
 * @param canvasY - Y coordinate on the canvas
 * @returns CreateShapeDTO for the shape to be created
 */
export function mapArchitectureToolToShape(
  tool: ArchitectureTool,
  canvasX: number,
  canvasY: number
): CreateShapeDTO {
  const offsetX = tool.creationOffset?.x ?? 0;
  const offsetY = tool.creationOffset?.y ?? 0;

  return {
    type: tool.shapeType,
    subtype: tool.shapeSubtype,
    x: canvasX - tool.defaultSize.width / 2 + offsetX,
    y: canvasY - tool.defaultSize.height / 2 + offsetY,
    width: tool.defaultSize.width,
    height: tool.defaultSize.height,
    label: tool.name,
    zIndex: 0,
    locked: false,
    isPreview: false,
    data: tool.initialData,
  };
}

/**
 * Maps a Global tool to a CreateShapeDTO
 * Global tools are available in all diagram types (e.g., Generate Diagram)
 * Centers the shape at the canvas coordinates and includes initial data
 * Applies optional creationOffset for positioning adjustment
 *
 * @param tool - The Global tool to map
 * @param canvasX - X coordinate on the canvas
 * @param canvasY - Y coordinate on the canvas
 * @returns CreateShapeDTO for the shape to be created
 */
export function mapGlobalToolToShape(
  tool: GlobalTool,
  canvasX: number,
  canvasY: number
): CreateShapeDTO {
  const offsetX = tool.creationOffset?.x ?? 0;
  const offsetY = tool.creationOffset?.y ?? 0;

  // Special handling for LLM generator tool
  if (tool.shapeType === 'llm-generator') {
    return {
      type: tool.shapeType,
      subtype: tool.shapeSubtype,
      x: canvasX - tool.defaultSize.width / 2 + offsetX,
      y: canvasY - tool.defaultSize.height / 2 + offsetY,
      width: tool.defaultSize.width,
      height: tool.defaultSize.height,
      label: undefined, // No label for generator shape
      zIndex: 0,
      locked: false,
      isPreview: false,
      data: {
        prompt: '',
        error: undefined,
        isLoading: false,
      },
    };
  }

  // Default mapping for other global tools
  return {
    type: tool.shapeType,
    subtype: tool.shapeSubtype,
    x: canvasX - tool.defaultSize.width / 2 + offsetX,
    y: canvasY - tool.defaultSize.height / 2 + offsetY,
    width: tool.defaultSize.width,
    height: tool.defaultSize.height,
    label: tool.name,
    zIndex: 0,
    locked: false,
    isPreview: false,
  };
}

/**
 * Maps an Entity Relationship diagram tool to a CreateShapeDTO
 * Centers the shape at the canvas coordinates and includes initial data
 * Applies optional creationOffset for positioning adjustment
 *
 * @param tool - The Entity Relationship tool to map
 * @param canvasX - X coordinate on the canvas
 * @param canvasY - Y coordinate on the canvas
 * @returns CreateShapeDTO for the shape to be created
 */
export function mapEntityRelationshipToolToShape(
  tool: EntityRelationshipTool,
  canvasX: number,
  canvasY: number
): CreateShapeDTO {
  const offsetX = tool.creationOffset?.x ?? 0;
  const offsetY = tool.creationOffset?.y ?? 0;

  return {
    type: tool.shapeType,
    subtype: tool.shapeSubtype,
    x: canvasX - tool.defaultSize.width / 2 + offsetX,
    y: canvasY - tool.defaultSize.height / 2 + offsetY,
    width: tool.defaultSize.width,
    height: tool.defaultSize.height,
    label: tool.name,
    zIndex: 0,
    locked: false,
    isPreview: false,
    data: tool.initialData,
  };
}
