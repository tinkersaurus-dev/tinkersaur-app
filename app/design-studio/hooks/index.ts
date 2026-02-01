/**
 * Design Studio Custom Hooks
 *
 * MIGRATION IN PROGRESS:
 * - Diagram management hooks → @/features/diagram-management
 * - Shape rendering hooks → @/features/diagram-rendering
 * - Canvas interaction hooks will move to @/widgets/canvas in Phase 4
 */

// Re-export from features (temporary, for backwards compatibility)
export {
  useDesignWorks,
  useChildDesignWorks,
  useRootDesignWorks,
  useDesignWork,
  useDesignWorksForContext,
  useDiagram,
  useInterface,
  useDocument,
  useFolderContent,
  useDesignStudioCRUD,
  useDiagramCRUD,
  useAsyncGeneration,
  useGeneratorReferences,
  useGenerateDiagram,
  useFolderReferenceDrop,
  useRequirementReferenceDrop,
  useMermaidSync,
  useSuggestionsGenerator,
  type UseAsyncGenerationReturn,
  type UseGeneratorReferencesReturn,
  type UseGenerateDiagramReturn,
} from '@/features/diagram-management';

export { useShapeInteractivity } from '@/features/diagram-rendering';

// Canvas interaction hooks (will migrate in Phase 4)
// These are not exported - they're used internally by canvas components
