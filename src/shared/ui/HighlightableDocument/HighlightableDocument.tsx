import React, { useCallback, useRef, useMemo, useEffect, forwardRef, useImperativeHandle } from 'react';
import { renderWithHighlights, type Highlight } from './renderWithHighlights';
import './HighlightableDocument.css';

export interface HighlightableDocumentRef {
  containerRef: HTMLDivElement | null;
  highlightRefs: Map<string, HTMLElement>;
}

export interface HighlightableDocumentProps {
  /** The document text content */
  content: string;
  /** Highlights to render (quotes to find and mark) */
  highlights: Highlight[];
  /** Currently active highlight ID */
  activeHighlightId?: string | null;
  /** Called when a highlight is clicked */
  onHighlightClick?: (extractionId: string) => void;
  /** Called when text is pasted (for triggering analysis) */
  onPaste?: (text: string) => void;
  /** Placeholder text when content is empty */
  placeholder?: string;
  /** Additional CSS class */
  className?: string;
  /** Minimum paste length to trigger onPaste callback */
  minPasteLength?: number;
}

export const HighlightableDocument = forwardRef<HighlightableDocumentRef, HighlightableDocumentProps>(function HighlightableDocument({
  content,
  highlights,
  activeHighlightId = null,
  onHighlightClick,
  onPaste,
  placeholder = 'Paste content here...',
  className = '',
  minPasteLength = 50,
}: HighlightableDocumentProps, ref) {
  const containerRef = useRef<HTMLDivElement>(null);
  const highlightRefs = useRef<Map<string, HTMLElement>>(new Map());
  const pasteTimeoutRef = useRef<NodeJS.Timeout | null>(null);

  // Expose refs to parent via forwardRef
  useImperativeHandle(ref, () => ({
    containerRef: containerRef.current,
    highlightRefs: highlightRefs.current,
  }));

  // Cleanup paste timeout on unmount
  useEffect(() => {
    return () => {
      if (pasteTimeoutRef.current) {
        clearTimeout(pasteTimeoutRef.current);
      }
    };
  }, []);

  // Handle paste events
  const handlePaste = useCallback(
    (e: React.ClipboardEvent) => {
      const text = e.clipboardData?.getData('text/plain');
      if (text && text.length >= minPasteLength && onPaste) {
        // Clear any existing timeout
        if (pasteTimeoutRef.current) {
          clearTimeout(pasteTimeoutRef.current);
        }
        // Small delay to allow the paste to complete
        pasteTimeoutRef.current = setTimeout(() => {
          onPaste(text);
          pasteTimeoutRef.current = null;
        }, 100);
      }
    },
    [onPaste, minPasteLength]
  );

  // Handle highlight click
  const handleHighlightClick = useCallback(
    (extractionId: string) => {
      onHighlightClick?.(extractionId);
    },
    [onHighlightClick]
  );

  // Render content with highlights
  const renderedContent = useMemo(() => {
    if (!content) return null;

    return renderWithHighlights(
      content,
      highlights,
      activeHighlightId,
      handleHighlightClick
    );
  }, [content, highlights, activeHighlightId, handleHighlightClick]);

  // Populate highlight refs after render by querying data attributes
  useEffect(() => {
    if (!containerRef.current) return;

    const marks = containerRef.current.querySelectorAll<HTMLElement>('[data-highlight-id]');
    highlightRefs.current.clear();

    marks.forEach((mark) => {
      const ids = mark.dataset.highlightId?.split(',') ?? [];
      ids.forEach((id) => {
        if (id && !highlightRefs.current.has(id)) {
          highlightRefs.current.set(id, mark);
        }
      });
    });
  }, [renderedContent]);

  const isEmpty = !content || content.trim().length === 0;

  return (
    <div
      ref={containerRef}
      className={`highlightable-document ${className}`}
      onPaste={handlePaste}
      tabIndex={0}
    >
      {isEmpty ? (
        <div className="highlightable-document-placeholder">
          {placeholder}
        </div>
      ) : (
        <div className="highlightable-document-content">
          {renderedContent}
        </div>
      )}
    </div>
  );
});

export type { Highlight };
