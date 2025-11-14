/**
 * Tool Mapper Utilities
 * Functions that map diagram tools to CreateShapeDTO objects
 */

import type { CreateShapeDTO } from '../../core/entities/design-studio/types/Shape';
import type { Tool as BpmnTool } from '../config/bpmn-tools';
import type { Tool as ClassTool } from '../config/class-tools';
import type { Tool as SequenceTool } from '../config/sequence-tools';

/**
 * Maps a BPMN tool to a CreateShapeDTO
 * Centers the shape at the canvas coordinates
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
  return {
    type: tool.shapeType,
    subtype: tool.shapeSubtype,
    x: canvasX - tool.defaultSize.width / 2,
    y: canvasY - tool.defaultSize.height / 2,
    width: tool.defaultSize.width,
    height: tool.defaultSize.height,
    label: tool.name,
    zIndex: 0,
    locked: false,
  };
}

/**
 * Maps a Class diagram tool to a CreateShapeDTO
 * Centers the shape at the canvas coordinates and includes initial data
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
  return {
    type: tool.shapeType,
    subtype: tool.shapeSubtype,
    x: canvasX - tool.defaultSize.width / 2,
    y: canvasY - tool.defaultSize.height / 2,
    width: tool.defaultSize.width,
    height: tool.defaultSize.height,
    label: tool.name,
    zIndex: 0,
    locked: false,
    data: tool.initialData,
  };
}

/**
 * Maps a Sequence diagram tool to a CreateShapeDTO
 * Centers the shape at the canvas coordinates and includes initial data
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
  return {
    type: tool.shapeType,
    subtype: tool.shapeSubtype,
    x: canvasX - tool.defaultSize.width / 2,
    y: canvasY - tool.defaultSize.height / 2,
    width: tool.defaultSize.width,
    height: tool.defaultSize.height,
    label: tool.name,
    zIndex: 0,
    locked: false,
    data: tool.initialData,
  };
}
