import { createContext, useContext } from 'react';
import type { Shape } from '~/core/entities/design-studio/types/Shape';
import type { Connector } from '~/core/entities/design-studio/types/Connector';
import type { Diagram } from '~/core/entities/design-studio/types/Diagram';

/**
 * Canvas Diagram Context
 *
 * Provides diagram data and content for the Canvas component.
 * This context handles the diagram metadata and its shapes/connectors.
 */
export interface CanvasDiagramContext {
  // Diagram Metadata
  diagramId: string;
  diagram: Diagram | undefined;
  loading: boolean;

  // Diagram Content
  shapes: Shape[];
  connectors: Connector[];
}

/**
 * React Context for Canvas Diagram Data
 */
export const DiagramContext = createContext<CanvasDiagramContext | null>(null);

/**
 * Hook to consume Canvas Diagram context
 *
 * @throws Error if used outside of CanvasDiagramContext provider
 * @returns Canvas diagram context with diagram data and content
 */
export function useCanvasDiagram(): CanvasDiagramContext {
  const context = useContext(DiagramContext);
  if (!context) {
    throw new Error('useCanvasDiagram must be used within a CanvasDiagramContext provider');
  }
  return context;
}
