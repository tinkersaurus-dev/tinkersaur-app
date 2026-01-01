/**
 * Persona Card Component
 * Displays a persona in a card format with role, description, goals, and pain points
 */

import { useNavigate } from 'react-router';
import { FiUser, FiTarget, FiAlertCircle } from 'react-icons/fi';
import { Card, Tag } from '~/core/components/ui';
import type { Persona } from '~/core/entities/product-management';
import { formatRelativeTime } from '~/core/utils/formatRelativeTime';

interface PersonaCardProps {
  persona: Persona;
}

export function PersonaCard({ persona }: PersonaCardProps) {
  const navigate = useNavigate();

  const handleDoubleClick = () => {
    navigate(`/discovery/organize/personas/${persona.id}`);
  };

  return (
    <Card
      hoverable
      className="h-full flex flex-col"
      onDoubleClick={handleDoubleClick}
    >
      <div className="flex flex-col h-full">
        {/* Header: Icon + Name + Role */}
        <div className="flex items-center gap-2 mb-2">
          <span className="text-[var(--primary)] text-lg">
            <FiUser />
          </span>
          <h3 className="text-base font-semibold text-[var(--text)] truncate">
            {persona.name}
          </h3>
        </div>

        {/* Role */}
        {persona.role && (
          <div className="text-sm text-[var(--text-muted)] mb-3">
            {persona.role}
          </div>
        )}

        {/* Goals and Pain Points counts */}
        <div className="flex gap-2 mb-3 flex-wrap">
          {persona.goals.length > 0 && (
            <Tag color="green">
              <span className="flex items-center gap-1">
                <FiTarget className="text-xs" />
                {persona.goals.length} {persona.goals.length === 1 ? 'Goal' : 'Goals'}
              </span>
            </Tag>
          )}
          {persona.painPoints.length > 0 && (
            <Tag color="orange">
              <span className="flex items-center gap-1">
                <FiAlertCircle className="text-xs" />
                {persona.painPoints.length} {persona.painPoints.length === 1 ? 'Pain Point' : 'Pain Points'}
              </span>
            </Tag>
          )}
        </div>

        {/* Description - truncated to 3 lines */}
        <p className="text-sm text-[var(--text-muted)] line-clamp-3 flex-grow mb-4">
          {persona.description || 'No description provided.'}
        </p>

        {/* Footer: Last Updated */}
        <div className="text-xs text-[var(--text-disabled)] mt-auto">
          Last updated {formatRelativeTime(persona.updatedAt)}
        </div>
      </div>
    </Card>
  );
}
