/**
 * Side-by-side preview component for comparing original and refined factor content
 */

import { MarkdownContent } from '@/shared/ui/MarkdownContent';
import { Button } from '@/shared/ui';

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
        <Button
          variant="text"
          size="small"
          onClick={onKeepOriginal}
          disabled={isSaving}
        >
          Keep Original
        </Button>
        <Button
          variant="text"
          size="small"
          onClick={onEditRefined}
          disabled={isSaving}
        >
          Edit Refined
        </Button>
        <Button
          variant="primary"
          size="small"
          onClick={onUseRefined}
          disabled={isSaving}
        >
          {isSaving ? 'Saving...' : 'Use Refined'}
        </Button>
      </div>
    </div>
  );
}
