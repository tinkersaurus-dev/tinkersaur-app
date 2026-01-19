/**
 * Feedback Merge Modal
 * Simple modal for merging feedback items into parent-child relationship.
 * Unlike persona/use-case merge, this does NOT use LLM - it's a simple
 * parent-child assignment where the oldest feedback becomes the parent.
 */

import { FiMessageSquare, FiArrowDown } from 'react-icons/fi';
import { Modal, Button, Card, Tag } from '~/core/components/ui';
import type { Feedback } from '~/core/entities/discovery';
import { FEEDBACK_TYPE_CONFIG } from '~/core/entities/discovery/types/Feedback';
import { useMergeFeedbacks } from '../mutations';

interface FeedbackMergeModalProps {
  open: boolean;
  onClose: () => void;
  selectedFeedbacks: Feedback[];
  teamId: string;
}

export function FeedbackMergeModal({
  open,
  onClose,
  selectedFeedbacks,
  teamId,
}: FeedbackMergeModalProps) {
  const mergeMutation = useMergeFeedbacks();

  // Sort by createdAt ascending - oldest becomes the parent
  const sortedFeedbacks = [...selectedFeedbacks].sort(
    (a, b) => new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime()
  );
  const parent = sortedFeedbacks[0];
  const children = sortedFeedbacks.slice(1);

  const getTypeColor = (type: string) => {
    const config = FEEDBACK_TYPE_CONFIG[type as keyof typeof FEEDBACK_TYPE_CONFIG];
    return config?.color || 'default';
  };

  const getTypeLabel = (type: string) => {
    const config = FEEDBACK_TYPE_CONFIG[type as keyof typeof FEEDBACK_TYPE_CONFIG];
    return config?.label || type;
  };

  const handleConfirmMerge = async () => {
    if (!parent || children.length === 0) return;

    try {
      await mergeMutation.mutateAsync({
        teamId,
        parentFeedbackId: parent.id,
        childFeedbackIds: children.map((c) => c.id),
      });
      onClose();
    } catch {
      // Error handled by mutation hook
    }
  };

  const footer = (
    <div className="flex justify-end gap-3">
      <Button variant="default" onClick={onClose}>
        Cancel
      </Button>
      <Button
        variant="primary"
        onClick={handleConfirmMerge}
        disabled={mergeMutation.isPending || selectedFeedbacks.length < 2}
      >
        {mergeMutation.isPending ? 'Merging...' : 'Confirm Merge'}
      </Button>
    </div>
  );

  return (
    <Modal
      open={open}
      onCancel={onClose}
      title={`Merge ${selectedFeedbacks.length} Feedback Items`}
      width={700}
      footer={footer}
    >
      <div className="space-y-4">
        {/* Explanation */}
        <div className="text-sm text-[var(--text-muted)]">
          The oldest feedback will become the parent. All other selected
          feedback items will be linked as children and hidden from the main list.
        </div>

        {/* Parent indicator */}
        <div>
          <div className="text-sm font-medium text-[var(--text)] mb-2 flex items-center gap-2">
            <span>Parent Feedback</span>
            <Tag color="green">Primary</Tag>
          </div>
          {parent && (
            <Card className="p-3 border-2 border-green-500/50">
              <div className="flex items-start gap-3">
                <FiMessageSquare className="w-5 h-5 text-green-500 flex-shrink-0 mt-0.5" />
                <div className="min-w-0 flex-1">
                  <div className="flex items-center gap-2 mb-1">
                    <Tag color={getTypeColor(parent.type) as 'blue' | 'red' | 'orange' | 'green' | 'purple' | 'default'}>
                      {getTypeLabel(parent.type)}
                    </Tag>
                  </div>
                  <div className="text-sm text-[var(--text)] line-clamp-2">
                    {parent.content}
                  </div>
                </div>
              </div>
            </Card>
          )}
        </div>

        {/* Arrow indicator */}
        <div className="flex justify-center">
          <FiArrowDown className="w-5 h-5 text-[var(--text-muted)]" />
        </div>

        {/* Children */}
        <div>
          <div className="text-sm font-medium text-[var(--text)] mb-2">
            Child Feedback ({children.length})
          </div>
          <div className="space-y-2 max-h-[200px] overflow-y-auto">
            {children.map((feedback) => (
              <Card key={feedback.id} className="p-3">
                <div className="flex items-start gap-3">
                  <FiMessageSquare className="w-4 h-4 text-[var(--text-muted)] flex-shrink-0 mt-0.5" />
                  <div className="min-w-0 flex-1">
                    <div className="flex items-center gap-2 mb-1">
                      <Tag color={getTypeColor(feedback.type) as 'blue' | 'red' | 'orange' | 'green' | 'purple' | 'default'}>
                        {getTypeLabel(feedback.type)}
                      </Tag>
                    </div>
                    <div className="text-sm text-[var(--text)] line-clamp-2">
                      {feedback.content}
                    </div>
                  </div>
                </div>
              </Card>
            ))}
          </div>
        </div>

        {/* Note about relationships */}
        <div className="p-3 bg-[var(--info)]/10 border border-[var(--info)] rounded">
          <p className="text-sm text-[var(--text)]">
            <strong>Note:</strong> All persona and use case associations on child
            feedback items will be maintained. Child feedback will be hidden from
            the main list but visible when viewing the parent feedback.
          </p>
        </div>
      </div>
    </Modal>
  );
}
