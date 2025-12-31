/**
 * Design Studio Custom Hooks
 *
 * This module exports all custom hooks for the Design Studio.
 * Use these hooks in components instead of accessing stores directly.
 */

// DesignWork hooks
export { useDesignWorks, useChildDesignWorks, useRootDesignWorks, useDesignWork } from './useDesignWorks';

// Diagram hooks - now lazy loaded
export { useDiagram } from './useDiagrams';

// Interface hooks - now lazy loaded
export { useInterface } from './useInterfaces';

// Document hooks - now lazy loaded
export { useDocument } from './useDocuments';

// Folder content hooks
export { useFolderContent } from './useFolderContent';

// CRUD operations hook
export { useDesignStudioCRUD } from './useDesignStudioCRUD';

// Async generation hook
export { useAsyncGeneration, type UseAsyncGenerationReturn } from './useAsyncGeneration';

// Generator diagram hooks
export { useGeneratorReferences, type UseGeneratorReferencesReturn } from './useGeneratorReferences';
export { useGenerateDiagram, type UseGenerateDiagramReturn } from './useGenerateDiagram';

// Shape rendering hooks
export { useShapeInteractivity } from './useShapeInteractivity';
