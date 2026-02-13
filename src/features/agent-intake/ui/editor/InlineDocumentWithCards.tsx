import React, { useCallback, useRef, useMemo, Fragment } from 'react';
import { renderWithHighlights, type Highlight } from '@/shared/ui/HighlightableDocument/renderWithHighlights';
import { useAgentIntakeStore } from '../../model/useAgentIntakeStore';
import { useAgentLoop } from '../../lib/useAgentLoop';
import { computeCardAssignments, groupAssignmentsByParagraph } from '../../lib/computeCardAssignments';
import { InlineCardGroup } from './InlineCardGroup';
import '@/shared/ui/HighlightableDocument/HighlightableDocument.css';

interface InlineDocumentWithCardsProps {
  className?: string;
}

const MIN_PASTE_LENGTH = 50;

/**
 * Renders the document with entity cards inserted inline after paragraphs.
 * Replaces the two-column layout (IntakeEditor + ExtractionSidebar).
 */
export function InlineDocumentWithCards({ className = '' }: InlineDocumentWithCardsProps) {
  const containerRef = useRef<HTMLDivElement>(null);

  // Store state
  const phase = useAgentIntakeStore((state) => state.phase);
  const documentContent = useAgentIntakeStore((state) => state.documentContent);
  const highlights = useAgentIntakeStore((state) => state.highlights);
  const extractions = useAgentIntakeStore((state) => state.extractions);
  const activeHighlightId = useAgentIntakeStore((state) => state.activeHighlightId);
  const setActiveExtraction = useAgentIntakeStore((state) => state.setActiveExtraction);

  const { detectType } = useAgentLoop();

  // Convert store highlights to array format
  const highlightArray: Highlight[] = useMemo(() => {
    return Array.from(highlights.values()).map((h) => ({
      id: h.id,
      quote: h.quote,
      extractionId: h.extractionId,
      type: h.type,
    }));
  }, [highlights]);

  // Compute which cards go after which paragraphs
  const cardsByParagraph = useMemo(() => {
    const assignments = computeCardAssignments({
      content: documentContent,
      extractions,
      highlights,
    });
    return groupAssignmentsByParagraph(assignments);
  }, [documentContent, extractions, highlights]);

  // Handle paste to trigger detection
  const handlePaste = useCallback(
    (e: React.ClipboardEvent) => {
      const text = e.clipboardData?.getData('text/plain');
      if (text && text.length >= MIN_PASTE_LENGTH && phase === 'idle') {
        setTimeout(() => {
          detectType(text);
        }, 100);
      }
    },
    [phase, detectType]
  );

  // Handle highlight click
  const handleHighlightClick = useCallback(
    (extractionId: string) => {
      setActiveExtraction(extractionId);
    },
    [setActiveExtraction]
  );

  // Render document content with cards interleaved
  const renderedContent = useMemo(() => {
    if (!documentContent) return null;

    // Get rendered paragraphs from renderWithHighlights
    const paragraphElements = renderWithHighlights(
      documentContent,
      highlightArray,
      activeHighlightId,
      handleHighlightClick
    );

    // Interleave cards after appropriate paragraphs
    const elements: React.ReactNode[] = [];

    paragraphElements.forEach((paragraphElement, index) => {
      // Add the paragraph
      elements.push(
        <Fragment key={`para-${index}`}>
          {paragraphElement}
        </Fragment>
      );

      // Check if there are cards to insert after this paragraph
      const cardIds = cardsByParagraph.get(index);
      if (cardIds && cardIds.length > 0) {
        elements.push(
          <InlineCardGroup
            key={`cards-${index}`}
            extractionIds={cardIds}
            extractions={extractions}
          />
        );
      }
    });

    return elements;
  }, [documentContent, highlightArray, activeHighlightId, handleHighlightClick, cardsByParagraph, extractions]);

  const isEmpty = !documentContent || documentContent.trim().length === 0;

  return (
    <div
      ref={containerRef}
      className={`highlightable-document ${className}`}
      onPaste={handlePaste}
      tabIndex={0}
    >
      {isEmpty ? (
        <div className="highlightable-document-placeholder">
          Click and paste text to get started.
        </div>
      ) : (
        <div className="highlightable-document-content">
          {renderedContent}
        </div>
      )}
    </div>
  );
}
