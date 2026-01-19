/**
 * LLM API Client exports
 * Centralized API wrappers for tinkersaur-ai service
 */

// Types
export * from './types';

// Diagram APIs
export {
  generateMermaid,
  MermaidGeneratorAPIError,
  type GenerateMermaidRequest,
  type GenerateMermaidResponse,
} from './mermaid-generator-api';

export {
  generateSuggestions,
  SuggestionsGeneratorAPIError,
  type Suggestion,
  type GenerateSuggestionsRequest,
  type GenerateSuggestionsResponse,
} from './suggestions-generator-api';

export {
  applySuggestion,
  ApplySuggestionAPIError,
  type ApplySuggestionRequest,
  type ApplySuggestionResponse,
} from './apply-suggestion-api';

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
} from './user-stories-generator-api';

// Tech Spec APIs
export {
  generateTechSpecStructured,
  regenerateTechSpecSection,
  TechSpecGeneratorAPIError,
} from './tech-spec-generator-api';

// User Docs APIs
export {
  generateUserDocs,
  generateUserDocsStructured,
  regenerateUserDocument,
  UserDocsGeneratorAPIError,
} from './user-docs-generator-api';

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
} from './overview-generator-api';

// Discovery APIs
export {
  parseTranscript,
  ParseTranscriptAPIError,
} from './parse-transcript-api';

export {
  mergePersonas,
  MergePersonasAPIError,
  type PersonaInput,
  type MergePersonasResponse,
} from './merge-personas-api';

export {
  mergeUseCases,
  MergeUseCasesAPIError,
  type UseCaseInput,
  type MergeUseCasesResponse,
} from './merge-use-cases-api';

// Requirement APIs
export {
  generateEarsRequirement,
  EarsGenerationAPIError,
  type GenerateEarsResponse,
  type EarsGenerationResult,
} from './ears-generator-api';
