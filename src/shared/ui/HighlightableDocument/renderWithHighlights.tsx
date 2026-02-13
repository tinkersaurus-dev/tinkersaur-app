import React from 'react';

export interface Highlight {
  id: string;
  quote: string;
  extractionId: string;
  type?: string;
}

interface HighlightPosition {
  highlight: Highlight;
  start: number;
  end: number;
}

/**
 * Normalize a single character for matching.
 */
function normalizeChar(char: string): string {
  // Normalize quote marks
  if (/[""„‟''‚‛`'"]/.test(char)) return "'";
  // Normalize whitespace to space
  if (/\s/.test(char)) return ' ';
  return char.toLowerCase();
}

/**
 * Find a quote in content using normalized matching.
 * Returns the START and END positions in the ORIGINAL content.
 * Handles whitespace normalization (multiple spaces/newlines match single space in quote).
 */
function findNormalizedMatch(
  content: string,
  quote: string,
  startIndex: number = 0
): { start: number; end: number } | null {
  if (!quote || quote.length === 0) return null;

  // Normalize quote and collapse its whitespace
  const quoteNorm = quote
    .toLowerCase()
    .replace(/[""„‟''‚‛`'"]/g, "'")
    .replace(/\s+/g, ' ')
    .trim();

  if (quoteNorm.length === 0) return null;

  // Slide through content looking for match
  for (let contentIdx = startIndex; contentIdx < content.length; contentIdx++) {
    // Skip leading whitespace in content
    if (/\s/.test(content[contentIdx])) continue;

    // Try to match starting at this position
    let cIdx = contentIdx;
    let qIdx = 0;
    const matchStart = contentIdx;

    while (qIdx < quoteNorm.length && cIdx < content.length) {
      const qChar = quoteNorm[qIdx];
      const cChar = normalizeChar(content[cIdx]);

      if (qChar === ' ') {
        // Quote has a space - content must have at least one whitespace char
        if (!/\s/.test(content[cIdx])) break;
        // Skip all whitespace in content
        while (cIdx < content.length && /\s/.test(content[cIdx])) {
          cIdx++;
        }
        qIdx++;
      } else if (qChar === cChar) {
        cIdx++;
        qIdx++;
      } else {
        break;
      }
    }

    if (qIdx === quoteNorm.length) {
      // Full match found
      return { start: matchStart, end: cIdx };
    }
  }

  return null;
}

/**
 * Find all highlight positions in the content.
 * Returns sorted, non-overlapping positions (first match wins for duplicates).
 * Uses normalized matching to handle LLM modifications:
 * - Case differences (capitalizing quote starts)
 * - Quote mark variations (" vs ' vs curly quotes)
 */
function findHighlightPositions(
  content: string,
  highlights: Highlight[]
): HighlightPosition[] {
  const positions: HighlightPosition[] = [];
  const failures: Array<{ type: string; quote: string }> = [];

  for (const highlight of highlights) {
    const match = findNormalizedMatch(content, highlight.quote, 0);
    if (match) {
      positions.push({
        highlight,
        start: match.start,
        end: match.end,
      });
    } else {
      // Log each failure with full quote
      console.warn(`[Highlight FAIL] ${highlight.type}:`, highlight.quote);
      failures.push({ type: highlight.type || 'unknown', quote: highlight.quote });
    }
  }

  // Summary at the end
  if (failures.length > 0) {
    console.warn(`[Highlight] Summary: ${failures.length}/${highlights.length} quotes failed to match`);
  }

  // Sort by start position
  return positions.sort((a, b) => a.start - b.start);
}

/**
 * Renders a segment of text with highlights as React elements.
 * Handles overlapping highlights by rendering text once.
 */
function renderSegmentWithHighlights(
  segment: string,
  segmentStart: number,
  positions: HighlightPosition[],
  activeHighlightId: string | null,
  onHighlightClick: (extractionId: string) => void
): React.ReactNode[] {
  const segmentEnd = segmentStart + segment.length;
  const elements: React.ReactNode[] = [];
  let lastEnd = segmentStart;

  // Filter positions that overlap with this segment
  const relevantPositions = positions.filter(
    (pos) => pos.start < segmentEnd && pos.end > segmentStart
  );

  // Group overlapping positions - positions that share the same start point
  // will share a single <mark> element
  let i = 0;
  while (i < relevantPositions.length) {
    const pos = relevantPositions[i];
    const highlightStart = Math.max(pos.start, segmentStart);
    const highlightEnd = Math.min(pos.end, segmentEnd);

    // Skip if this highlight is already covered by a previous one
    if (highlightStart < lastEnd) {
      // This highlight overlaps with the previous one - just register the ref
      // to point to the same element (handled via shared key below)
      i++;
      continue;
    }

    // Add text before this highlight
    if (highlightStart > lastEnd) {
      const textStart = lastEnd - segmentStart;
      const textEnd = highlightStart - segmentStart;
      elements.push(
        <span key={`text-${lastEnd}`}>{segment.slice(textStart, textEnd)}</span>
      );
    }

    // Find all highlights that overlap with this one (same or contained range)
    const overlappingHighlights = [pos];
    for (let j = i + 1; j < relevantPositions.length; j++) {
      const nextPos = relevantPositions[j];
      const nextStart = Math.max(nextPos.start, segmentStart);
      if (nextStart < highlightEnd) {
        overlappingHighlights.push(nextPos);
      } else {
        break;
      }
    }

    // Check if any of the overlapping highlights is active
    const isActive = overlappingHighlights.some(h => h.highlight.id === activeHighlightId);
    const markStart = highlightStart - segmentStart;
    const markEnd = highlightEnd - segmentStart;

    // Render single mark for all overlapping highlights
    // Refs are populated via useEffect in the component using data-highlight-id
    elements.push(
      <mark
        key={`mark-${highlightStart}`}
        className={`highlight-mark ${isActive ? 'active' : ''}`}
        data-highlight-id={overlappingHighlights.map(h => h.highlight.id).join(',')}
        data-extraction-id={overlappingHighlights.map(h => h.highlight.extractionId).join(',')}
        data-type={pos.highlight.type}
        onClick={(e) => {
          e.stopPropagation();
          // Click triggers first extraction
          onHighlightClick(pos.highlight.extractionId);
        }}
      >
        {segment.slice(markStart, markEnd)}
      </mark>
    );

    lastEnd = highlightEnd;
    i += overlappingHighlights.length;
  }

  // Add any remaining text after the last highlight
  if (lastEnd < segmentEnd) {
    const textStart = lastEnd - segmentStart;
    elements.push(
      <span key={`text-${lastEnd}`}>{segment.slice(textStart)}</span>
    );
  }

  return elements;
}

/**
 * Renders document content with highlighted quotes as React elements.
 * Splits content by newlines for better paragraph spacing.
 * Note: Highlight refs should be populated via useEffect in the parent component
 * by querying elements with data-highlight-id attributes.
 */
export function renderWithHighlights(
  content: string,
  highlights: Highlight[],
  activeHighlightId: string | null,
  onHighlightClick: (extractionId: string) => void
): React.ReactNode[] {
  if (!content) return [];

  const positions = findHighlightPositions(content, highlights);
  const lines = content.split('\n');
  const elements: React.ReactNode[] = [];
  let charOffset = 0;

  for (let i = 0; i < lines.length; i++) {
    const line = lines[i];
    const lineElements = renderSegmentWithHighlights(
      line,
      charOffset,
      positions,
      activeHighlightId,
      onHighlightClick
    );

    // Wrap each line in a div for spacing (empty lines get min-height)
    elements.push(
      <div key={`line-${i}`} className="document-line">
        {lineElements.length > 0 ? lineElements : '\u00A0'}
      </div>
    );

    // Account for the newline character
    charOffset += line.length + 1;
  }

  return elements;
}
