/**
 * Story Operation Modal Component
 *
 * Modal for LLM operations (Combine, Split, Regenerate) with optional instructions.
 * Also handles local Edit operation.
 */

import { useState } from 'react';
import { Modal, Input } from '~/core/components/ui';
import type { UserStory } from '../../lib/llm/types';

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

const operationTitles: Record<OperationType, string> = {
  combine: 'Combine Stories',
  split: 'Split Story',
  regenerate: 'Regenerate Story',
  edit: 'Edit Story',
};

const operationDescriptions: Record<OperationType, string> = {
  combine:
    'Combine the selected stories into a single, cohesive user story. The LLM will intelligently merge the content.',
  split:
    'Split this story into multiple smaller, more focused user stories. The LLM will identify logical boundaries.',
  regenerate:
    'Regenerate this story based on the original design documentation. The LLM will improve clarity and completeness.',
  edit: 'Manually edit the story fields below.',
};

const instructionPlaceholders: Record<OperationType, string> = {
  combine:
    'Optional: Provide guidance on how to combine these stories (e.g., "Focus on the authentication flow" or "Keep the acceptance criteria minimal")',
  split:
    'Optional: Provide guidance on how to split this story (e.g., "Split by user actions" or "Create 3 stories")',
  regenerate:
    'Optional: Provide guidance on what to improve (e.g., "Make acceptance criteria more specific" or "Focus on error handling")',
  edit: '',
};

interface ModalContentProps {
  operationType: OperationType;
  selectedStories: UserStory[];
  isLoading: boolean;
  error: string | null;
  instructions: string;
  setInstructions: (value: string) => void;
  editedStory: UserStory | null;
  setEditedStory: (story: UserStory | null) => void;
}

function ModalContent({
  operationType,
  selectedStories,
  isLoading,
  error,
  instructions,
  setInstructions,
  editedStory,
  setEditedStory,
}: ModalContentProps) {
  const updateEditedStory = (field: keyof UserStory, value: string) => {
    if (!editedStory) return;
    setEditedStory({ ...editedStory, [field]: value });
  };

  const updateAcceptanceCriterion = (index: number, value: string) => {
    if (!editedStory) return;
    const newCriteria = [...editedStory.acceptanceCriteria];
    newCriteria[index] = value;
    setEditedStory({ ...editedStory, acceptanceCriteria: newCriteria });
  };

  const addAcceptanceCriterion = () => {
    if (!editedStory) return;
    setEditedStory({
      ...editedStory,
      acceptanceCriteria: [...editedStory.acceptanceCriteria, ''],
    });
  };

  const removeAcceptanceCriterion = (index: number) => {
    if (!editedStory) return;
    const newCriteria = editedStory.acceptanceCriteria.filter(
      (_, i) => i !== index
    );
    setEditedStory({ ...editedStory, acceptanceCriteria: newCriteria });
  };

  const isLLMOperation =
    operationType === 'combine' ||
    operationType === 'split' ||
    operationType === 'regenerate';

  return (
    <div className="flex flex-col gap-4">
      {/* Description */}
      <p className="text-sm text-[var(--text-muted)]">
        {operationDescriptions[operationType]}
      </p>

      {/* Selected stories summary (for non-edit operations) */}
      {operationType !== 'edit' && (
        <div className="bg-[var(--bg)] rounded-sm p-3 border border-[var(--border-muted)]">
          <div className="text-xs font-medium text-[var(--text-muted)] mb-2">
            Selected Stories:
          </div>
          <ul className="text-sm text-[var(--text)] space-y-1">
            {selectedStories.map((story) => (
              <li key={story.id} className="flex items-start gap-2">
                <span className="text-[var(--primary)]">•</span>
                <span>{story.title}</span>
              </li>
            ))}
          </ul>
        </div>
      )}

      {/* Instructions input (for LLM operations) */}
      {isLLMOperation && (
        <div>
          <label className="block text-sm font-medium text-[var(--text)] mb-1">
            Instructions (optional)
          </label>
          <Input.TextArea
            value={instructions}
            onChange={(e) => setInstructions(e.target.value)}
            placeholder={instructionPlaceholders[operationType]}
            rows={3}
            disabled={isLoading}
          />
        </div>
      )}

      {/* Edit form */}
      {operationType === 'edit' && editedStory && (
        <div className="flex flex-col gap-3">
          <div>
            <label className="block text-xs font-medium text-[var(--text)] mb-1">
              Title
            </label>
            <Input
              value={editedStory.title}
              onChange={(e) => updateEditedStory('title', e.target.value)}
              size="small"
            />
          </div>

          <div>
            <label className="block text-xs font-medium text-[var(--text)] mb-1">
              User Story
            </label>
            <Input.TextArea
              value={editedStory.story}
              onChange={(e) => updateEditedStory('story', e.target.value)}
              rows={3}
              size="small"
              placeholder="As a [role], I want [capability] so that [benefit]."
            />
          </div>

          <div>
            <div className="flex items-center justify-between mb-2">
              <label className="text-xs font-medium text-[var(--text)]">
                Acceptance Criteria
              </label>
              <button
                type="button"
                onClick={addAcceptanceCriterion}
                className="text-xs text-[var(--primary)] hover:underline"
              >
                + Add criterion
              </button>
            </div>

            <div className="flex flex-col gap-2 max-h-48 overflow-auto">
              {editedStory.acceptanceCriteria.map((ac, index) => (
                <div
                  key={index}
                  className="flex gap-2 items-start"
                >
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
        </div>
      )}

      {/* Error message */}
      {error && (
        <div className="text-sm text-[var(--danger)] bg-[color-mix(in_srgb,var(--danger)_10%,var(--bg))] p-3 rounded-sm">
          {error}
        </div>
      )}
    </div>
  );
}

function StoryOperationModalInner({
  operationType,
  selectedStories,
  onConfirm,
  onCancel,
  isLoading = false,
  error = null,
}: Omit<StoryOperationModalProps, 'open'>) {
  const [instructions, setInstructions] = useState('');
  const [editedStory, setEditedStory] = useState<UserStory | null>(() =>
    operationType === 'edit' && selectedStories.length === 1
      ? JSON.parse(JSON.stringify(selectedStories[0]))
      : null
  );

  const handleConfirm = () => {
    if (operationType === 'edit' && editedStory) {
      onConfirm(undefined, editedStory);
    } else {
      onConfirm(instructions || undefined);
    }
  };

  return (
    <Modal
      open={true}
      onCancel={onCancel}
      onOk={handleConfirm}
      title={`${operationTitles[operationType]}${
        selectedStories.length > 1 ? ` (${selectedStories.length} stories)` : ''
      }`}
      okText={isLoading ? 'Processing...' : operationType === 'edit' ? 'Save' : 'Confirm'}
      okButtonProps={{ disabled: isLoading || (operationType === 'edit' && !editedStory), loading: isLoading }}
      cancelButtonProps={{ disabled: isLoading }}
      width={600}
    >
      <ModalContent
        operationType={operationType}
        selectedStories={selectedStories}
        isLoading={isLoading}
        error={error}
        instructions={instructions}
        setInstructions={setInstructions}
        editedStory={editedStory}
        setEditedStory={setEditedStory}
      />
    </Modal>
  );
}

export function StoryOperationModal({
  open,
  ...props
}: StoryOperationModalProps) {
  // Render inner component only when open, so it remounts and resets state each time
  if (!open) return null;
  return <StoryOperationModalInner {...props} />;
}
