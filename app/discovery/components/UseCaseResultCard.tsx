import { useState } from 'react';
import { FiClipboard, FiUsers, FiChevronDown, FiChevronUp } from 'react-icons/fi';
import { Card } from '~/core/components/ui/Card';
import { Tag } from '~/core/components/ui/Tag';
import type { ExtractedUseCase, ExtractedPersona } from '~/core/entities/discovery';
import { ConfidenceBadge } from './ConfidenceBadge';
import { QuotesList } from './QuoteHighlight';

interface UseCaseResultCardProps {
  useCase: ExtractedUseCase;
  index: number;
  personas: ExtractedPersona[];
}

export function UseCaseResultCard({
  useCase,
  index,
  personas,
}: UseCaseResultCardProps) {
  const [isExpanded, setIsExpanded] = useState(true);

  // Get linked persona names
  const linkedPersonas = useCase.linkedPersonaIndexes
    .map((idx) => personas[idx])
    .filter(Boolean);

  return (
    <Card className="h-full flex flex-col">
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
        <ConfidenceBadge confidence={useCase.confidence} />
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
  );
}
