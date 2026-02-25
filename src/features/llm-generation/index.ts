/**
 * LLM API Client exports
 * Centralized API wrappers for tinkersaur-ai service
 */

// Types
export * from './model/types';

// Diagram APIs (canonical location: @/shared/api/llm)
export {
  generateMermaid,
  MermaidGeneratorAPIError,
  type GenerateMermaidRequest,
  type GenerateMermaidResponse,
  generateSuggestions,
  SuggestionsGeneratorAPIError,
  type Suggestion,
  type GenerateSuggestionsRequest,
  type GenerateSuggestionsResponse,
  applySuggestion,
  ApplySuggestionAPIError,
  type ApplySuggestionRequest,
  type ApplySuggestionResponse,
} from '@/shared/api/llm';

// User Stories APIs
export {
  generateUserStories,
  combineUserStories,
  splitUserStory,
  regenerateUserStory,
  UserStoriesGeneratorAPIError,
  type GenerateUserStoriesResponse,
  type CombineUserStoriesResponse,
  type SplitUserStoryResponse,
  type RegenerateUserStoryResponse,
} from './api/user-stories-generator-api';

// Tech Spec APIs
export {
  generateTechSpecStructured,
  regenerateTechSpecSection,
  TechSpecGeneratorAPIError,
} from './api/tech-spec-generator-api';

// User Docs APIs
export {
  generateUserDocs,
  generateUserDocsStructured,
  regenerateUserDocument,
  UserDocsGeneratorAPIError,
} from './api/user-docs-generator-api';

// Overview/Factor APIs
export {
  generateFactors,
  generateOverviewSection,
  FactorGeneratorAPIError,
  OverviewGeneratorAPIError,
  type SolutionContext,
  type PersonaContext,
  type UseCaseContext,
  type FeedbackContext,
  type OutcomeContext,
  type GeneratedFactorItem,
  type GenerateFactorsRequest,
  type GenerateFactorsResponse,
  type OverviewSectionType,
  type GenerateOverviewSectionRequest,
  type GenerateOverviewSectionResponse,
} from './api/overview-generator-api';

// Discovery APIs (re-exported from entities — canonical locations are @/entities/persona and @/entities/user-goal)
export {
  mergePersonas,
  MergePersonasAPIError,
  type PersonaInput,
  type MergePersonasResponse,
} from '@/entities/persona';

export {
  mergeUserGoals,
  MergeUserGoalsAPIError,
  type UserGoalInput,
  type MergeUserGoalsResponse,
} from '@/entities/user-goal';

// Requirement APIs
export {
  generateEarsRequirement,
  EarsGenerationAPIError,
  type GenerateEarsResponse,
  type EarsGenerationResult,
} from './api/ears-generator-api';

// Async generation utility
export { useAsyncGeneration, type UseAsyncGenerationReturn } from './lib/useAsyncGeneration';

// UI Components
export { RefinementPreview } from './ui/RefinementPreview';
export { FactorGenerateModal } from './ui/FactorGenerateModal';
export { useGenerateFactors } from './lib/useGenerateFactors';
export { useRefineFactor } from './lib/useRefineFactor';
