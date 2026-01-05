import { useState } from 'react';
import { FiClipboard, FiUsers, FiChevronDown, FiChevronUp, FiTrash2, FiAlertCircle } from 'react-icons/fi';
import { LuX } from 'react-icons/lu';
import { Card } from '~/core/components/ui/Card';
import { Tag } from '~/core/components/ui/Tag';
import type { ExtractedUseCase, ExtractedPersona } from '~/core/entities/discovery';
import type { SimilarUseCaseResult } from '~/core/entities/product-management/types';
import { ConfidenceBadge } from './ConfidenceBadge';
import { QuotesList } from './QuoteHighlight';
import { formatRelativeTime } from '~/core/utils/formatRelativeTime';

interface UseCaseResultCardProps {
  useCase: ExtractedUseCase;
  index: number;
  personas: ExtractedPersona[];
  onDelete?: (index: number) => void;
  deletedPersonaIndexes?: Set<number>;
  similarUseCases?: SimilarUseCaseResult[];
  isCheckingSimilarity?: boolean;
}

export function UseCaseResultCard({
  useCase,
  index,
  personas,
  onDelete,
  deletedPersonaIndexes,
  similarUseCases,
  isCheckingSimilarity,
}: UseCaseResultCardProps) {
  const [isExpanded, setIsExpanded] = useState(true);
  const [selectedMatch, setSelectedMatch] = useState<SimilarUseCaseResult | null>(null);

  // Get linked persona names (excluding deleted personas)
  const linkedPersonas = useCase.linkedPersonaIndexes
    .filter((idx) => !deletedPersonaIndexes?.has(idx))
    .map((idx) => personas[idx])
    .filter(Boolean);

  return (
    <>
      <Card className="h-full flex flex-col">
        {/* Checking state */}
        {isCheckingSimilarity && (
          <div className="mb-3 px-4 py-2.5 bg-[var(--bg-secondary)] rounded-lg text-xs text-[var(--text-muted)]">
            Checking for similar use cases...
          </div>
        )}

        {/* Similarity Banner */}
        {similarUseCases && similarUseCases.length > 0 && (
          <button
            onClick={() => setSelectedMatch(similarUseCases[0])}
            className="mb-3 w-full px-4 py-2.5 bg-[var(--warning)]/10 border-2 border-[var(--warning)] rounded-lg text-left hover:bg-[var(--warning)]/20 transition-colors shadow-sm"
          >
            <div className="flex items-center justify-between gap-2">
              <div className="flex items-center gap-2">
                <FiAlertCircle className="w-4 h-4 text-[var(--warning)] flex-shrink-0" />
                <span className="text-sm font-semibold text-[var(--text)]">
                  {similarUseCases.length} similar use {similarUseCases.length === 1 ? 'case' : 'cases'} found
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
          <div className="p-2 rounded-lg bg-blue-500/10 text-blue-500">
            <FiClipboard className="w-5 h-5" />
          </div>
          <div>
            <h3 className="font-medium text-[var(--text)]">{useCase.name}</h3>
          </div>
        </div>
        <div className="flex items-center gap-2">
          <ConfidenceBadge confidence={useCase.confidence} />
          {onDelete && (
            <button
              type="button"
              onClick={() => onDelete(index)}
              className="p-1.5 rounded hover:bg-red-50 dark:hover:bg-red-900/20 text-[var(--text-muted)] hover:text-[var(--danger)] transition-colors"
              title="Remove use case"
            >
              <FiTrash2 className="w-4 h-4" />
            </button>
          )}
        </div>
      </div>

      {/* Description */}
      <p className="text-sm text-[var(--text)] mt-4">{useCase.description}</p>

      {/* Expandable details */}
      {(linkedPersonas.length > 0 || useCase.quotes.length > 0) && (
        <>
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
              {/* Linked Personas */}
              {linkedPersonas.length > 0 && (
                <div>
                  <div className="flex items-center gap-2 mb-2">
                    <FiUsers className="w-4 h-4 text-[var(--primary)]" />
                    <h4 className="text-sm font-medium text-[var(--text)]">
                      Related Personas
                    </h4>
                  </div>
                  <div className="flex flex-wrap gap-2">
                    {linkedPersonas.map((persona, i) => (
                      <Tag key={i} color="blue">
                        {persona.name}
                      </Tag>
                    ))}
                  </div>
                </div>
              )}

              {/* Quotes */}
              {useCase.quotes.length > 0 && (
                <QuotesList quotes={useCase.quotes} maxVisible={2} />
              )}
            </div>
          )}
        </>
      )}

        {/* Index badge for linking reference */}
        <div className="mt-4 pt-3 border-t border-[var(--border)]">
          <span className="text-xs text-[var(--text-muted)]">
            Use Case #{index + 1}
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
                <div className="flex items-center gap-3">
                  <div className="flex items-center gap-2">
                    <FiAlertCircle className="w-5 h-5 text-[var(--warning)]" />
                    <h3 className="text-lg font-semibold text-[var(--text)]">Similar Use Case Found</h3>
                  </div>
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
                <button
                  onClick={() => setSelectedMatch(null)}
                  className="p-2 rounded hover:bg-[var(--bg-secondary)] transition-colors"
                >
                  <LuX className="w-5 h-5 text-[var(--text-muted)]" />
                </button>
              </div>
            </div>

            {/* Content - Three Column Layout */}
            <div className="flex-1 overflow-y-auto p-6">
              <div className="max-w-[1400px] mx-auto grid gap-6" style={{ gridTemplateColumns: '1fr 1fr 300px' }}>
                {/* New Use Case from Intake - Left Column */}
                <div>
                  <h3 className="text-sm font-medium text-[var(--text-muted)] mb-3">New Use Case (from intake)</h3>
                  <Card>
                    <div className="space-y-4">
                      <div>
                        <span className="text-xs text-[var(--text-muted)]">Name:</span>
                        <p className="text-sm font-medium text-[var(--text)] mt-1">{useCase.name}</p>
                      </div>
                      <div>
                        <span className="text-xs text-[var(--text-muted)]">Description:</span>
                        <p className="text-sm text-[var(--text)] mt-1">{useCase.description || 'None'}</p>
                      </div>
                      {useCase.quotes && useCase.quotes.length > 0 && (
                        <div>
                          <span className="text-xs text-[var(--text-muted)]">Quotes:</span>
                          <div className="mt-1 space-y-2">
                            {useCase.quotes.map((quote, idx) => (
                              <div key={idx} className="pl-3 border-l-2 border-[var(--border)]">
                                <p className="text-xs italic text-[var(--text-muted)]">"{quote}"</p>
                              </div>
                            ))}
                          </div>
                        </div>
                      )}
                      <div>
                        <span className="text-xs text-[var(--text-muted)]">Confidence:</span>
                        <p className="text-sm text-[var(--text)] mt-1">{Math.round(useCase.confidence * 100)}%</p>
                      </div>
                    </div>
                  </Card>
                </div>

                {/* Existing Use Case - Middle Column */}
                <div>
                  <h3 className="text-sm font-medium text-[var(--text-muted)] mb-3">Existing Use Case</h3>
                  <Card className="border-2 border-[var(--primary)]">
                    <div className="space-y-4">
                      <div>
                        <span className="text-xs text-[var(--text-muted)]">Name:</span>
                        <p className="text-sm font-medium text-[var(--text)] mt-1">{selectedMatch.useCase.name}</p>
                      </div>
                      <div>
                        <span className="text-xs text-[var(--text-muted)]">Description:</span>
                        <p className="text-sm text-[var(--text)] mt-1">{selectedMatch.useCase.description || 'None'}</p>
                      </div>
                      {selectedMatch.useCase.solutionId && (
                        <div>
                          <span className="text-xs text-[var(--text-muted)]">Solution:</span>
                          <p className="text-sm text-[var(--text)] mt-1">Linked to solution</p>
                        </div>
                      )}
                      <div>
                        <span className="text-xs text-[var(--text-muted)]">Last updated:</span>
                        <p className="text-sm text-[var(--text)] mt-1">
                          {formatRelativeTime(selectedMatch.useCase.updatedAt)}
                        </p>
                      </div>
                    </div>
                  </Card>

                  <div className="mt-4 p-3 bg-[var(--bg-secondary)] rounded border border-[var(--border)]">
                    <p className="text-xs text-[var(--text-muted)]">
                      If this is a duplicate, you can delete this use case from the intake results before saving.
                    </p>
                  </div>
                </div>

                {/* All Matches List - Right Column (300px fixed) */}
                <div>
                  <h3 className="text-sm font-medium text-[var(--text-muted)] mb-3">
                    All Matches ({similarUseCases?.length || 0})
                  </h3>
                  <div className="space-y-2">
                    {similarUseCases?.map((match, idx) => (
                      <button
                        key={idx}
                        onClick={() => setSelectedMatch(match)}
                        className={`w-full p-3 rounded border text-left transition-colors ${
                          selectedMatch.useCase.id === match.useCase.id
                            ? 'border-[var(--primary)] bg-[var(--primary)]/5'
                            : 'border-[var(--border)] hover:border-[var(--primary)]/50 hover:bg-[var(--bg-secondary)]'
                        }`}
                      >
                        <div className="space-y-2">
                          <div className="flex items-start justify-between gap-2">
                            <p className="text-sm font-medium text-[var(--text)] line-clamp-2">
                              {match.useCase.name}
                            </p>
                          </div>
                          <div className="flex items-center gap-2">
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
                            <span className="text-xs text-[var(--text-muted)]">
                              {match.matchType}
                            </span>
                          </div>
                        </div>
                      </button>
                    ))}
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
