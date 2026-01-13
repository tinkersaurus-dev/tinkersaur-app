/**
 * List component for displaying and managing factors of a specific type
 */

import { useState, useCallback } from 'react';
import { FiPlus, FiZap } from 'react-icons/fi';
import { FactorCard } from './FactorCard';
import { RefinementPreview } from './RefinementPreview';
import type {
  SolutionFactor,
  SolutionFactorType,
  UpdateSolutionFactorDto,
} from '~/core/entities/product-management/types';
import { FACTOR_TYPE_LABELS } from '~/core/entities/product-management/types';

interface FactorsListProps {
  type: SolutionFactorType;
  factors: SolutionFactor[];
  onAdd: (content: string, notes?: string) => Promise<void>;
  onUpdate: (id: string, updates: UpdateSolutionFactorDto) => Promise<void>;
  onDelete: (id: string) => void;
  onGenerateClick?: () => void;
  onRefine?: (
    factorType: SolutionFactorType,
    content: string,
    instructions: string
  ) => Promise<string | null>;
  isUpdating?: boolean;
  isGenerating?: boolean;
  isRefining?: boolean;
  showTargetDate?: boolean;
}

export function FactorsList({
  type,
  factors,
  onAdd,
  onUpdate,
  onDelete,
  onGenerateClick,
  onRefine,
  isUpdating = false,
  isGenerating = false,
  isRefining = false,
  showTargetDate = false,
}: FactorsListProps) {
  const [isAddingNew, setIsAddingNew] = useState(false);
  const [newContent, setNewContent] = useState('');
  const [newNotes, setNewNotes] = useState('');
  const [refinementInstructions, setRefinementInstructions] = useState('');
  const [refinedContent, setRefinedContent] = useState<string | null>(null);
  const [refinementError, setRefinementError] = useState<string | null>(null);

  const handleAddSave = useCallback(async () => {
    if (!newContent.trim()) return;

    await onAdd(newContent.trim(), newNotes.trim() || undefined);
    setNewContent('');
    setNewNotes('');
    setIsAddingNew(false);
  }, [newContent, newNotes, onAdd]);

  const handleAddCancel = useCallback(() => {
    setNewContent('');
    setNewNotes('');
    setRefinementInstructions('');
    setRefinedContent(null);
    setRefinementError(null);
    setIsAddingNew(false);
  }, []);

  const handleRefine = useCallback(async () => {
    if (!onRefine || !refinementInstructions.trim()) return;

    setRefinementError(null);
    try {
      const refined = await onRefine(type, newContent, refinementInstructions);
      if (refined) {
        setRefinedContent(refined);
      }
    } catch (err) {
      setRefinementError(err instanceof Error ? err.message : 'Failed to refine factor');
    }
  }, [onRefine, type, newContent, refinementInstructions]);

  const handleUseRefined = useCallback(() => {
    if (refinedContent) {
      setNewContent(refinedContent);
      setRefinedContent(null);
      setRefinementInstructions('');
    }
  }, [refinedContent]);

  const handleEditRefined = useCallback(() => {
    if (refinedContent) {
      setNewContent(refinedContent);
      setRefinedContent(null);
    }
  }, [refinedContent]);

  const handleKeepOriginal = useCallback(() => {
    setRefinedContent(null);
  }, []);

  const title = FACTOR_TYPE_LABELS[type];
  const activeFactors = factors.filter((f) => f.active);
  const inactiveCount = factors.length - activeFactors.length;

  return (
    <div className="space-y-3">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <h3 className="text-sm font-medium text-[var(--text)]">{title}</h3>
          {factors.length > 0 && (
            <span className="text-xs text-[var(--text-muted)]">
              ({activeFactors.length}
              {inactiveCount > 0 && ` + ${inactiveCount} inactive`})
            </span>
          )}
        </div>
        <div className="flex gap-2">
          {onGenerateClick && (
            <button
              type="button"
              onClick={onGenerateClick}
              disabled={isGenerating}
              className="flex items-center gap-1 px-2 py-1 text-xs text-[var(--primary)] hover:bg-[var(--primary)]/10 rounded transition-colors disabled:opacity-50"
            >
              <FiZap className="w-3.5 h-3.5" />
              {isGenerating ? 'Generating...' : 'Generate'}
            </button>
          )}
          <button
            type="button"
            onClick={() => setIsAddingNew(true)}
            disabled={isAddingNew}
            className="flex items-center gap-1 px-2 py-1 text-xs text-[var(--text-muted)] hover:text-[var(--text)] rounded transition-colors disabled:opacity-50"
          >
            <FiPlus className="w-3.5 h-3.5" />
            Add
          </button>
        </div>
      </div>

      {/* Factor cards */}
      <div className="space-y-2">
        {factors.map((factor) => (
          <FactorCard
            key={factor.id}
            factor={factor}
            factorType={type}
            onUpdate={onUpdate}
            onDelete={onDelete}
            onRefine={onRefine}
            isUpdating={isUpdating}
            isRefining={isRefining}
            showTargetDate={showTargetDate}
          />
        ))}

        {/* Add new form */}
        {isAddingNew && (
          <div className="p-4 border border-dashed border-[var(--border)] rounded-sm bg-[var(--bg)]">
            {/* Show refinement preview if we have refined content */}
            {refinedContent !== null ? (
              <RefinementPreview
                original={newContent.trim() || refinementInstructions}
                refined={refinedContent}
                onUseRefined={handleUseRefined}
                onEditRefined={handleEditRefined}
                onKeepOriginal={handleKeepOriginal}
                isGeneratedFromScratch={!newContent.trim()}
              />
            ) : (
              <div className="space-y-3">
                <div>
                  <label className="block text-xs font-medium text-[var(--text-muted)] mb-1">
                    Content
                  </label>
                  <textarea
                    value={newContent}
                    onChange={(e) => setNewContent(e.target.value)}
                    rows={3}
                    className="w-full px-3 py-2 border border-[var(--border)] rounded-sm bg-[var(--bg)] text-[var(--text)] text-sm resize-none focus:outline-none focus:border-[var(--primary)]"
                    placeholder="Enter content (supports markdown)..."
                    autoFocus
                  />
                </div>
                <div>
                  <label className="block text-xs font-medium text-[var(--text-muted)] mb-1">
                    Notes (optional)
                  </label>
                  <input
                    type="text"
                    value={newNotes}
                    onChange={(e) => setNewNotes(e.target.value)}
                    className="w-full px-3 py-2 border border-[var(--border)] rounded-sm bg-[var(--bg)] text-[var(--text)] text-sm focus:outline-none focus:border-[var(--primary)]"
                    placeholder="Add notes..."
                  />
                </div>
                {onRefine && (
                  <div>
                    <label className="block text-xs font-medium text-[var(--text-muted)] mb-1">
                      Refinement Instructions
                    </label>
                    <textarea
                      value={refinementInstructions}
                      onChange={(e) => setRefinementInstructions(e.target.value)}
                      rows={2}
                      className="w-full px-3 py-2 border border-[var(--border)] rounded-sm bg-[var(--bg)] text-[var(--text)] text-sm resize-none focus:outline-none focus:border-[var(--primary)]"
                      placeholder="Describe what you want (e.g., 'a principle about user privacy') or refine the draft above"
                    />
                  </div>
                )}
                {refinementError && (
                  <div className="text-sm text-red-600">{refinementError}</div>
                )}
                <div className="flex justify-end gap-2">
                  {onRefine && (
                    <button
                      type="button"
                      onClick={handleRefine}
                      disabled={!refinementInstructions.trim() || isRefining || isUpdating}
                      className="flex items-center gap-1 px-3 py-1.5 text-xs text-[var(--primary)] hover:bg-[var(--primary)]/10 rounded transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                      <FiZap className="w-3.5 h-3.5" />
                      {isRefining ? 'Refining...' : 'Refine with AI'}
                    </button>
                  )}
                  <button
                    type="button"
                    onClick={handleAddCancel}
                    className="px-3 py-1.5 text-xs text-[var(--text-muted)] hover:text-[var(--text)] transition-colors"
                    disabled={isRefining}
                  >
                    Cancel
                  </button>
                  <button
                    type="button"
                    onClick={handleAddSave}
                    disabled={!newContent.trim() || isUpdating || isRefining}
                    className="px-3 py-1.5 text-xs bg-[var(--primary)] text-white rounded hover:opacity-90 transition-opacity disabled:opacity-50"
                  >
                    Add
                  </button>
                </div>
              </div>
            )}
          </div>
        )}

        {/* Empty state */}
        {factors.length === 0 && !isAddingNew && (
          <div className="py-6 text-center text-sm text-[var(--text-muted)] border border-dashed border-[var(--border)] rounded-sm">
            No {title.toLowerCase()} defined yet.
            <br />
            <button
              type="button"
              onClick={onGenerateClick}
              className="mt-2 text-[var(--primary)] hover:underline"
            >
              Generate with AI
            </button>{' '}
            or{' '}
            <button
              type="button"
              onClick={() => setIsAddingNew(true)}
              className="text-[var(--primary)] hover:underline"
            >
              add manually
            </button>
          </div>
        )}
      </div>
    </div>
  );
}
