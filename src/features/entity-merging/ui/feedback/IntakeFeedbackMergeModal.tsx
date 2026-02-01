/**
 * Intake Feedback Merge Modal
 * Merges a new intake feedback as a child of an existing database feedback.
 * Unlike persona/use-case merge, this does NOT use LLM - it simply creates
 * a parent-child relationship.
 *
 * Note: This modal does NOT execute the merge immediately. Instead, it
 * returns the merge configuration to the parent, which will execute it
 * when the intake results are saved (to ensure data integrity if abandoned).
 */

import { FiMessageSquare, FiArrowDown } from 'react-icons/fi';
import { Modal, Button, Card, Tag } from '@/shared/ui';
import { FEEDBACK_TYPE_CONFIG, type Feedback, type ExtractedFeedback } from '@/entities/feedback';
import { FEEDBACK_TAG_COLORS } from '~/discovery/constants';
import { useFeedbackQuery } from '~/discovery/queries';

export interface PendingFeedbackMerge {
  intakeFeedbackIndex: number;
  parentFeedbackId: string;
  intakeFeedback: ExtractedFeedback;
}

interface IntakeFeedbackMergeModalProps {
  open: boolean;
  onClose: () => void;
  intakeFeedback: ExtractedFeedback;
  intakeFeedbackIndex: number;
  existingFeedbackId: string;
  onMergeConfirmed: (pendingMerge: PendingFeedbackMerge) => void;
}

export function IntakeFeedbackMergeModal({
  open,
  onClose,
  intakeFeedback,
  intakeFeedbackIndex,
  existingFeedbackId,
  onMergeConfirmed,
}: IntakeFeedbackMergeModalProps) {
  // Fetch the existing feedback details
  const { data: existingFeedback, isLoading: existingLoading } = useFeedbackQuery(existingFeedbackId);

  const getTypeColor = (type: string) => {
    return FEEDBACK_TAG_COLORS[type as keyof typeof FEEDBACK_TAG_COLORS] || 'default';
  };

  const getTypeLabel = (type: string) => {
    const config = FEEDBACK_TYPE_CONFIG[type as keyof typeof FEEDBACK_TYPE_CONFIG];
    return config?.label || type;
  };

  const handleConfirmMerge = () => {
    // Return the merge configuration to the parent - don't execute yet
    onMergeConfirmed({
      intakeFeedbackIndex,
      parentFeedbackId: existingFeedbackId,
      intakeFeedback,
    });
    onClose();
  };

  const footer = (
    <div className="flex justify-end gap-3">
      <Button variant="default" onClick={onClose}>
        Cancel
      </Button>
      <Button
        variant="primary"
        onClick={handleConfirmMerge}
        disabled={existingLoading || !existingFeedback}
      >
        Confirm Merge
      </Button>
    </div>
  );

  return (
    <Modal
      open={open}
      onCancel={onClose}
      title="Merge with Existing Feedback"
      width={700}
      footer={footer}
    >
      <div className="space-y-4">
        <div className="text-sm text-[var(--text-muted)]">
          The new feedback from intake will become a child of the existing feedback.
          It will be hidden from the main list but visible when viewing the parent.
        </div>

        {/* Existing feedback (will be parent) */}
        <div>
          <div className="text-sm font-medium text-[var(--text)] mb-2 flex items-center gap-2">
            <span>Parent Feedback</span>
            <Tag color="green">Existing</Tag>
          </div>
          {existingLoading ? (
            <Card className="p-3">
              <div className="text-sm text-[var(--text-muted)]">Loading...</div>
            </Card>
          ) : existingFeedback ? (
            <Card className="p-3 border-2 border-green-500/50">
              <div className="flex items-start gap-3">
                <FiMessageSquare className="w-5 h-5 text-green-500 flex-shrink-0 mt-0.5" />
                <div className="min-w-0 flex-1">
                  <div className="flex items-center gap-2 mb-1">
                    <Tag color={getTypeColor(existingFeedback.type) as 'blue' | 'red' | 'orange' | 'green' | 'purple' | 'default'}>
                      {getTypeLabel(existingFeedback.type)}
                    </Tag>
                    {(existingFeedback as Feedback & { weight?: number }).weight && (existingFeedback as Feedback & { weight?: number }).weight! > 0 && (
                      <span className="text-xs text-[var(--text-muted)]">
                        +{(existingFeedback as Feedback & { weight?: number }).weight} children
                      </span>
                    )}
                  </div>
                  <div className="text-sm text-[var(--text)] line-clamp-2">
                    {existingFeedback.content}
                  </div>
                </div>
              </div>
            </Card>
          ) : (
            <Card className="p-3">
              <div className="text-sm text-[var(--danger)]">Feedback not found</div>
            </Card>
          )}
        </div>

        {/* Arrow indicator */}
        <div className="flex justify-center">
          <FiArrowDown className="w-5 h-5 text-[var(--text-muted)]" />
        </div>

        {/* New feedback from intake (will be child) */}
        <div>
          <div className="text-sm font-medium text-[var(--text)] mb-2 flex items-center gap-2">
            <span>Child Feedback</span>
            <Tag color="blue">From Intake</Tag>
          </div>
          <Card className="p-3">
            <div className="flex items-start gap-3">
              <FiMessageSquare className="w-4 h-4 text-[var(--text-muted)] flex-shrink-0 mt-0.5" />
              <div className="min-w-0 flex-1">
                <div className="flex items-center gap-2 mb-1">
                  <Tag color={getTypeColor(intakeFeedback.type) as 'blue' | 'red' | 'orange' | 'green' | 'purple' | 'default'}>
                    {getTypeLabel(intakeFeedback.type)}
                  </Tag>
                </div>
                <div className="text-sm text-[var(--text)] line-clamp-2">
                  {intakeFeedback.content}
                </div>
              </div>
            </div>
          </Card>
        </div>

        {/* Note about relationships */}
        <div className="p-3 bg-[var(--info)]/10 border border-[var(--info)] rounded">
          <p className="text-sm text-[var(--text)]">
            <strong>Note:</strong> The merge will be executed when you save the intake results.
            The new feedback will be linked to any personas and use cases from this intake,
            then set as a child of the existing feedback.
          </p>
        </div>
      </div>
    </Modal>
  );
}
