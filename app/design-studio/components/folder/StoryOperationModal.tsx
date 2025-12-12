/**
 * Story Operation Modal Component
 *
 * Modal for LLM operations (Combine, Split, Regenerate) with optional instructions.
 * Also handles local Edit operation.
 */

import { Input } from '~/core/components/ui';
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
      description: 'Manually edit the story fields below.',
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
              <span>{story.title}</span>
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

function StoryEditForm({ story, onChange }: StoryEditFormProps) {
  const updateField = (field: keyof UserStory, value: string) => {
    onChange({ ...story, [field]: value });
  };

  const updateAcceptanceCriterion = (index: number, value: string) => {
    const newCriteria = [...story.acceptanceCriteria];
    newCriteria[index] = value;
    onChange({ ...story, acceptanceCriteria: newCriteria });
  };

  const addAcceptanceCriterion = () => {
    onChange({
      ...story,
      acceptanceCriteria: [...story.acceptanceCriteria, ''],
    });
  };

  const removeAcceptanceCriterion = (index: number) => {
    onChange({
      ...story,
      acceptanceCriteria: story.acceptanceCriteria.filter((_, i) => i !== index),
    });
  };

  return (
    <>
      <div>
        <label className="block text-xs font-medium text-[var(--text)] mb-1">Title</label>
        <Input
          value={story.title}
          onChange={(e) => updateField('title', e.target.value)}
          size="small"
        />
      </div>

      <div>
        <label className="block text-xs font-medium text-[var(--text)] mb-1">User Story</label>
        <Input.TextArea
          value={story.story}
          onChange={(e) => updateField('story', e.target.value)}
          rows={3}
          size="small"
          placeholder="As a [role], I want [capability] so that [benefit]."
        />
      </div>

      <div>
        <div className="flex items-center justify-between mb-2">
          <label className="text-xs font-medium text-[var(--text)]">Acceptance Criteria</label>
          <button
            type="button"
            onClick={addAcceptanceCriterion}
            className="text-xs text-[var(--primary)] hover:underline"
          >
            + Add criterion
          </button>
        </div>

        <div className="flex flex-col gap-2 max-h-48 overflow-auto">
          {story.acceptanceCriteria.map((ac, index) => (
            <div key={index} className="flex gap-2 items-start">
              <span className="text-xs text-[var(--text-muted)] pt-2 min-w-[20px]">
                {index + 1}.
              </span>
              <Input.TextArea
                value={ac}
                onChange={(e) => updateAcceptanceCriterion(index, e.target.value)}
                rows={2}
                size="small"
                className="flex-1"
                placeholder="Describe a testable acceptance criterion..."
              />
              <button
                type="button"
                onClick={() => removeAcceptanceCriterion(index)}
                className="text-xs text-[var(--danger)] hover:underline pt-2"
              >
                Remove
              </button>
            </div>
          ))}
        </div>
      </div>
    </>
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
