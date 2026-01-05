/**
 * Similar Personas Panel Component
 * Displays a list of similar personas with similarity scores
 * Used for detecting duplicates and suggesting personas to merge
 */

import { FiUser, FiAlertCircle } from 'react-icons/fi';
import { Card, Tag, Button } from '~/core/components/ui';
import type { SimilarPersonaResult } from '~/core/entities/product-management/types';
import { formatRelativeTime } from '~/core/utils/formatRelativeTime';

interface SimilarPersonasPanelProps {
  results: SimilarPersonaResult[];
  onViewPersona?: (personaId: string) => void;
  onMergePersona?: (personaId: string) => void;
}

export function SimilarPersonasPanel({
  results,
  onViewPersona,
  onMergePersona,
}: SimilarPersonasPanelProps) {
  if (results.length === 0) {
    return null;
  }

  return (
    <div className="bg-[var(--warning-bg)] border border-[var(--warning)] rounded-lg p-4">
      <div className="flex items-start gap-2 mb-3">
        <FiAlertCircle className="text-[var(--warning)] mt-1 flex-shrink-0" />
        <div>
          <h3 className="text-sm font-semibold text-[var(--text)] mb-1">
            Similar Personas Found
          </h3>
          <p className="text-xs text-[var(--text-muted)]">
            We found {results.length} similar {results.length === 1 ? 'persona' : 'personas'}.
            Consider reviewing to avoid duplicates.
          </p>
        </div>
      </div>

      <div className="space-y-2 mt-3">
        {results.map((result) => (
          <Card key={result.persona.id} className="p-3">
            <div className="flex items-start justify-between gap-3">
              <div className="flex-grow min-w-0">
                {/* Header */}
                <div className="flex items-center gap-2 mb-2">
                  <FiUser className="text-[var(--primary)] flex-shrink-0" />
                  <h4 className="text-sm font-semibold text-[var(--text)] truncate">
                    {result.persona.name}
                  </h4>
                  <div className="flex gap-1 flex-shrink-0">
                    <Tag
                      color={
                        result.similarity > 0.8
                          ? 'red'
                          : result.similarity > 0.5
                          ? 'orange'
                          : 'blue'
                      }
                    >
                      {Math.round(result.similarity * 100)}% match
                    </Tag>
                    <Tag color="default">{result.matchType}</Tag>
                  </div>
                </div>

                {/* Role */}
                {result.persona.role && (
                  <p className="text-xs text-[var(--text-muted)] mb-2">
                    {result.persona.role}
                  </p>
                )}

                {/* Description */}
                <p className="text-xs text-[var(--text-muted)] line-clamp-2">
                  {result.persona.description || 'No description provided.'}
                </p>

                {/* Last updated */}
                <p className="text-xs text-[var(--text-disabled)] mt-2">
                  Last updated {formatRelativeTime(result.persona.updatedAt)}
                </p>
              </div>

              {/* Actions */}
              <div className="flex flex-col gap-1 flex-shrink-0">
                {onViewPersona && (
                  <Button
                    size="small"
                    variant="text"
                    onClick={() => onViewPersona(result.persona.id)}
                  >
                    View
                  </Button>
                )}
                {onMergePersona && (
                  <Button
                    size="small"
                    variant="default"
                    onClick={() => onMergePersona(result.persona.id)}
                  >
                    Merge
                  </Button>
                )}
              </div>
            </div>
          </Card>
        ))}
      </div>
    </div>
  );
}
