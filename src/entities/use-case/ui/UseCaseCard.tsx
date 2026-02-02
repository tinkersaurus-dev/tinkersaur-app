/**
 * Use Case Card Component
 * Displays a use case in a compact card format with persona and quote counts
 */

import type { ReactNode } from 'react';
import { useNavigate } from 'react-router';
import { FiBriefcase, FiMessageCircle } from 'react-icons/fi';
import { Card, Tag } from '@/shared/ui';
import type { UseCase } from '@/entities/use-case';

interface UseCaseCardProps {
  useCase: UseCase;
  /** Optional action slot (e.g., Unlink button) */
  action?: ReactNode;
}

export function UseCaseCard({ useCase, action }: UseCaseCardProps) {
  const navigate = useNavigate();

  const handleDoubleClick = () => {
    navigate(`/discovery/organize/use-cases/${useCase.id}`);
  };

  return (
    <Card hoverable className="rounded-sm bg-[var(--bg-use-case-card)]" onDoubleClick={handleDoubleClick}>
      <div className="flex items-start justify-between gap-2">
        <div className="min-w-0 flex-1">
          {/* Header: Icon + Name */}
          <div className="flex items-center gap-2 mb-1">
            <span className="text-[var(--primary)] text-base flex-shrink-0">
              <FiBriefcase />
            </span>
            <h3 className="text-sm font-semibold text-[var(--text)] truncate">
              {useCase.name}
            </h3>
          </div>

          {/* Description */}
          {useCase.description && (
            <div className="text-xs text-[var(--text-muted)] line-clamp-2 mb-2 ml-6">
              {useCase.description}
            </div>
          )}

          {/* Feedback counts */}
          <div className="flex gap-2 flex-wrap ml-6">
            {useCase.feedbackIds.length > 0 && (
              <Tag color="purple">
                <span className="flex items-center gap-1">
                  <FiMessageCircle className="text-xs" />
                  {useCase.feedbackIds.length} Feedback
                </span>
              </Tag>
            )}
          </div>
        </div>

        {/* Action slot */}
        {action && <div className="flex-shrink-0">{action}</div>}
      </div>
    </Card>
  );
}
