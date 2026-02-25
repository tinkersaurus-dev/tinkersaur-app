/**
 * Shared LLM API wrappers
 * Stateless HTTP clients for tinkersaur-ai endpoints used across features.
 */

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
