import { FiAlertCircle } from 'react-icons/fi';
import { LuX } from 'react-icons/lu';
import { Card } from '~/core/components/ui/Card';
import { Tag } from '~/core/components/ui/Tag';

interface SimilarityComparisonDrawerProps<TMatch> {
  // State
  isOpen: boolean;
  onClose: () => void;

  // Header
  title: string;
  selectedMatch: TMatch | null;
  getSimilarity: (match: TMatch) => number;
  getMatchType: (match: TMatch) => string;

  // All matches list (right column)
  allMatches: TMatch[];
  onSelectMatch: (match: TMatch) => void;
  getMatchId: (match: TMatch) => string;
  renderMatchListItem: (match: TMatch) => React.ReactNode;

  // Content columns (render props)
  renderNewItem: () => React.ReactNode;
  renderExistingItem: (match: TMatch) => React.ReactNode;

  // Labels
  newItemLabel?: string;
  existingItemLabel?: string;

  // Optional
  actionHint?: string;
}

function getSimilarityColor(similarity: number): 'red' | 'orange' | 'blue' {
  if (similarity > 0.8) return 'red';
  if (similarity > 0.5) return 'orange';
  return 'blue';
}

export function SimilarityComparisonDrawer<TMatch>({
  isOpen,
  onClose,
  title,
  selectedMatch,
  getSimilarity,
  getMatchType,
  allMatches,
  onSelectMatch,
  getMatchId,
  renderMatchListItem,
  renderNewItem,
  renderExistingItem,
  newItemLabel = 'New Item (from intake)',
  existingItemLabel = 'Existing Item',
  actionHint = 'If this is a duplicate, you can delete this item from the intake results before saving.',
}: SimilarityComparisonDrawerProps<TMatch>) {
  if (!isOpen || selectedMatch === null) {
    return null;
  }

  const similarity = getSimilarity(selectedMatch);
  const matchType = getMatchType(selectedMatch);
  const selectedId = getMatchId(selectedMatch);

  return (
    <div
      className="fixed inset-0 z-50 flex items-end"
      onClick={onClose}
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
                <h3 className="text-lg font-semibold text-[var(--text)]">{title}</h3>
              </div>
              <Tag color={getSimilarityColor(similarity)}>
                {Math.round(similarity * 100)}% match
              </Tag>
              <Tag color="default">{matchType} match</Tag>
            </div>
            <button
              onClick={onClose}
              className="p-2 rounded hover:bg-[var(--bg-secondary)] transition-colors"
            >
              <LuX className="w-5 h-5 text-[var(--text-muted)]" />
            </button>
          </div>
        </div>

        {/* Content - Three Column Layout */}
        <div className="flex-1 overflow-y-auto p-6">
          <div className="max-w-[1400px] mx-auto grid gap-6" style={{ gridTemplateColumns: '1fr 1fr 300px' }}>
            {/* New Item - Left Column */}
            <div>
              <h3 className="text-sm font-medium text-[var(--text-muted)] mb-3">{newItemLabel}</h3>
              <Card>
                {renderNewItem()}
              </Card>
            </div>

            {/* Existing Item - Middle Column */}
            <div>
              <h3 className="text-sm font-medium text-[var(--text-muted)] mb-3">{existingItemLabel}</h3>
              <Card className="border-2 border-[var(--primary)]">
                {renderExistingItem(selectedMatch)}
              </Card>

              <div className="mt-4 p-3 bg-[var(--bg-secondary)] rounded border border-[var(--border)]">
                <p className="text-xs text-[var(--text-muted)]">
                  {actionHint}
                </p>
              </div>
            </div>

            {/* All Matches List - Right Column */}
            <div>
              <h3 className="text-sm font-medium text-[var(--text-muted)] mb-3">
                All Matches ({allMatches.length})
              </h3>
              <div className="space-y-2">
                {allMatches.map((match, idx) => {
                  const matchId = getMatchId(match);
                  const matchSimilarity = getSimilarity(match);
                  const isSelected = selectedId === matchId;

                  return (
                    <button
                      key={idx}
                      onClick={() => onSelectMatch(match)}
                      className={`w-full p-3 rounded border text-left transition-colors ${
                        isSelected
                          ? 'border-[var(--primary)] bg-[var(--primary)]/5'
                          : 'border-[var(--border)] hover:border-[var(--primary)]/50 hover:bg-[var(--bg-secondary)]'
                      }`}
                    >
                      <div className="space-y-2">
                        {renderMatchListItem(match)}
                        <div className="flex items-center gap-2">
                          <Tag color={getSimilarityColor(matchSimilarity)}>
                            {Math.round(matchSimilarity * 100)}%
                          </Tag>
                          <span className="text-xs text-[var(--text-muted)]">
                            {getMatchType(match)}
                          </span>
                        </div>
                      </div>
                    </button>
                  );
                })}
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
