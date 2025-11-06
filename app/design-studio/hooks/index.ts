/**
 * Design Studio Custom Hooks
 *
 * This module exports all custom hooks for the Design Studio.
 * Use these hooks in components instead of accessing stores directly.
 */

// DesignWork hooks
export { useDesignWorks, useChildDesignWorks, useRootDesignWorks, useDesignWork } from './useDesignWorks';

// Diagram hooks
export { useDiagrams, useDiagramsByDesignWork, useDiagram } from './useDiagrams';

// Interface hooks
export { useInterfaces, useInterfacesByDesignWork, useInterface } from './useInterfaces';

// Document hooks
export { useDocuments, useDocumentsByDesignWork, useDocument } from './useDocuments';

// CRUD operations hook
export { useDesignStudioCRUD } from './useDesignStudioCRUD';
