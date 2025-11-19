/**
 * Class Diagram Toolset Configuration
 * Defines all available class diagram tools
 */

import type { ComponentType } from 'react';
import { FaSquare } from 'react-icons/fa';
import { globalToolGroup } from './global-tools';

/**
 * Tool definition interface
 * Represents a single tool that can create shapes on the canvas
 */
export interface Tool {
  /** Unique identifier for the tool */
  id: string;
  /** Display name for the tool */
  name: string;
  /** Icon component from react-icons */
  icon: ComponentType<{ size?: number }>;
  /** Shape type (e.g., 'class') */
  shapeType: string;
  /** Shape subtype (optional) */
  shapeSubtype?: string;
  /** Default size for the shape */
  defaultSize: {
    width: number;
    height: number;
  };
  /** Initial shape data */
  initialData?: Record<string, unknown>;
  /** Position offset for shape creation (in pixels) */
  creationOffset?: {
    x?: number;
    y?: number;
  };
}

/**
 * Tool group definition
 * Organizes tools by type
 */
export interface ToolGroup {
  /** Group type identifier */
  type: string;
  /** Display label for the group */
  label: string;
  /** Tools in this group */
  tools: Tool[];
}

/**
 * Class Diagram Tools
 * UML class shapes with stereotype, attributes, and methods
 */
const classTools: Tool[] = [
  {
    id: 'class',
    name: 'Class',
    icon: FaSquare,
    shapeType: 'class',
    defaultSize: { width: 200, height: 150 },
    initialData: {
      stereotype: undefined,
      attributes: [],
      methods: [],
    },
  },
];

/**
 * Class Diagram Tool Groups
 * Organized collection of all class diagram tools by type
 */
export const classToolGroups: ToolGroup[] = [
  {
    type: 'class',
    label: 'Classes',
    tools: classTools,
  },
  globalToolGroup, // Global tools available in all diagram types
];

/**
 * Flat list of all class diagram tools
 * Useful for lookups and iteration
 */
export const allClassTools: Tool[] = [...classTools];

/**
 * Get tool by ID
 */
export function getToolById(id: string): Tool | undefined {
  return allClassTools.find((tool) => tool.id === id);
}
