/**
 * Modal for generating and previewing overview section content
 * Auto-starts generation on open, shows preview with option to apply or regenerate
 */

import { useEffect, useCallback, useRef } from 'react';
import { Modal } from '~/core/components/ui/Modal';
import { MarkdownContent } from '~/core/components/ui/MarkdownContent';
import type { OverviewSectionType } from '~/design-studio/lib/llm/prompts/overview-prompts';
import { getSectionDisplayName } from '~/design-studio/lib/llm/prompts/overview-prompts';

interface OverviewGenerateModalProps {
  open: boolean;
  onClose: () => void;
  onApply: (content: string) => void;
  sectionType: OverviewSectionType;
  existingContent: string;
  onGenerate: (sectionType: OverviewSectionType, existingContent?: string) => Promise<string>;
  isGenerating: boolean;
  generatedContent: string | null;
  error: string | null;
  onReset: () => void;
}

export function OverviewGenerateModal({
  open,
  onClose,
  onApply,
  sectionType,
  existingContent,
  onGenerate,
  isGenerating,
  generatedContent,
  error,
  onReset,
}: OverviewGenerateModalProps) {
  // Reset and auto-start generation when modal opens
  // We use a ref to track if we've started generation for this modal instance
  const hasStartedRef = useRef(false);

  useEffect(() => {
    if (open && !hasStartedRef.current) {
      hasStartedRef.current = true;
      // Reset first, then generate after a microtask to ensure state is cleared
      onReset();
      Promise.resolve().then(() => {
        onGenerate(sectionType, existingContent || undefined).catch(() => {
          // Error is handled by the hook and displayed in UI
        });
      });
    } else if (!open) {
      // Reset the ref when modal closes
      hasStartedRef.current = false;
    }
  }, [open, sectionType, existingContent, onReset, onGenerate]);

  const handleApply = useCallback(() => {
    if (generatedContent) {
      onApply(generatedContent);
      onClose();
    }
  }, [generatedContent, onApply, onClose]);

  const handleRegenerate = useCallback(() => {
    onReset();
    // Trigger regeneration after microtask to ensure state is cleared
    Promise.resolve().then(() => {
      onGenerate(sectionType, existingContent || undefined).catch(() => {
        // Error handled by hook
      });
    });
  }, [onReset, onGenerate, sectionType, existingContent]);

  const sectionTitle = getSectionDisplayName(sectionType);

  // Custom footer based on state
  const footer = (
    <div className="flex items-center justify-between w-full">
      <div>
        {generatedContent && !isGenerating && !error && (
          <button
            type="button"
            onClick={handleRegenerate}
            className="text-sm text-[var(--text-muted)] hover:text-[var(--text)] transition-colors"
          >
            Regenerate
          </button>
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
          disabled={!generatedContent || isGenerating}
          className="px-4 h-10 rounded-sm bg-[var(--primary)] text-white hover:opacity-90 transition-all disabled:opacity-50 disabled:cursor-not-allowed"
        >
          Apply
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
              <p className="text-sm text-[var(--text-muted)]">Generating content...</p>
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

        {/* Generated content preview */}
        {generatedContent && !isGenerating && (
          <div>
            <label className="block text-sm font-medium text-[var(--text)] mb-2">
              Preview
            </label>
            <div className="p-4 border border-[var(--border)] rounded-sm bg-[var(--bg)] max-h-80 overflow-y-auto">
              <MarkdownContent
                content={generatedContent}
                className="markdown-content markdown-content--compact"
              />
            </div>
          </div>
        )}

        {/* Show existing content hint if provided */}
        {existingContent && !generatedContent && !isGenerating && !error && (
          <p className="text-xs text-[var(--text-muted)]">
            Using your existing content as guidance for generation...
          </p>
        )}
      </div>
    </Modal>
  );
}
