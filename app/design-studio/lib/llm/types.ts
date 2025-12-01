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
