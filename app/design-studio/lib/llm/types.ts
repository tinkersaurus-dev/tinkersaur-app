/**
 * Types for LLM-generated user stories
 */

/**
 * User story with client-generated ID
 * Simplified structure with story as a single string and acceptance criteria as string array
 */
export interface UserStory {
  id: string;
  title: string;
  story: string; // Full user story text (e.g., "As a user, I want to... so that...")
  acceptanceCriteria: string[]; // Array of acceptance criteria strings
}

/**
 * Raw user story response from LLM (without ID)
 */
export interface UserStoryResponse {
  title: string;
  story: string;
  acceptanceCriteria: string[];
}

/**
 * Response structure from generate user stories API
 */
export interface GenerateUserStoriesAPIResponse {
  success: boolean;
  stories?: UserStoryResponse[];
  error?: string;
}

/**
 * Response structure from combine/split/regenerate APIs
 */
export interface UserStoryOperationResponse {
  success: boolean;
  story?: UserStoryResponse;       // For combine and regenerate
  stories?: UserStoryResponse[];   // For split
  error?: string;
}

/**
 * Convert a UserStory to markdown format
 */
export function userStoryToMarkdown(story: UserStory): string {
  let md = `### ${story.title}\n\n`;
  md += `${story.story}\n\n`;
  md += `#### Acceptance Criteria\n\n`;

  story.acceptanceCriteria.forEach((ac, index) => {
    md += `${index + 1}. ${ac}\n`;
  });

  return md;
}

/**
 * Convert multiple UserStories to markdown format
 */
export function userStoriesToMarkdown(stories: UserStory[]): string {
  return stories.map(userStoryToMarkdown).join('\n----\n\n');
}

// ============================================================================
// User Documentation Types
// ============================================================================

/**
 * A single step in a user documentation process
 */
export interface DocumentStep {
  title: string;
  description: string;
  screenshotHint?: string;
  callout?: {
    type: 'note' | 'warning' | 'tip';
    content: string;
  };
}

/**
 * A troubleshooting item in user documentation
 */
export interface TroubleshootingItem {
  issue: string;
  resolution: string;
}

/**
 * User document with client-generated ID
 * Each document represents a distinct user process/flow
 */
export interface UserDocument {
  id: string;
  title: string;
  overview: string;
  prerequisites: string[];
  steps: DocumentStep[];
  troubleshooting: TroubleshootingItem[];
  relatedTopics: string[];
}

/**
 * Raw user document response from LLM (without ID)
 */
export interface UserDocumentResponse {
  title: string;
  overview: string;
  prerequisites: string[];
  steps: DocumentStep[];
  troubleshooting: TroubleshootingItem[];
  relatedTopics: string[];
}

/**
 * Response structure from generate user docs API
 */
export interface GenerateUserDocsAPIResponse {
  success: boolean;
  documents?: UserDocumentResponse[];
  error?: string;
}

/**
 * Response structure from user docs regenerate API
 */
export interface UserDocOperationResponse {
  success: boolean;
  document?: UserDocumentResponse;
  error?: string;
}

/**
 * Convert a UserDocument to markdown format
 */
export function userDocumentToMarkdown(doc: UserDocument): string {
  let md = `# ${doc.title}\n\n`;
  md += `## Overview\n${doc.overview}\n\n`;

  if (doc.prerequisites.length > 0) {
    md += `## Prerequisites\n`;
    doc.prerequisites.forEach((p) => {
      md += `- ${p}\n`;
    });
    md += `\n`;
  }

  md += `## Steps\n\n`;
  doc.steps.forEach((step, index) => {
    md += `### Step ${index + 1}: ${step.title}\n`;
    md += `${step.description}\n\n`;
    if (step.screenshotHint) {
      md += `[Screenshot: ${step.screenshotHint}]\n\n`;
    }
    if (step.callout) {
      const calloutType =
        step.callout.type.charAt(0).toUpperCase() + step.callout.type.slice(1);
      md += `> **${calloutType}:** ${step.callout.content}\n\n`;
    }
  });

  if (doc.troubleshooting.length > 0) {
    md += `## Troubleshooting\n\n`;
    doc.troubleshooting.forEach((t) => {
      md += `### ${t.issue}\n${t.resolution}\n\n`;
    });
  }

  if (doc.relatedTopics.length > 0) {
    md += `## Related Topics\n`;
    doc.relatedTopics.forEach((r) => {
      md += `- ${r}\n`;
    });
  }

  return md;
}

/**
 * Convert multiple UserDocuments to markdown format
 */
export function userDocumentsToMarkdown(docs: UserDocument[]): string {
  return docs.map(userDocumentToMarkdown).join('\n---\n\n');
}

// ============================================================================
// Technical Specification Types
// ============================================================================

/**
 * Section types for technical specifications
 */
export type TechSpecSectionType =
  | 'system-overview'
  | 'data-models'
  | 'api-endpoints'
  | 'business-logic'
  | 'integration-points'
  | 'non-functional'
  | 'technical-constraints';

/**
 * A subsection within a technical specification section
 */
export interface TechSpecSubsection {
  title: string;
  content: string;
}

/**
 * Technical specification section with client-generated ID
 */
export interface TechSpecSection {
  id: string;
  sectionType: TechSpecSectionType;
  title: string;
  content: string;
  subsections?: TechSpecSubsection[];
}

/**
 * Raw technical specification section response from LLM (without ID)
 */
export interface TechSpecSectionResponse {
  sectionType: string;
  title: string;
  content: string;
  subsections?: TechSpecSubsection[];
}

/**
 * Response structure from generate tech spec API
 */
export interface GenerateTechSpecAPIResponse {
  success: boolean;
  sections?: TechSpecSectionResponse[];
  error?: string;
}

/**
 * Response structure from tech spec regenerate API
 */
export interface TechSpecOperationResponse {
  success: boolean;
  section?: TechSpecSectionResponse;
  error?: string;
}

/**
 * Human-readable labels for section types
 */
export const TECH_SPEC_SECTION_LABELS: Record<TechSpecSectionType, string> = {
  'system-overview': 'System Overview',
  'data-models': 'Data Models',
  'api-endpoints': 'API Endpoints',
  'business-logic': 'Business Logic',
  'integration-points': 'Integration Points',
  'non-functional': 'Non-Functional Requirements',
  'technical-constraints': 'Technical Constraints',
};

/**
 * Convert a TechSpecSection to markdown format
 */
export function techSpecSectionToMarkdown(section: TechSpecSection): string {
  let md = `# ${section.title}\n\n`;
  md += section.content;

  if (section.subsections && section.subsections.length > 0) {
    md += '\n\n';
    section.subsections.forEach((sub) => {
      md += `## ${sub.title}\n\n`;
      md += `${sub.content}\n\n`;
    });
  }

  return md;
}

/**
 * Convert multiple TechSpecSections to markdown format
 */
export function techSpecSectionsToMarkdown(sections: TechSpecSection[]): string {
  return sections.map(techSpecSectionToMarkdown).join('\n---\n\n');
}
