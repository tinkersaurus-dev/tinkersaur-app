/**
 * Persona Card Component
 * Displays a persona in a compact card format with role and goal/pain point counts
 */

import type { ReactNode } from 'react';
import { useNavigate } from 'react-router';
import { FiUser, FiTarget, FiAlertCircle } from 'react-icons/fi';
import { Card, Tag } from '@/shared/ui';
import type { Persona } from '@/entities/persona';

interface PersonaCardProps {
  persona: Persona;
  /** Optional action slot (e.g., Unlink button) */
  action?: ReactNode;
}

export function PersonaCard({ persona, action }: PersonaCardProps) {
  const navigate = useNavigate();

  const handleDoubleClick = () => {
    navigate(`/discovery/organize/personas/${persona.id}`);
  };

  return (
    <Card hoverable className="rounded-sm bg-[var(--bg-persona-card)]" onDoubleClick={handleDoubleClick}>
      <div className="flex items-start justify-between gap-2">
        <div className="min-w-0 flex-1">
          {/* Header: Icon + Name */}
          <div className="flex items-center gap-2 mb-1">
            <span className="text-[var(--primary)] text-base flex-shrink-0">
              <FiUser />
            </span>
            <h3 className="text-sm font-semibold text-[var(--text)] truncate">
              {persona.name}
            </h3>
          </div>

          {/* Role */}
          {persona.role && (
            <div className="text-xs text-[var(--text-muted)] truncate mb-2 ml-6">
              {persona.role}
            </div>
          )}

          {/* Goals and Pain Points counts */}
          <div className="flex gap-2 flex-wrap ml-6">
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
        </div>

        {/* Action slot */}
        {action && <div className="flex-shrink-0">{action}</div>}
      </div>
    </Card>
  );
}
