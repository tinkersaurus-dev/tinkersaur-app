import { create } from 'zustand';
import { createCommandFactory } from './commandFactoryProvider';
import { createShapeSlice } from './slices/shapeSlice';
import { createConnectorSlice } from './slices/connectorSlice';
import { createDiagramCrudSlice } from './slices/diagramCrudSlice';
import { createMermaidSlice } from './slices/mermaidSlice';
import type { DiagramStoreState } from './types';

/**
 * Diagram Store - Composed from focused slices for maintainability.
 *
 * Architecture:
 * - Uses Zustand slice composition to organize code by responsibility
 * - All slices share the same set/get, preserving single set() for batches
 * - CommandFactory is initialized with lazy getState() to avoid circular deps
 *
 * Slices:
 * - diagramCrudSlice: Diagram lifecycle (create, update, delete, hydration)
 * - shapeSlice: Shape operations (add, update, delete, batch operations)
 * - connectorSlice: Connector operations (add, update, delete, batch operations)
 * - mermaidSlice: Mermaid syntax sync utility
 *
 * Performance guarantees:
 * - Single set() calls for batch operations (slices share same set function)
 * - Canvas sync remains synchronous via utility functions
 * - Lazy CommandFactory deps via getState() pattern
 */
export const useDiagramStore = create<DiagramStoreState>()((...args) => {
  const [, get] = args;

  // Create command factory with lazy access to store methods
  // This pattern avoids circular dependencies by deferring method resolution
  const commandFactory = createCommandFactory(get);

  return {
    // Base state
    diagrams: {},
    errors: {},

    // Command factory instance
    commandFactory,

    // Compose all slices
    ...createDiagramCrudSlice(...args),
    ...createShapeSlice(...args),
    ...createConnectorSlice(...args),
    ...createMermaidSlice(...args),
  };
});

// Re-export types for consumers
export type { DiagramStoreState } from './types';
