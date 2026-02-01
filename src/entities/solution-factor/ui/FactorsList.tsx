/**
 * List component for displaying and managing factors of a specific type
 */

import { useState, useCallback } from 'react';
import { FiPlus, FiZap } from 'react-icons/fi';
import { Input, Button } from '@/shared/ui';
import { FactorCard } from './FactorCard';
import { RefinementPreview } from '@/features/llm-generation';
import type {
  SolutionFactor,
  SolutionFactorType,
  UpdateSolutionFactorDto,
} from '@/entities/solution-factor';
import { FACTOR_TYPE_LABELS } from '@/entities/solution-factor';

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
            <Button
              variant="text"
              size="small"
              onClick={onGenerateClick}
              disabled={isGenerating}
              icon={<FiZap className="w-3.5 h-3.5" />}
            >
              {isGenerating ? 'Generating...' : 'Generate'}
            </Button>
          )}
          <Button
            variant="text"
            size="small"
            onClick={() => setIsAddingNew(true)}
            disabled={isAddingNew}
            icon={<FiPlus className="w-3.5 h-3.5" />}
          >
            Add
          </Button>
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
                  <Input.TextArea
                    value={newContent}
                    onChange={(e) => setNewContent(e.target.value)}
                    rows={3}
                    size="small"
                    placeholder="Enter content (supports markdown)..."
                    autoFocus
                  />
                </div>
                <div>
                  <label className="block text-xs font-medium text-[var(--text-muted)] mb-1">
                    Notes (optional)
                  </label>
                  <Input
                    type="text"
                    value={newNotes}
                    onChange={(e) => setNewNotes(e.target.value)}
                    size="small"
                    placeholder="Add notes..."
                  />
                </div>
                {onRefine && (
                  <div>
                    <label className="block text-xs font-medium text-[var(--text-muted)] mb-1">
                      Refinement Instructions
                    </label>
                    <Input.TextArea
                      value={refinementInstructions}
                      onChange={(e) => setRefinementInstructions(e.target.value)}
                      rows={2}
                      size="small"
                      placeholder="Describe what you want (e.g., 'a principle about user privacy') or refine the draft above"
                    />
                  </div>
                )}
                {refinementError && (
                  <div className="text-sm text-red-600">{refinementError}</div>
                )}
                <div className="flex justify-end gap-2">
                  {onRefine && (
                    <Button
                      variant="text"
                      size="small"
                      onClick={handleRefine}
                      disabled={!refinementInstructions.trim() || isRefining || isUpdating}
                      icon={<FiZap className="w-3.5 h-3.5" />}
                    >
                      {isRefining ? 'Refining...' : 'Refine with AI'}
                    </Button>
                  )}
                  <Button
                    variant="text"
                    size="small"
                    onClick={handleAddCancel}
                    disabled={isRefining}
                  >
                    Cancel
                  </Button>
                  <Button
                    variant="primary"
                    size="small"
                    onClick={handleAddSave}
                    disabled={!newContent.trim() || isUpdating || isRefining}
                  >
                    Add
                  </Button>
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
            <Button
              variant="link"
              size="small"
              onClick={onGenerateClick}
              className="mt-2"
            >
              Generate with AI
            </Button>{' '}
            or{' '}
            <Button
              variant="link"
              size="small"
              onClick={() => setIsAddingNew(true)}
            >
              add manually
            </Button>
          </div>
        )}
      </div>
    </div>
  );
}
