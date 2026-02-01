/**
 * Sequence Diagram Toolset Configuration
 * Defines all available sequence diagram tools organized by type
 */

import type { ComponentType } from 'react';
import {
  FaUser,
  FaSquare,
  FaDatabase,
  FaServer,
  FaBorderAll,
  FaStickyNote,
} from 'react-icons/fa';
import { DEFAULT_LIFELINE_HEIGHT } from './constants';
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
  /** Shape type (e.g., 'sequence-lifeline', 'sequence-note') */
  shapeType: string;
  /** Shape subtype (e.g., 'actor', 'object', 'database') */
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
 * Organizes tools by type (e.g., Participants, Annotations)
 */
export interface ToolGroup {
  /** Group type identifier */
  type: string;
  /** Display label for the group */
  label: string;
  /** Tools in this group */
  tools: Tool[];
}

const { lifeline: lifelineSize, note: noteSize } = CANVAS_CONFIG.shapes.sequence;

/**
 * Sequence Diagram Participant Tools
 * Different types of participants/lifelines in a sequence diagram
 */
const participantTools: Tool[] = [
  {
    id: 'actor',
    name: 'Actor',
    icon: FaUser,
    shapeType: 'sequence-lifeline',
    shapeSubtype: 'actor',
    defaultSize: { width: lifelineSize.width, height: DEFAULT_LIFELINE_HEIGHT },
    initialData: {
      lifelineStyle: 'dashed',
      activations: [],
    },
    creationOffset: { y: 180 },
  },
  {
    id: 'object',
    name: 'Object',
    icon: FaSquare,
    shapeType: 'sequence-lifeline',
    shapeSubtype: 'object',
    defaultSize: { width: lifelineSize.width, height: DEFAULT_LIFELINE_HEIGHT },
    initialData: {
      lifelineStyle: 'dashed',
      activations: [],
    },
    creationOffset: { y: 180 },
  },
  {
    id: 'boundary',
    name: 'Boundary',
    icon: FaBorderAll,
    shapeType: 'sequence-lifeline',
    shapeSubtype: 'boundary',
    defaultSize: { width: lifelineSize.width, height: DEFAULT_LIFELINE_HEIGHT },
    initialData: {
      lifelineStyle: 'dashed',
      activations: [],
    },
    creationOffset: { y: 180 },
  },
  {
    id: 'control',
    name: 'Control',
    icon: FaServer,
    shapeType: 'sequence-lifeline',
    shapeSubtype: 'control',
    defaultSize: { width: lifelineSize.width, height: DEFAULT_LIFELINE_HEIGHT },
    initialData: {
      lifelineStyle: 'dashed',
      activations: [],
    },
    creationOffset: { y: 180 },
  },
  {
    id: 'entity',
    name: 'Entity',
    icon: FaDatabase,
    shapeType: 'sequence-lifeline',
    shapeSubtype: 'entity',
    defaultSize: { width: lifelineSize.width, height: DEFAULT_LIFELINE_HEIGHT },
    initialData: {
      lifelineStyle: 'dashed',
      activations: [],
    },
    creationOffset: { y: 180 },
  },
  {
    id: 'database',
    name: 'Database',
    icon: FaDatabase,
    shapeType: 'sequence-lifeline',
    shapeSubtype: 'database',
    defaultSize: { width: lifelineSize.width, height: DEFAULT_LIFELINE_HEIGHT },
    initialData: {
      lifelineStyle: 'dashed',
      activations: [],
    },
    creationOffset: { y: 180 },
  },
];

/**
 * Sequence Diagram Annotation Tools
 * Notes and comments for documentation
 */
const annotationTools: Tool[] = [
  {
    id: 'note',
    name: 'Note',
    icon: FaStickyNote,
    shapeType: 'sequence-note',
    defaultSize: { width: noteSize.width, height: noteSize.height },
    initialData: {
      noteStyle: 'default',
    },
  },
];

/**
 * Sequence Diagram Tool Groups
 * Organized collection of all sequence diagram tools by type
 */
export const sequenceToolGroups: ToolGroup[] = [
  {
    type: 'participant',
    label: 'Participants',
    tools: participantTools,
  },
  {
    type: 'annotation',
    label: 'Annotations',
    tools: annotationTools,
  },
  globalToolGroup, // Global tools available in all diagram types
];

/**
 * Flat list of all sequence diagram tools
 * Useful for lookups and iteration
 */
export const allSequenceTools: Tool[] = [
  ...participantTools,
  ...annotationTools,
];

/**
 * Get tool by ID
 */
export function getToolById(id: string): Tool | undefined {
  return allSequenceTools.find((tool) => tool.id === id);
}
