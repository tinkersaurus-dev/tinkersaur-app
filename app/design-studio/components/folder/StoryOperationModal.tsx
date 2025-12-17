/**
 * Story Operation Modal Component
 *
 * Modal for LLM operations (Combine, Split, Regenerate) with optional instructions.
 * Also handles local Edit operation with markdown textarea.
 */

import type { UserStory } from '../../lib/llm/types';
import { OperationModal, type OperationModalConfig } from './OperationModal';

export type OperationType = 'combine' | 'split' | 'regenerate' | 'edit';

export interface StoryOperationModalProps {
  open: boolean;
  operationType: OperationType;
  selectedStories: UserStory[];
  onConfirm: (instructions?: string, editedStory?: UserStory) => void;
  onCancel: () => void;
  isLoading?: boolean;
  error?: string | null;
}

/**
 * Extract a display title from markdown content
 * Looks for "### User Story: Title" or first heading, or truncates content
 */
function extractDisplayTitle(content: string): string {
  // Try to find "### User Story: Title" pattern
  const storyTitleMatch = content.match(/###\s*User Story:\s*(.+)/i);
  if (storyTitleMatch) {
    return storyTitleMatch[1].trim();
  }

  // Try to find any heading
  const headingMatch = content.match(/^#+\s*(.+)/m);
  if (headingMatch) {
    return headingMatch[1].trim();
  }

  // Fallback: truncate first line
  const firstLine = content.split('\n')[0].trim();
  return firstLine.length > 50 ? firstLine.substring(0, 47) + '...' : firstLine;
}

const STORY_MODAL_CONFIG: OperationModalConfig<UserStory, OperationType> = {
  operations: {
    combine: {
      title: 'Combine Stories',
      description:
        'Combine the selected stories into a single, cohesive user story. The LLM will intelligently merge the content.',
    },
    split: {
      title: 'Split Story',
      description:
        'Split this story into multiple smaller, more focused user stories. The LLM will identify logical boundaries.',
    },
    regenerate: {
      title: 'Regenerate Story',
      description:
        'Regenerate this story based on the original design documentation. The LLM will improve clarity and completeness.',
    },
    edit: {
      title: 'Edit Story',
      description: 'Edit the story markdown content below.',
    },
  },
  modalWidth: 600,
  showInstructionsFor: ['combine', 'split', 'regenerate'],
  instructionPlaceholders: {
    combine:
      'Optional: Provide guidance on how to combine these stories (e.g., "Focus on the authentication flow" or "Keep the acceptance criteria minimal")',
    split:
      'Optional: Provide guidance on how to split this story (e.g., "Split by user actions" or "Create 3 stories")',
    regenerate:
      'Optional: Provide guidance on what to improve (e.g., "Make acceptance criteria more specific" or "Focus on error handling")',
  },
  renderSummary: (stories) => {
    const storyList = Array.isArray(stories) ? stories : [stories];
    return (
      <>
        <div className="text-xs font-medium text-[var(--text-muted)] mb-2">Selected Stories:</div>
        <ul className="text-sm text-[var(--text)] space-y-1">
          {storyList.map((story) => (
            <li key={story.id} className="flex items-start gap-2">
              <span className="text-[var(--primary)]">•</span>
              <span>{extractDisplayTitle(story.content)}</span>
            </li>
          ))}
        </ul>
      </>
    );
  },
  renderEditForm: (story, onChange) => <StoryEditForm story={story} onChange={onChange} />,
  getOkText: (operationType, isLoading) =>
    isLoading ? 'Processing...' : operationType === 'edit' ? 'Save' : 'Confirm',
  getTitle: (operationType, stories) => {
    const storyList = Array.isArray(stories) ? stories : [stories];
    const baseTitle = STORY_MODAL_CONFIG.operations[operationType].title;
    return storyList.length > 1 ? `${baseTitle} (${storyList.length} stories)` : baseTitle;
  },
};

// ============================================================================
// Edit Form
// ============================================================================

interface StoryEditFormProps {
  story: UserStory;
  onChange: (updated: UserStory) => void;
}

/**
 * Simple markdown textarea for editing user story content
 */
function StoryEditForm({ story, onChange }: StoryEditFormProps) {
  return (
    <div>
      <label className="block text-xs font-medium text-[var(--text)] mb-1">
        Story Content (Markdown)
      </label>
      <textarea
        value={story.content}
        onChange={(e) => onChange({ ...story, content: e.target.value })}
        rows={16}
        className="w-full p-3 border border-[var(--border)] rounded bg-[var(--bg-light)] text-[var(--text)] resize-none outline-none focus:border-[var(--primary)]"
        style={{
          fontFamily: 'monospace',
          fontSize: '12px',
          lineHeight: '1.5',
        }}
        placeholder={`### User Story: [Title]

**As a** [role]
**I want** [capability]
**So that** [benefit]

#### Acceptance Criteria

1. **When** [trigger], **the system shall** [response].
2. **If** [condition], **then the system shall** [behavior].`}
      />
    </div>
  );
}

// ============================================================================
// Main Export
// ============================================================================

export function StoryOperationModal({
  open,
  operationType,
  selectedStories,
  onConfirm,
  onCancel,
  isLoading,
  error,
}: StoryOperationModalProps) {
  return (
    <OperationModal<UserStory, OperationType>
      open={open}
      operationType={operationType}
      entity={selectedStories}
      onConfirm={onConfirm}
      onCancel={onCancel}
      isLoading={isLoading}
      error={error}
      config={STORY_MODAL_CONFIG}
    />
  );
}
