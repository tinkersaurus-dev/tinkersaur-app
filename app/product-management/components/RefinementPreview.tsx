/**
 * Side-by-side preview component for comparing original and refined factor content
 */

import { MarkdownContent } from '~/core/components/ui/MarkdownContent';

interface RefinementPreviewProps {
  original: string;
  refined: string;
  onUseRefined: () => void;
  onEditRefined: () => void;
  onKeepOriginal: () => void;
  isGeneratedFromScratch?: boolean;
  isSaving?: boolean;
}

export function RefinementPreview({
  original,
  refined,
  onUseRefined,
  onEditRefined,
  onKeepOriginal,
  isGeneratedFromScratch = false,
  isSaving = false,
}: RefinementPreviewProps) {
  return (
    <div className="space-y-3">
      <div className="grid grid-cols-2 gap-4">
        {/* Original */}
        <div>
          <label className="block text-xs font-medium text-[var(--text-muted)] mb-1">
            {isGeneratedFromScratch ? 'Your Instructions' : 'Original'}
          </label>
          <div className="p-3 border border-[var(--border)] rounded-sm bg-[var(--bg-secondary)] min-h-[80px]">
            {isGeneratedFromScratch ? (
              <p className="text-sm text-[var(--text-muted)] italic">{original}</p>
            ) : (
              <MarkdownContent
                content={original}
                className="markdown-content markdown-content--compact text-sm"
              />
            )}
          </div>
        </div>

        {/* Refined */}
        <div>
          <label className="block text-xs font-medium text-[var(--text-muted)] mb-1">
            Refined
          </label>
          <div className="p-3 border border-[var(--primary)] rounded-sm bg-[var(--primary)]/5 min-h-[80px]">
            <MarkdownContent
              content={refined}
              className="markdown-content markdown-content--compact text-sm"
            />
          </div>
        </div>
      </div>

      {/* Actions */}
      <div className="flex justify-end gap-2">
        <button
          type="button"
          onClick={onKeepOriginal}
          disabled={isSaving}
          className="px-3 py-1.5 text-xs text-[var(--text-muted)] hover:text-[var(--text)] transition-colors disabled:opacity-50"
        >
          Keep Original
        </button>
        <button
          type="button"
          onClick={onEditRefined}
          disabled={isSaving}
          className="px-3 py-1.5 text-xs text-[var(--text)] hover:text-[var(--primary)] transition-colors disabled:opacity-50"
        >
          Edit Refined
        </button>
        <button
          type="button"
          onClick={onUseRefined}
          disabled={isSaving}
          className="px-3 py-1.5 text-xs bg-[var(--primary)] text-white rounded hover:opacity-90 transition-opacity disabled:opacity-50"
        >
          {isSaving ? 'Saving...' : 'Use Refined'}
        </button>
      </div>
    </div>
  );
}
