/**
 * Feedback Children Expander
 * Expandable section showing child feedback items for a parent feedback.
 * Includes ability to unmerge (detach) children back to standalone status.
 */

import { useState } from 'react';
import { FiChevronDown, FiChevronRight, FiX, FiMessageSquare } from 'react-icons/fi';
import { Card, Tag, Button } from '~/core/components/ui';
import type { Feedback } from '~/core/entities/discovery';
import { FEEDBACK_TYPE_CONFIG } from '~/core/entities/discovery/types/Feedback';
import { useUnmergeFeedback } from '../mutations';

interface FeedbackChildrenExpanderProps {
  children: Feedback[];
  onChildUnmerged?: () => void;
}

export function FeedbackChildrenExpander({
  children,
  onChildUnmerged,
}: FeedbackChildrenExpanderProps) {
  const [expanded, setExpanded] = useState(false);
  const unmergeMutation = useUnmergeFeedback();

  if (children.length === 0) return null;

  const getTypeColor = (type: string) => {
    const config = FEEDBACK_TYPE_CONFIG[type as keyof typeof FEEDBACK_TYPE_CONFIG];
    return config?.color || 'default';
  };

  const getTypeLabel = (type: string) => {
    const config = FEEDBACK_TYPE_CONFIG[type as keyof typeof FEEDBACK_TYPE_CONFIG];
    return config?.label || type;
  };

  const handleUnmerge = async (feedbackId: string) => {
    try {
      await unmergeMutation.mutateAsync(feedbackId);
      onChildUnmerged?.();
    } catch {
      // Error handled by mutation
    }
  };

  return (
    <div className="mt-4 border-t border-[var(--border)] pt-4">
      <button
        onClick={() => setExpanded(!expanded)}
        className="flex items-center gap-2 text-sm font-medium text-[var(--text)] hover:text-[var(--primary)] transition-colors"
      >
        {expanded ? (
          <FiChevronDown className="w-4 h-4" />
        ) : (
          <FiChevronRight className="w-4 h-4" />
        )}
        <span>Related Feedback ({children.length})</span>
      </button>

      {expanded && (
        <div className="mt-3 space-y-2 pl-4 border-l-2 border-[var(--border)]">
          {children.map((child) => (
            <Card key={child.id} className="p-3">
              <div className="flex items-start justify-between gap-2">
                <div className="flex items-start gap-3 flex-1 min-w-0">
                  <FiMessageSquare className="w-4 h-4 text-[var(--text-muted)] flex-shrink-0 mt-0.5" />
                  <div className="min-w-0 flex-1">
                    <div className="flex items-center gap-2 mb-1">
                      <Tag color={getTypeColor(child.type) as 'blue' | 'red' | 'orange' | 'green' | 'purple' | 'default'}>
                        {getTypeLabel(child.type)}
                      </Tag>
                      <span className="text-xs text-[var(--text-muted)]">
                        {new Date(child.createdAt).toLocaleDateString()}
                      </span>
                    </div>
                    <p className="text-sm text-[var(--text)] line-clamp-2">
                      {child.content}
                    </p>
                  </div>
                </div>
                <Button
                  variant="text"
                  size="small"
                  onClick={() => handleUnmerge(child.id)}
                  disabled={unmergeMutation.isPending}
                  title="Detach from parent"
                  className="flex-shrink-0"
                >
                  <FiX className="w-4 h-4 text-[var(--text-muted)] hover:text-[var(--danger)]" />
                </Button>
              </div>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}
