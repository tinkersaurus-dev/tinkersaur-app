/**
 * Base Tool Types
 * Common interfaces for diagram tools across all diagram types
 */

import type { ComponentType } from 'react';

/**
 * Base tool interface that all diagram tools must implement
 * This enables polymorphic tool handling across different diagram types
 */
export interface BaseTool {
  /** Unique identifier for the tool */
  id: string;
  /** Display name for the tool */
  name: string;
  /** Icon component from react-icons */
  icon: ComponentType<{ size?: number }>;
  /** Shape type (e.g., 'bpmn-task', 'class') */
  shapeType: string;
  /** Shape subtype (e.g., 'user', 'service') - optional for some diagram types */
  shapeSubtype?: string;
  /** Default size for the shape */
  defaultSize: {
    width: number;
    height: number;
  };
  /** Initial shape data - optional, used by some diagram types like class diagrams */
  initialData?: Record<string, unknown>;
}
