import { useState } from 'react';
import { FiUser, FiTarget, FiAlertCircle, FiChevronDown, FiChevronUp, FiTrash2 } from 'react-icons/fi';
import { Card } from '~/core/components/ui/Card';
import { Tag } from '~/core/components/ui/Tag';
import type { ExtractedPersona } from '~/core/entities/discovery';
import { ConfidenceBadge } from './ConfidenceBadge';
import { QuotesList } from './QuoteHighlight';

interface PersonaResultCardProps {
  persona: ExtractedPersona;
  index: number;
  onDelete?: (index: number) => void;
}

export function PersonaResultCard({ persona, index, onDelete }: PersonaResultCardProps) {
  const [isExpanded, setIsExpanded] = useState(true);

  const hasGoals = persona.goals.length > 0;
  const hasPainPoints = persona.painPoints.length > 0;
  const hasDemographics =
    persona.demographics.education ||
    persona.demographics.experience ||
    persona.demographics.industry;

  return (
    <Card className="h-full flex flex-col">
      {/* Header */}
      <div className="flex items-start justify-between gap-3">
        <div className="flex items-start gap-3">
          <div className="p-2 rounded-lg bg-[var(--primary)]/10 text-[var(--primary)]">
            <FiUser className="w-5 h-5" />
          </div>
          <div>
            <h3 className="font-medium text-[var(--text)]">{persona.name}</h3>
            <p className="text-sm text-[var(--text-muted)]">{persona.role}</p>
          </div>
        </div>
        <div className="flex items-center gap-2">
          <ConfidenceBadge confidence={persona.confidence} />
          {onDelete && (
            <button
              type="button"
              onClick={() => onDelete(index)}
              className="p-1.5 rounded hover:bg-red-50 dark:hover:bg-red-900/20 text-[var(--text-muted)] hover:text-[var(--danger)] transition-colors"
              title="Remove persona"
            >
              <FiTrash2 className="w-4 h-4" />
            </button>
          )}
        </div>
      </div>

      {/* Description */}
      <p className="text-sm text-[var(--text)] mt-4">{persona.description}</p>

      {/* Expandable details */}
      <button
        type="button"
        onClick={() => setIsExpanded(!isExpanded)}
        className="flex items-center gap-1 text-sm text-[var(--primary)] mt-4 hover:underline"
      >
        {isExpanded ? (
          <>
            <FiChevronUp className="w-4 h-4" />
            Hide details
          </>
        ) : (
          <>
            <FiChevronDown className="w-4 h-4" />
            Show details
          </>
        )}
      </button>

      {isExpanded && (
        <div className="mt-4 space-y-4 flex-1">
          {/* Goals */}
          {hasGoals && (
            <div>
              <div className="flex items-center gap-2 mb-2">
                <FiTarget className="w-4 h-4 text-[var(--success)]" />
                <h4 className="text-sm font-medium text-[var(--text)]">Goals</h4>
              </div>
              <ul className="space-y-1">
                {persona.goals.map((goal, i) => (
                  <li
                    key={i}
                    className="text-sm text-[var(--text-muted)] pl-6 relative before:absolute before:left-2 before:top-2 before:w-1.5 before:h-1.5 before:bg-[var(--success)] before:rounded-full"
                  >
                    {goal}
                  </li>
                ))}
              </ul>
            </div>
          )}

          {/* Pain Points */}
          {hasPainPoints && (
            <div>
              <div className="flex items-center gap-2 mb-2">
                <FiAlertCircle className="w-4 h-4 text-[var(--danger)]" />
                <h4 className="text-sm font-medium text-[var(--text)]">Pain Points</h4>
              </div>
              <ul className="space-y-1">
                {persona.painPoints.map((painPoint, i) => (
                  <li
                    key={i}
                    className="text-sm text-[var(--text-muted)] pl-6 relative before:absolute before:left-2 before:top-2 before:w-1.5 before:h-1.5 before:bg-[var(--danger)] before:rounded-full"
                  >
                    {painPoint}
                  </li>
                ))}
              </ul>
            </div>
          )}

          {/* Demographics */}
          {hasDemographics && (
            <div>
              <h4 className="text-sm font-medium text-[var(--text)] mb-2">Demographics</h4>
              <div className="flex flex-wrap gap-2">
                {persona.demographics.education && (
                  <Tag>{persona.demographics.education}</Tag>
                )}
                {persona.demographics.experience && (
                  <Tag>{persona.demographics.experience}</Tag>
                )}
                {persona.demographics.industry && (
                  <Tag>{persona.demographics.industry}</Tag>
                )}
              </div>
            </div>
          )}

          {/* Quotes */}
          {persona.quotes.length > 0 && (
            <QuotesList quotes={persona.quotes} maxVisible={2} className="mt-4" />
          )}
        </div>
      )}

      {/* Index badge for linking reference */}
      <div className="mt-4 pt-3 border-t border-[var(--border)]">
        <span className="text-xs text-[var(--text-muted)]">
          Persona #{index + 1}
        </span>
      </div>
    </Card>
  );
}
