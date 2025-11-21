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

export { useDesignWorkStore } from './design-work/useDesignWorkStore';
export { useDiagramStore } from './diagram/useDiagramStore';
export { useInterfaceStore } from './interface/useInterfaceStore';
export { useDocumentStore } from './document/useDocumentStore';
