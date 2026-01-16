/**
 * SpecificationDiffView Component
 * Displays an inline diff between the current specification and a version's specification
 * Uses word-level diffing with green highlighting for additions and red strikethrough for deletions
 */

import { useMemo } from 'react';
import { diff_match_patch, DIFF_DELETE, DIFF_INSERT, DIFF_EQUAL } from 'diff-match-patch';

export interface SpecificationDiffViewProps {
  currentSpec: string;
  versionSpec: string;
}

/**
 * Compute word-level diff and render as HTML with inline highlighting and line numbers
 */
export function SpecificationDiffView({ currentSpec, versionSpec }: SpecificationDiffViewProps) {
  const diffLines = useMemo(() => {
    const dmp = new diff_match_patch();

    // Compute character-level diff
    const diffs = dmp.diff_main(versionSpec, currentSpec);

    // Clean up the diff for better readability
    dmp.diff_cleanupSemantic(diffs);

    // Build the full HTML string first, then split by newlines
    const htmlParts: string[] = [];

    for (const [operation, text] of diffs) {
      // Escape HTML entities
      const escapedText = text
        .replace(/&/g, '&amp;')
        .replace(/</g, '&lt;')
        .replace(/>/g, '&gt;')
        .replace(/"/g, '&quot;')
        .replace(/'/g, '&#39;');

      if (operation === DIFF_DELETE) {
        // Content that was in version but removed in current (red strikethrough)
        // Split by newlines and wrap each segment
        const segments = escapedText.split('\n');
        segments.forEach((segment, i) => {
          if (segment) {
            htmlParts.push(`<span class="diff-remove">${segment}</span>`);
          }
          if (i < segments.length - 1) {
            htmlParts.push('\n');
          }
        });
      } else if (operation === DIFF_INSERT) {
        // Content that was added in current (green highlight)
        const segments = escapedText.split('\n');
        segments.forEach((segment, i) => {
          if (segment) {
            htmlParts.push(`<span class="diff-add">${segment}</span>`);
          }
          if (i < segments.length - 1) {
            htmlParts.push('\n');
          }
        });
      } else if (operation === DIFF_EQUAL) {
        // Unchanged content - preserve newlines
        htmlParts.push(escapedText);
      }
    }

    // Join and split by newlines to get individual lines
    const fullHtml = htmlParts.join('');
    return fullHtml.split('\n');
  }, [currentSpec, versionSpec]);

  return (
    <div className="markdown-content markdown-content--compact specification-diff">
      <div className="diff-lines font-mono text-xs">
        {diffLines.map((lineHtml, index) => (
          <div key={index} className="diff-line">
            <span className="line-number">{index + 1}</span>
            <span
              className="line-content"
              dangerouslySetInnerHTML={{ __html: lineHtml || '&nbsp;' }}
            />
          </div>
        ))}
      </div>
      <style>{`
        .specification-diff .diff-lines {
          display: flex;
          flex-direction: column;
        }
        .specification-diff .diff-line {
          display: flex;
          min-height: 1.4em;
          line-height: 1.4em;
        }
        .specification-diff .line-number {
          width: 3rem;
          text-align: right;
          padding-right: 1rem;
          color: var(--text-muted);
          user-select: none;
          flex-shrink: 0;
        }
        .specification-diff .line-content {
          flex: 1;
          white-space: pre-wrap;
          word-break: break-word;
        }
        .specification-diff .diff-add {
          background-color: rgba(34, 197, 94, 0.5);
          color: var(--text);
          padding: 0 2px;
          border-radius: 2px;
        }
        .specification-diff .diff-remove {
          background-color: rgba(239, 68, 68, 0.5);
          color: var(--text);
          text-decoration: line-through;
          padding: 0 2px;
          border-radius: 2px;
        }
      `}</style>
    </div>
  );
}
