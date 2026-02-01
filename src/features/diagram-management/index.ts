/**
 * Diagram Management Feature
 *
 * This feature provides CRUD operations, queries, and generation workflows
 * for all design studio entities (diagrams, design works, interfaces, documents).
 */

// CRUD operations
export { useDesignStudioCRUD } from './api/useDesignStudioCRUD';
export { useDiagramCRUD } from './api/useDiagramCRUD';

// Query hooks
export { useDesignWorks, useChildDesignWorks, useRootDesignWorks, useDesignWork } from './model/useDesignWorks';
export { useDesignWorksForContext } from './model/useDesignWorksForContext';
export { useDiagram } from './model/useDiagrams';
export { useInterface } from './model/useInterfaces';
export { useDocument } from './model/useDocuments';
export { useFolderContent } from './model/useFolderContent';

// Generation workflows
export { useAsyncGeneration, type UseAsyncGenerationReturn } from './lib/useAsyncGeneration';
export { useGenerateDiagram, type UseGenerateDiagramReturn } from './lib/useGenerateDiagram';
export { useGeneratorReferences, type UseGeneratorReferencesReturn } from './lib/useGeneratorReferences';
export { useSuggestionsGenerator } from './lib/useSuggestionsGenerator';

// Drag-drop operations
export { useFolderReferenceDrop } from './lib/useFolderReferenceDrop';
export { useRequirementReferenceDrop } from './lib/useRequirementReferenceDrop';
export { useCanvasReferenceDrop } from './lib/useCanvasReferenceDrop';

// Diagram sync
export { useMermaidSync } from './lib/useMermaidSync';

// UI components
export { CreateDiagramModal, LinkUseCaseModal } from './ui';
export type { CreateDiagramFormData, CreateDiagramModalProps, LinkUseCaseFormData, LinkUseCaseModalProps } from './ui';
