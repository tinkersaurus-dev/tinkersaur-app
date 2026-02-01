/**
 * Entity Relationship Diagram Toolset Configuration
 * Defines all available ER diagram tools
 */

import type { ComponentType } from 'react';
import { FaTable } from 'react-icons/fa';
import { globalToolGroup } from '@/features/diagram-rendering/config/tools';
import { CANVAS_CONFIG } from '@/shared/lib/config/canvas-config';

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
  /** Shape type (e.g., 'entity') */
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

const entitySize = CANVAS_CONFIG.shapes.entityRelationship.entity;

/**
 * Entity Relationship Diagram Tools
 * Entity shapes with typed attributes, keys, and comments
 */
const entityTools: Tool[] = [
  {
    id: 'entity',
    name: 'Entity',
    icon: FaTable,
    shapeType: 'entity',
    defaultSize: { width: entitySize.width, height: entitySize.height },
    initialData: {
      attributes: [],
    },
  },
];

/**
 * Entity Relationship Diagram Tool Groups
 * Organized collection of all ER diagram tools by type
 */
export const entityRelationshipToolGroups: ToolGroup[] = [
  {
    type: 'entity',
    label: 'Entities',
    tools: entityTools,
  },
  globalToolGroup, // Global tools available in all diagram types
];

/**
 * Flat list of all ER diagram tools
 * Useful for lookups and iteration
 */
export const allEntityRelationshipTools: Tool[] = [...entityTools];

/**
 * Get tool by ID
 */
export function getEntityRelationshipToolById(id: string): Tool | undefined {
  return allEntityRelationshipTools.find((tool) => tool.id === id);
}
