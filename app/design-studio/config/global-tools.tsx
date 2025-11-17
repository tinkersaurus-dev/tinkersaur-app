/**
 * Global Tools Configuration
 * Defines tools that are available across all diagram types
 */

import { FaWandMagicSparkles } from 'react-icons/fa6';
import type { Tool, ToolGroup } from './bpmn-tools';

// Re-export Tool type for use in toolMappers
export type { Tool };

/**
 * LLM-powered diagram generation tool
 * Creates a special shape that accepts prompts and generates diagrams
 */
const generateDiagramTool: Tool = {
  id: 'generate-diagram',
  name: 'Generate Diagram',
  icon: FaWandMagicSparkles,
  shapeType: 'llm-generator',
  shapeSubtype: '',
  defaultSize: { width: 280, height: 280 },
};

/**
 * Global tools array
 * Tools that should be available in all diagram type toolsets
 */
const globalTools: Tool[] = [generateDiagramTool];

/**
 * Global tool group for use in popover toolsets
 * This group should be added to the end of all diagram type tool groups
 */
export const globalToolGroup: ToolGroup = {
  type: 'global',
  label: 'AI Tools',
  tools: globalTools,
};

/**
 * Flat list of all global tools
 */
export const allGlobalTools: Tool[] = globalTools;

/**
 * Get global tool by ID
 */
export function getGlobalToolById(id: string): Tool | undefined {
  return allGlobalTools.find((tool) => tool.id === id);
}
