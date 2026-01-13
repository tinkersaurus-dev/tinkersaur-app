/**
 * Modal for generating and previewing solution factors
 * Auto-starts generation on open, shows preview with option to select which factors to apply
 */

import { useEffect, useCallback, useRef, useState, useMemo } from 'react';
import { FiCheck, FiZap } from 'react-icons/fi';
import { Modal } from '~/core/components/ui/Modal';
import { MarkdownContent } from '~/core/components/ui/MarkdownContent';
import type { SolutionFactorType } from '~/core/entities/product-management/types';
import { FACTOR_TYPE_LABELS } from '~/core/entities/product-management/types';
import type { GeneratedFactorItem } from '~/design-studio/lib/llm/overview-generator-api';

interface FactorGenerateModalProps {
  open: boolean;
  onClose: () => void;
  onApply: (factors: GeneratedFactorItem[]) => void;
  factorType: SolutionFactorType;
  onGenerate: (factorType: SolutionFactorType) => Promise<GeneratedFactorItem[]>;
  isGenerating: boolean;
  generatedFactors: GeneratedFactorItem[] | null;
  error: string | null;
  onReset: () => void;
}

export function FactorGenerateModal({
  open,
  onClose,
  onApply,
  factorType,
  onGenerate,
  isGenerating,
  generatedFactors,
  error,
  onReset,
}: FactorGenerateModalProps) {
  // Track selected factors (by index) - null means "use default selection (all)"
  // Also track the open state to reset selection when modal reopens
  const [selectionState, setSelectionState] = useState<{
    indices: Set<number> | null;
    openKey: boolean;
  }>({ indices: null, openKey: open });

  // Reset selection state when modal open state changes
  const selectedIndices = selectionState.openKey === open ? selectionState.indices : null;
  const setSelectedIndices = useCallback((indices: Set<number> | null) => {
    setSelectionState({ indices, openKey: open });
  }, [open]);

  // Compute effective selected indices: if null, select all generated factors
  const effectiveSelectedIndices = useMemo(() => {
    if (selectedIndices !== null) {
      return selectedIndices;
    }
    if (generatedFactors && generatedFactors.length > 0) {
      return new Set(generatedFactors.map((_, i) => i));
    }
    return new Set<number>();
  }, [selectedIndices, generatedFactors]);

  // Reset and auto-start generation when modal opens
  const hasStartedRef = useRef(false);

  useEffect(() => {
    if (open && !hasStartedRef.current) {
      hasStartedRef.current = true;
      onReset();
      Promise.resolve().then(() => {
        onGenerate(factorType).catch(() => {
          // Error is handled by the hook and displayed in UI
        });
      });
    } else if (!open) {
      hasStartedRef.current = false;
    }
  }, [open, factorType, onReset, onGenerate]);

  const handleToggleSelection = useCallback((index: number) => {
    const next = new Set(effectiveSelectedIndices);
    if (next.has(index)) {
      next.delete(index);
    } else {
      next.add(index);
    }
    setSelectedIndices(next);
  }, [effectiveSelectedIndices, setSelectedIndices]);

  const handleSelectAll = useCallback(() => {
    if (generatedFactors) {
      setSelectedIndices(new Set(generatedFactors.map((_, i) => i)));
    }
  }, [generatedFactors, setSelectedIndices]);

  const handleSelectNone = useCallback(() => {
    setSelectedIndices(new Set<number>());
  }, [setSelectedIndices]);

  const handleApply = useCallback(() => {
    if (generatedFactors) {
      const selectedFactors = generatedFactors.filter((_, i) => effectiveSelectedIndices.has(i));
      if (selectedFactors.length > 0) {
        onApply(selectedFactors);
        onClose();
      }
    }
  }, [generatedFactors, effectiveSelectedIndices, onApply, onClose]);

  const handleRegenerate = useCallback(() => {
    onReset();
    setSelectedIndices(null); // Reset to default (all selected)
    Promise.resolve().then(() => {
      onGenerate(factorType).catch(() => {
        // Error handled by hook
      });
    });
  }, [onReset, onGenerate, factorType, setSelectedIndices]);

  const sectionTitle = FACTOR_TYPE_LABELS[factorType];
  const selectedCount = effectiveSelectedIndices.size;
  const totalCount = generatedFactors?.length ?? 0;

  // Custom footer based on state
  const footer = (
    <div className="flex items-center justify-between w-full">
      <div className="flex items-center gap-4">
        {generatedFactors && !isGenerating && !error && (
          <>
            <button
              type="button"
              onClick={handleRegenerate}
              className="flex items-center gap-1 text-sm text-[var(--text-muted)] hover:text-[var(--text)] transition-colors"
            >
              <FiZap className="w-3.5 h-3.5" />
              Regenerate
            </button>
            <span className="text-sm text-[var(--text-muted)]">
              {selectedCount} of {totalCount} selected
            </span>
          </>
        )}
      </div>
      <div className="flex gap-3">
        <button
          type="button"
          onClick={onClose}
          className="px-4 h-10 rounded-sm border border-[var(--border)] text-[var(--text)] hover:border-[var(--primary)] hover:text-[var(--primary)] transition-all disabled:opacity-50"
          disabled={isGenerating}
        >
          Cancel
        </button>
        <button
          type="button"
          onClick={handleApply}
          disabled={selectedCount === 0 || isGenerating}
          className="px-4 h-10 rounded-sm bg-[var(--primary)] text-white hover:opacity-90 transition-all disabled:opacity-50 disabled:cursor-not-allowed"
        >
          Add {selectedCount > 0 ? `(${selectedCount})` : ''}
        </button>
      </div>
    </div>
  );

  return (
    <Modal
      open={open}
      onCancel={onClose}
      title={`Generate ${sectionTitle}`}
      width={700}
      footer={footer}
    >
      <div className="space-y-4">
        {/* Loading state */}
        {isGenerating && (
          <div className="flex items-center justify-center py-12">
            <div className="flex flex-col items-center gap-3">
              <div className="w-8 h-8 border-2 border-[var(--primary)] border-t-transparent rounded-full animate-spin" />
              <p className="text-sm text-[var(--text-muted)]">Generating {sectionTitle.toLowerCase()}...</p>
            </div>
          </div>
        )}

        {/* Error state */}
        {error && !isGenerating && (
          <div className="p-4 bg-red-50 border border-red-200 rounded-sm">
            <p className="text-sm text-red-700">{error}</p>
            <button
              type="button"
              onClick={handleRegenerate}
              className="mt-2 text-sm text-red-600 hover:text-red-800 underline"
            >
              Try again
            </button>
          </div>
        )}

        {/* Generated factors preview */}
        {generatedFactors && generatedFactors.length > 0 && !isGenerating && (
          <div>
            <div className="flex items-center justify-between mb-2">
              <label className="block text-sm font-medium text-[var(--text)]">
                Select factors to add
              </label>
              <div className="flex gap-2 text-xs">
                <button
                  type="button"
                  onClick={handleSelectAll}
                  className="text-[var(--primary)] hover:underline"
                >
                  Select All
                </button>
                <span className="text-[var(--text-muted)]">|</span>
                <button
                  type="button"
                  onClick={handleSelectNone}
                  className="text-[var(--text-muted)] hover:text-[var(--text)]"
                >
                  Clear
                </button>
              </div>
            </div>
            <div className="space-y-2 max-h-80 overflow-y-auto">
              {generatedFactors.map((factor, index) => (
                <button
                  key={index}
                  type="button"
                  onClick={() => handleToggleSelection(index)}
                  className={`w-full text-left p-3 border rounded-sm transition-all ${
                    effectiveSelectedIndices.has(index)
                      ? 'border-[var(--primary)] bg-[var(--primary)]/5'
                      : 'border-[var(--border)] bg-[var(--bg)] hover:border-[var(--text-muted)]'
                  }`}
                >
                  <div className="flex items-start gap-3">
                    <div
                      className={`flex-shrink-0 w-5 h-5 rounded-sm border-2 flex items-center justify-center transition-colors ${
                        effectiveSelectedIndices.has(index)
                          ? 'bg-[var(--primary)] border-[var(--primary)]'
                          : 'border-[var(--border)]'
                      }`}
                    >
                      {effectiveSelectedIndices.has(index) && (
                        <FiCheck className="w-3 h-3 text-white" />
                      )}
                    </div>
                    <div className="flex-1 min-w-0">
                      <MarkdownContent
                        content={factor.content}
                        className="markdown-content markdown-content--compact text-sm"
                      />
                      {factor.notes && (
                        <p className="mt-1 text-xs text-[var(--text-muted)] italic">
                          {factor.notes}
                        </p>
                      )}
                    </div>
                  </div>
                </button>
              ))}
            </div>
          </div>
        )}
      </div>
    </Modal>
  );
}
