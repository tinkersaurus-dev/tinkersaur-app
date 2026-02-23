/**
 * User Goal Card Component
 * Displays a user goal in a compact card format with persona and feedback counts
 */

import type { ReactNode } from 'react';
import { useNavigate } from 'react-router';
import { FiTarget, FiMessageCircle, FiUser } from 'react-icons/fi';
import { Card, Tag } from '@/shared/ui';
import type { UserGoal } from '@/entities/user-goal';

interface UserGoalCardProps {
  userGoal: UserGoal;
  /** Optional action slot (e.g., Unlink button) */
  action?: ReactNode;
}

export function UserGoalCard({ userGoal, action }: UserGoalCardProps) {
  const navigate = useNavigate();

  const handleDoubleClick = () => {
    navigate(`/discovery/organize/user-goals/${userGoal.id}`);
  };

  return (
    <Card hoverable className="rounded-sm bg-[var(--bg-user-goal-card)]" onDoubleClick={handleDoubleClick}>
      <div className="flex items-start justify-between gap-2">
        <div className="min-w-0 flex-1">
          {/* Header: Icon + Name */}
          <div className="flex items-center gap-2 mb-1">
            <span className="text-[var(--primary)] text-base flex-shrink-0">
              <FiTarget />
            </span>
            <h3 className="text-sm font-semibold text-[var(--text)] truncate">
              {userGoal.name}
            </h3>
          </div>

          {/* Description */}
          {userGoal.description && (
            <div className="text-xs text-[var(--text-muted)] line-clamp-2 mb-2 ml-6">
              {userGoal.description}
            </div>
          )}

          {/* Counts */}
          <div className="flex gap-2 flex-wrap ml-6">
            {userGoal.personaIds.length > 0 && (
              <Tag color="blue">
                <span className="flex items-center gap-1">
                  <FiUser className="text-xs" />
                  {userGoal.personaIds.length} Persona{userGoal.personaIds.length !== 1 ? 's' : ''}
                </span>
              </Tag>
            )}
            {userGoal.feedbackIds.length > 0 && (
              <Tag color="purple">
                <span className="flex items-center gap-1">
                  <FiMessageCircle className="text-xs" />
                  {userGoal.feedbackIds.length} Feedback
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
