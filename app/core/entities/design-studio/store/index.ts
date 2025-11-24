/**
 * Design Studio Entity Stores
 *
 * This module exports the entity stores for the Design Studio.
 * The monolithic store has been split into focused stores for better maintainability:
 * - useDesignWorkStore: Manages design work folders and hierarchy
 * - useDiagramStore: Manages diagrams with shape/connector operations and undo/redo
 * - useInterfaceStore: Manages interface designs
 * - useDocumentStore: Manages design documents
 */

// Note: useDesignWorkStore is not exported here to avoid conflicts with dynamic imports
// used for circular dependency resolution. Import directly from './design-work/useDesignWorkStore' when needed.
export { useDiagramStore } from './diagram/useDiagramStore';
export { useInterfaceStore } from './interface/useInterfaceStore';
export { useDocumentStore } from './document/useDocumentStore';
