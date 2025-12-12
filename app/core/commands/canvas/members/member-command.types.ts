import type { Shape, ClassShapeData, EnumerationShapeData } from '~/core/entities/design-studio/types/Shape';
import { getClassShapeData, getEnumerationShapeData } from '~/core/entities/design-studio/types/Shape';
import type { Diagram } from '~/core/entities/design-studio/types';

/**
 * Supported shape types for member commands
 */
export type MemberShapeType = 'class' | 'enumeration';

/**
 * Configuration for member array commands
 * Encapsulates all the type-specific information needed to operate on a member array
 *
 * @template TData - The shape data type (e.g., ClassShapeData, EnumerationShapeData)
 * @template K - The key of the array property in TData
 */
export interface MemberCommandConfig<TData, K extends keyof TData = keyof TData> {
  /** The shape type this command operates on */
  shapeType: MemberShapeType;

  /** The property name on the shape data that holds the array (e.g., 'attributes', 'methods', 'literals') */
  arrayProperty: K;

  /** Human-readable name for descriptions (e.g., 'class attribute', 'class method', 'enumeration literal') */
  memberTypeName: string;

  /** Function to calculate the new height after modification, or undefined if height doesn't change */
  calculateHeight?: (data: TData) => number;
}

/**
 * Type-safe helper to get shape data based on shapeType
 */
export function getShapeDataByType<TData extends ClassShapeData | EnumerationShapeData>(
  shape: Shape,
  shapeType: MemberShapeType
): TData {
  if (shapeType === 'class') {
    return getClassShapeData(shape) as TData;
  } else {
    return getEnumerationShapeData(shape) as TData;
  }
}

/**
 * Common dependencies required by all member commands
 */
export interface MemberCommandDependencies {
  diagramId: string;
  shapeId: string;
  updateShapeFn: (
    diagramId: string,
    shapeId: string,
    updates: Partial<Shape>
  ) => Promise<Diagram | null>;
  getShapeFn: (shapeId: string) => Shape | undefined;
  updateLocalShapeFn?: (shapeId: string, updates: Partial<Shape>) => void;
}
