/**
 * System prompts for LLM-based Mermaid diagram generation
 * Each diagram type has its own specialized prompt to ensure correct syntax
 */

// Re-export all prompts from individual files
export {
  BPMN_SYSTEM_PROMPT,
  BPMN_SUGGESTIONS_SYSTEM_PROMPT,
  BPMN_APPLY_SUGGESTION_SYSTEM_PROMPT,
} from './bpmn-prompts';

export {
  CLASS_SYSTEM_PROMPT,
  CLASS_SUGGESTIONS_SYSTEM_PROMPT,
  CLASS_APPLY_SUGGESTION_SYSTEM_PROMPT,
} from './class-prompts';

export {
  SEQUENCE_SYSTEM_PROMPT,
  SEQUENCE_SUGGESTIONS_SYSTEM_PROMPT,
  SEQUENCE_APPLY_SUGGESTION_SYSTEM_PROMPT,
} from './sequence-prompts';

export {
  ARCHITECTURE_SYSTEM_PROMPT,
  ARCHITECTURE_SUGGESTIONS_SYSTEM_PROMPT,
  ARCHITECTURE_APPLY_SUGGESTION_SYSTEM_PROMPT,
} from './architecture-prompts';

export {
  ENTITY_RELATIONSHIP_SYSTEM_PROMPT,
  ENTITY_RELATIONSHIP_SUGGESTIONS_SYSTEM_PROMPT,
  ENTITY_RELATIONSHIP_APPLY_SUGGESTION_SYSTEM_PROMPT,
} from './entity-relationship-prompts';

export {
  USER_STORIES_SYSTEM_PROMPT,
  USER_STORIES_STRUCTURED_SYSTEM_PROMPT,
  USER_STORIES_COMBINE_PROMPT,
  USER_STORIES_SPLIT_PROMPT,
  USER_STORIES_REGENERATE_PROMPT,
} from './user-stories-prompts';

export {
  USER_DOCUMENTATION_SYSTEM_PROMPT,
  USER_DOCUMENTATION_STRUCTURED_SYSTEM_PROMPT,
  USER_DOCUMENTATION_REGENERATE_PROMPT,
} from './user-documentation-prompts';

export {
  TECH_SPEC_STRUCTURED_SYSTEM_PROMPT,
  TECH_SPEC_REGENERATE_PROMPT,
} from './tech-spec-prompts';

// Import prompts for use in routing functions
import {
  BPMN_SYSTEM_PROMPT,
  BPMN_SUGGESTIONS_SYSTEM_PROMPT,
  BPMN_APPLY_SUGGESTION_SYSTEM_PROMPT,
} from './bpmn-prompts';

import {
  CLASS_SYSTEM_PROMPT,
  CLASS_SUGGESTIONS_SYSTEM_PROMPT,
  CLASS_APPLY_SUGGESTION_SYSTEM_PROMPT,
} from './class-prompts';

import {
  SEQUENCE_SYSTEM_PROMPT,
  SEQUENCE_SUGGESTIONS_SYSTEM_PROMPT,
  SEQUENCE_APPLY_SUGGESTION_SYSTEM_PROMPT,
} from './sequence-prompts';

import {
  ARCHITECTURE_SYSTEM_PROMPT,
  ARCHITECTURE_SUGGESTIONS_SYSTEM_PROMPT,
  ARCHITECTURE_APPLY_SUGGESTION_SYSTEM_PROMPT,
} from './architecture-prompts';

import {
  ENTITY_RELATIONSHIP_SYSTEM_PROMPT,
  ENTITY_RELATIONSHIP_SUGGESTIONS_SYSTEM_PROMPT,
  ENTITY_RELATIONSHIP_APPLY_SUGGESTION_SYSTEM_PROMPT,
} from './entity-relationship-prompts';

import {
  USER_STORIES_SYSTEM_PROMPT,
  USER_STORIES_STRUCTURED_SYSTEM_PROMPT,
  USER_STORIES_COMBINE_PROMPT,
  USER_STORIES_SPLIT_PROMPT,
  USER_STORIES_REGENERATE_PROMPT,
} from './user-stories-prompts';

import {
  USER_DOCUMENTATION_SYSTEM_PROMPT,
  USER_DOCUMENTATION_STRUCTURED_SYSTEM_PROMPT,
  USER_DOCUMENTATION_REGENERATE_PROMPT,
} from './user-documentation-prompts';

import {
  TECH_SPEC_STRUCTURED_SYSTEM_PROMPT,
  TECH_SPEC_REGENERATE_PROMPT,
} from './tech-spec-prompts';

/**
 * Get system prompt for a specific diagram type
 */
export function getSystemPrompt(diagramType: string): string {
  switch (diagramType) {
    case 'bpmn':
      return BPMN_SYSTEM_PROMPT;
    case 'class':
      return CLASS_SYSTEM_PROMPT;
    case 'sequence':
      return SEQUENCE_SYSTEM_PROMPT;
    case 'architecture':
      return ARCHITECTURE_SYSTEM_PROMPT;
    case 'entity-relationship':
      return ENTITY_RELATIONSHIP_SYSTEM_PROMPT;
    case 'user-stories':
      return USER_STORIES_SYSTEM_PROMPT;
    case 'user-stories-structured':
      return USER_STORIES_STRUCTURED_SYSTEM_PROMPT;
    case 'user-stories-combine':
      return USER_STORIES_COMBINE_PROMPT;
    case 'user-stories-split':
      return USER_STORIES_SPLIT_PROMPT;
    case 'user-stories-regenerate':
      return USER_STORIES_REGENERATE_PROMPT;
    case 'user-documentation':
      return USER_DOCUMENTATION_SYSTEM_PROMPT;
    case 'user-documentation-structured':
      return USER_DOCUMENTATION_STRUCTURED_SYSTEM_PROMPT;
    case 'user-documentation-regenerate':
      return USER_DOCUMENTATION_REGENERATE_PROMPT;
    case 'tech-spec-structured':
      return TECH_SPEC_STRUCTURED_SYSTEM_PROMPT;
    case 'tech-spec-regenerate':
      return TECH_SPEC_REGENERATE_PROMPT;
    default:
      // Default to BPMN if unknown type
      return BPMN_SYSTEM_PROMPT;
  }
}

/**
 * Get suggestions system prompt for a specific diagram type
 */
export function getSuggestionsSystemPrompt(diagramType: string): string {
  switch (diagramType) {
    case 'bpmn':
      return BPMN_SUGGESTIONS_SYSTEM_PROMPT;
    case 'class':
      return CLASS_SUGGESTIONS_SYSTEM_PROMPT;
    case 'sequence':
      return SEQUENCE_SUGGESTIONS_SYSTEM_PROMPT;
    case 'architecture':
      return ARCHITECTURE_SUGGESTIONS_SYSTEM_PROMPT;
    case 'entity-relationship':
      return ENTITY_RELATIONSHIP_SUGGESTIONS_SYSTEM_PROMPT;
    default:
      // Default to BPMN suggestions if unknown type
      return BPMN_SUGGESTIONS_SYSTEM_PROMPT;
  }
}

/**
 * Get apply suggestion system prompt for a specific diagram type
 * Used when applying a suggestion to a shape - takes shape mermaid and suggestion,
 * returns updated mermaid implementing the suggestion
 */
export function getApplySuggestionSystemPrompt(diagramType: string): string {
  switch (diagramType) {
    case 'bpmn':
      return BPMN_APPLY_SUGGESTION_SYSTEM_PROMPT;
    case 'class':
      return CLASS_APPLY_SUGGESTION_SYSTEM_PROMPT;
    case 'sequence':
      return SEQUENCE_APPLY_SUGGESTION_SYSTEM_PROMPT;
    case 'architecture':
      return ARCHITECTURE_APPLY_SUGGESTION_SYSTEM_PROMPT;
    case 'entity-relationship':
      return ENTITY_RELATIONSHIP_APPLY_SUGGESTION_SYSTEM_PROMPT;
    default:
      // Default to BPMN if unknown type
      return BPMN_APPLY_SUGGESTION_SYSTEM_PROMPT;
  }
}
