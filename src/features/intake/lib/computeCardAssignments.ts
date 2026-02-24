import type { Extraction, DocumentHighlight } from '../model/types';

export interface CardAssignment {
  paragraphIndex: number;
  extractionId: string;
}

interface ParagraphBoundary {
  index: number;
  start: number;
  end: number;
}

/**
 * Normalize a single character for matching.
 * Matches the logic in renderWithHighlights.tsx
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
 * Returns the START position in the ORIGINAL content.
 * Handles whitespace normalization (multiple spaces/newlines match single space in quote).
 */
function findNormalizedMatch(content: string, quote: string): number | null {
  if (!quote || quote.length === 0) return null;

  // Normalize quote and collapse its whitespace
  const quoteNorm = quote
    .toLowerCase()
    .replace(/[""„‟''‚‛`'"]/g, "'")
    .replace(/\s+/g, ' ')
    .trim();

  if (quoteNorm.length === 0) return null;

  // Slide through content looking for match
  for (let contentIdx = 0; contentIdx < content.length; contentIdx++) {
    // Skip leading whitespace in content
    if (/\s/.test(content[contentIdx])) continue;

    // Try to match starting at this position
    let cIdx = contentIdx;
    let qIdx = 0;

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
      return contentIdx;
    }
  }

  return null;
}

/**
 * Split a quote on ellipsis markers ("..." or "\u2026").
 * Returns segments that should each be matched independently.
 */
function splitOnEllipsis(quote: string): string[] {
  const segments = quote.split(/\s*(?:\.{3}|\u2026)\s*/).filter(s => s.length > 0);
  return segments.length > 0 ? segments : [quote];
}

/**
 * Find a quote in content, handling "..." ellipsis snipping.
 * For quotes with "...", matches the first segment and returns its position.
 */
function findQuoteMatch(content: string, quote: string): number | null {
  const segments = splitOnEllipsis(quote);
  return findNormalizedMatch(content, segments[0]);
}

/**
 * Calculate paragraph boundaries from content.
 * Each paragraph is separated by '\n'.
 */
function getParagraphBoundaries(content: string): ParagraphBoundary[] {
  const paragraphs = content.split('\n');
  const boundaries: ParagraphBoundary[] = [];
  let offset = 0;

  for (let i = 0; i < paragraphs.length; i++) {
    boundaries.push({
      index: i,
      start: offset,
      end: offset + paragraphs[i].length,
    });
    offset += paragraphs[i].length + 1; // +1 for the newline
  }

  return boundaries;
}

/**
 * Find which paragraph contains a given character position.
 */
function findParagraphForPosition(
  position: number,
  boundaries: ParagraphBoundary[]
): number {
  for (const boundary of boundaries) {
    if (position >= boundary.start && position <= boundary.end) {
      return boundary.index;
    }
  }
  // Fallback to last paragraph
  return boundaries.length - 1;
}

export interface ComputeCardAssignmentsOptions {
  content: string;
  extractions: Map<string, Extraction>;
  highlights: Map<string, DocumentHighlight>;
}

/**
 * Compute which paragraph each extraction card should appear after.
 *
 * For each extraction:
 * 1. Find all its associated highlights (quotes)
 * 2. Find the position of each quote in the content
 * 3. Take the earliest quote position
 * 4. Determine which paragraph contains that position
 *
 * Returns assignments sorted by paragraph index, then by extraction order.
 */
export function computeCardAssignments({
  content,
  extractions,
  highlights,
}: ComputeCardAssignmentsOptions): CardAssignment[] {
  if (!content || extractions.size === 0) {
    return [];
  }

  const boundaries = getParagraphBoundaries(content);
  const assignments: CardAssignment[] = [];

  // Group highlights by extraction ID
  const highlightsByExtraction = new Map<string, DocumentHighlight[]>();
  highlights.forEach((highlight) => {
    const existing = highlightsByExtraction.get(highlight.extractionId) || [];
    existing.push(highlight);
    highlightsByExtraction.set(highlight.extractionId, existing);
  });

  // For each extraction, find the paragraph for its first quote
  // Note: Personas are excluded since they appear in the sidebar, not inline
  extractions.forEach((extraction) => {
    // Skip personas - they display in the sidebar instead of inline cards
    if (extraction.type === 'personas') {
      return;
    }

    const extractionHighlights = highlightsByExtraction.get(extraction.id) || [];
    if (extractionHighlights.length === 0) {
      return; // Skip extractions with no highlights
    }

    // Find position of each quote and take the earliest
    let earliestPosition = Infinity;

    for (const highlight of extractionHighlights) {
      const position = findQuoteMatch(content, highlight.quote);
      if (position !== null && position < earliestPosition) {
        earliestPosition = position;
      }
    }

    if (earliestPosition !== Infinity) {
      const paragraphIndex = findParagraphForPosition(earliestPosition, boundaries);
      assignments.push({
        paragraphIndex,
        extractionId: extraction.id,
      });
    }
  });

  // Sort by paragraph index (extractions in same paragraph keep Map iteration order)
  assignments.sort((a, b) => a.paragraphIndex - b.paragraphIndex);

  return assignments;
}

/**
 * Group card assignments by paragraph index for efficient lookup.
 */
export function groupAssignmentsByParagraph(
  assignments: CardAssignment[]
): Map<number, string[]> {
  const map = new Map<number, string[]>();

  for (const assignment of assignments) {
    const existing = map.get(assignment.paragraphIndex) || [];
    existing.push(assignment.extractionId);
    map.set(assignment.paragraphIndex, existing);
  }

  return map;
}
