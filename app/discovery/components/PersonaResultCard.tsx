import { useState } from 'react';
import { FiUser, FiTarget, FiAlertCircle, FiChevronDown, FiChevronUp, FiTrash2 } from 'react-icons/fi';
import { Card } from '~/core/components/ui/Card';
import { Tag } from '~/core/components/ui/Tag';
import type { ExtractedPersona } from '~/core/entities/discovery';
import type { SimilarPersonaResult } from '~/core/entities/product-management/types';
import { formatRelativeTime } from '~/core/utils/formatRelativeTime';
import { ConfidenceBadge } from './ConfidenceBadge';
import { QuotesList } from './QuoteHighlight';

interface PersonaResultCardProps {
  persona: ExtractedPersona;
  index: number;
  onDelete?: (index: number) => void;
  similarPersonas?: SimilarPersonaResult[];
  isCheckingSimilarity?: boolean;
}

export function PersonaResultCard({ persona, index, onDelete, similarPersonas, isCheckingSimilarity }: PersonaResultCardProps) {
  const [isExpanded, setIsExpanded] = useState(true);
  const [selectedMatch, setSelectedMatch] = useState<SimilarPersonaResult | null>(null);

  const hasGoals = persona.goals.length > 0;
  const hasPainPoints = persona.painPoints.length > 0;
  const hasDemographics =
    persona.demographics.education ||
    persona.demographics.experience ||
    persona.demographics.industry;

  return (
    <>
      <Card className="h-full flex flex-col">
        {/* Similarity Notices */}
        {isCheckingSimilarity && (
          <div className="mb-2 px-3 py-1.5 bg-[var(--bg-secondary)] rounded text-xs text-[var(--text-muted)]">
            Checking for similar personas...
          </div>
        )}

        {similarPersonas && similarPersonas.length > 0 && (
          <button
            onClick={() => setSelectedMatch(similarPersonas[0])}
            className="mb-3 w-full px-4 py-2.5 bg-[var(--warning)]/10 border-2 border-[var(--warning)] rounded-lg text-left hover:bg-[var(--warning)]/20 transition-colors shadow-sm"
          >
            <div className="flex items-center justify-between gap-2">
              <div className="flex items-center gap-2">
                <FiAlertCircle className="w-4 h-4 text-[var(--warning)] flex-shrink-0" />
                <span className="text-sm font-semibold text-[var(--text)]">
                  {similarPersonas.length} similar {similarPersonas.length === 1 ? 'persona' : 'personas'} found
                </span>
              </div>
              <span className="text-xs font-medium text-[var(--warning)]">
                Click to compare →
              </span>
            </div>
          </button>
        )}

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

      {/* Similarity Details Bottom Drawer */}
      {selectedMatch !== null && (
        <div
          className="fixed inset-0 z-50 flex items-end"
          onClick={() => setSelectedMatch(null)}
        >
          <div
            className="w-full max-h-[80vh] bg-[var(--bg)] border-t border-[var(--border)] shadow-xl flex flex-col animate-slide-in-bottom overflow-hidden"
            onClick={(e) => e.stopPropagation()}
          >
            {/* Header */}
            <div className="border-b border-[var(--border)]">
              <div className="max-w-[1400px] mx-auto flex items-center justify-between px-6 py-4">
                <div>
                  <h2 className="text-lg font-semibold text-[var(--text)]">Similar Persona Comparison</h2>
                  <div className="flex items-center gap-2 mt-1">
                    <Tag
                      color={
                        selectedMatch.similarity > 0.8
                          ? 'red'
                          : selectedMatch.similarity > 0.5
                          ? 'orange'
                          : 'blue'
                      }
                    >
                      {Math.round(selectedMatch.similarity * 100)}% match
                    </Tag>
                    <Tag color="default">{selectedMatch.matchType} match</Tag>
                  </div>
                </div>
                <button
                  onClick={() => setSelectedMatch(null)}
                  className="p-2 rounded hover:bg-[var(--bg-secondary)] text-[var(--text-muted)] hover:text-[var(--text)] transition-colors"
                >
                  <FiChevronDown className="w-5 h-5" />
                </button>
              </div>
            </div>

            {/* Content - Three Column Layout */}
            <div className="flex-1 overflow-y-auto p-6">
              <div className="max-w-[1400px] mx-auto grid gap-6" style={{ gridTemplateColumns: '1fr 1fr 300px' }}>
                {/* New Persona from Intake */}
                <div>
                  <h3 className="text-sm font-medium text-[var(--text-muted)] mb-3">New Persona (from intake)</h3>
                  <Card>
                    <div className="space-y-4">
                      <div className="flex items-start gap-3">
                        <div className="p-2 rounded-lg bg-[var(--primary)]/10 text-[var(--primary)]">
                          <FiUser className="w-5 h-5" />
                        </div>
                        <div className="flex-1">
                          <h3 className="font-medium text-[var(--text)]">{persona.name}</h3>
                          <p className="text-sm text-[var(--text-muted)]">{persona.role}</p>
                          {persona.confidence !== undefined && (
                            <div className="mt-1">
                              <ConfidenceBadge confidence={persona.confidence} />
                            </div>
                          )}
                        </div>
                      </div>

                      <div>
                        <h4 className="text-xs font-medium text-[var(--text-muted)] mb-1">Description</h4>
                        <p className="text-sm text-[var(--text)]">{persona.description || 'No description provided.'}</p>
                      </div>

                      {hasGoals && (
                        <div>
                          <div className="flex items-center gap-2 mb-2">
                            <FiTarget className="w-4 h-4 text-[var(--success)]" />
                            <h4 className="text-xs font-medium text-[var(--text-muted)]">Goals</h4>
                          </div>
                          <ul className="space-y-1">
                            {persona.goals.map((goal, i) => (
                              <li
                                key={i}
                                className="text-sm text-[var(--text)] pl-6 relative before:absolute before:left-2 before:top-2 before:w-1.5 before:h-1.5 before:bg-[var(--success)] before:rounded-full"
                              >
                                {goal}
                              </li>
                            ))}
                          </ul>
                        </div>
                      )}

                      {hasPainPoints && (
                        <div>
                          <div className="flex items-center gap-2 mb-2">
                            <FiAlertCircle className="w-4 h-4 text-[var(--danger)]" />
                            <h4 className="text-xs font-medium text-[var(--text-muted)]">Pain Points</h4>
                          </div>
                          <ul className="space-y-1">
                            {persona.painPoints.map((painPoint, i) => (
                              <li
                                key={i}
                                className="text-sm text-[var(--text)] pl-6 relative before:absolute before:left-2 before:top-2 before:w-1.5 before:h-1.5 before:bg-[var(--danger)] before:rounded-full"
                              >
                                {painPoint}
                              </li>
                            ))}
                          </ul>
                        </div>
                      )}
                    </div>
                  </Card>
                </div>

                {/* Existing Persona */}
                <div>
                  <h3 className="text-sm font-medium text-[var(--text-muted)] mb-3">Existing Persona</h3>
                  <Card className="border-2 border-[var(--primary)]">
                    <div className="space-y-4">
                      <div className="flex items-start gap-3">
                        <div className="p-2 rounded-lg bg-[var(--primary)]/10 text-[var(--primary)]">
                          <FiUser className="w-5 h-5" />
                        </div>
                        <div className="flex-1">
                          <h3 className="font-medium text-[var(--text)]">{selectedMatch.persona.name}</h3>
                          <p className="text-sm text-[var(--text-muted)]">{selectedMatch.persona.role}</p>
                          <p className="text-xs text-[var(--text-disabled)] mt-1">
                            Last updated {formatRelativeTime(selectedMatch.persona.updatedAt)}
                          </p>
                        </div>
                      </div>

                      <div>
                        <h4 className="text-xs font-medium text-[var(--text-muted)] mb-1">Description</h4>
                        <p className="text-sm text-[var(--text)]">{selectedMatch.persona.description || 'No description provided.'}</p>
                      </div>

                      {selectedMatch.persona.goals && selectedMatch.persona.goals.length > 0 && (
                        <div>
                          <div className="flex items-center gap-2 mb-2">
                            <FiTarget className="w-4 h-4 text-[var(--success)]" />
                            <h4 className="text-xs font-medium text-[var(--text-muted)]">Goals</h4>
                          </div>
                          <ul className="space-y-1">
                            {selectedMatch.persona.goals.map((goal, i) => (
                              <li
                                key={i}
                                className="text-sm text-[var(--text)] pl-6 relative before:absolute before:left-2 before:top-2 before:w-1.5 before:h-1.5 before:bg-[var(--success)] before:rounded-full"
                              >
                                {goal}
                              </li>
                            ))}
                          </ul>
                        </div>
                      )}

                      {selectedMatch.persona.painPoints && selectedMatch.persona.painPoints.length > 0 && (
                        <div>
                          <div className="flex items-center gap-2 mb-2">
                            <FiAlertCircle className="w-4 h-4 text-[var(--danger)]" />
                            <h4 className="text-xs font-medium text-[var(--text-muted)]">Pain Points</h4>
                          </div>
                          <ul className="space-y-1">
                            {selectedMatch.persona.painPoints.map((painPoint, i) => (
                              <li
                                key={i}
                                className="text-sm text-[var(--text)] pl-6 relative before:absolute before:left-2 before:top-2 before:w-1.5 before:h-1.5 before:bg-[var(--danger)] before:rounded-full"
                              >
                                {painPoint}
                              </li>
                            ))}
                          </ul>
                        </div>
                      )}
                    </div>
                  </Card>
                </div>

                {/* All Matches List */}
                <div>
                  <h3 className="text-sm font-medium text-[var(--text-muted)] mb-3">
                    All Matches ({similarPersonas?.length || 0})
                  </h3>
                  <div className="space-y-2">
                    {similarPersonas?.map((match, idx) => (
                      <button
                        key={idx}
                        onClick={() => setSelectedMatch(match)}
                        className={`w-full p-3 rounded border text-left transition-colors ${
                          selectedMatch.persona.id === match.persona.id
                            ? 'border-[var(--primary)] bg-[var(--primary)]/5'
                            : 'border-[var(--border)] hover:border-[var(--primary)]/50 hover:bg-[var(--bg-secondary)]'
                        }`}
                      >
                        <div className="flex items-start justify-between gap-2 mb-1">
                          <p className="text-sm font-medium text-[var(--text)] line-clamp-1">
                            {match.persona.name}
                          </p>
                          <Tag
                            color={
                              match.similarity > 0.8
                                ? 'red'
                                : match.similarity > 0.5
                                ? 'orange'
                                : 'blue'
                            }
                          >
                            {Math.round(match.similarity * 100)}%
                          </Tag>
                        </div>
                        <p className="text-xs text-[var(--text-muted)] line-clamp-1">
                          {match.persona.role}
                        </p>
                        <p className="text-xs text-[var(--text-disabled)] mt-1">
                          {formatRelativeTime(match.persona.updatedAt)}
                        </p>
                      </button>
                    ))}
                  </div>
                </div>
              </div>

              {/* Action hint */}
              <div className="mt-6 p-4 bg-[var(--bg-secondary)] rounded border border-[var(--border)]">
                <p className="text-sm text-[var(--text-muted)]">
                  💡 If this is a duplicate, you can delete this persona from the intake results before saving.
                </p>
              </div>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
