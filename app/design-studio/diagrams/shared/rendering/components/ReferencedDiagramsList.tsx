/**
 * ReferencedDiagramsList Component
 *
 * Displays a list of diagrams that are referenced by the LLM generator
 * for context during diagram generation. Each reference can be removed.
 */

import { memo } from 'react';
import { MdClose } from 'react-icons/md';
import type { Diagram } from '~/core/entities/design-studio/types';

export interface ReferencedDiagramsListProps {
  diagrams: Diagram[];
  onRemove: (diagramId: string) => void;
  zoom: number;
}

export const ReferencedDiagramsList = memo(function ReferencedDiagramsList({
  diagrams,
  onRemove,
  zoom,
}: ReferencedDiagramsListProps) {
  if (diagrams.length === 0) {
    return null;
  }

  return (
    <div
      style={{
        display: 'flex',
        flexDirection: 'column',
        gap: '4px',
        fontSize: 'var(--font-size-xs)',
        color: 'var(--text-muted)',
      }}
    >
      <div style={{ fontWeight: 'semibold', color: 'var(--text)' }}>
        Referenced Diagrams:
      </div>
      {diagrams.map((refDiagram) => (
        <div
          key={refDiagram.id}
          data-interactive="true"
          style={{
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            gap: '4px',
            padding: '4px 6px',
            backgroundColor: 'var(--bg-light)',
            border: `${1 / zoom}px solid var(--border)`,
            borderRadius: '2px',
          }}
        >
          <span style={{ flex: 1, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
            [{refDiagram.type}] {refDiagram.name}
          </span>
          <button
            data-interactive="true"
            onClick={() => onRemove(refDiagram.id)}
            style={{
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              width: '14px',
              height: '14px',
              padding: 0,
              backgroundColor: 'transparent',
              border: 'none',
              cursor: 'pointer',
              color: 'var(--text-muted)',
              borderRadius: '2px',
            }}
            onMouseEnter={(e) => {
              e.currentTarget.style.backgroundColor = 'var(--error-bg)';
              e.currentTarget.style.color = 'var(--error)';
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.backgroundColor = 'transparent';
              e.currentTarget.style.color = 'var(--text-muted)';
            }}
          >
            <MdClose size={10} />
          </button>
        </div>
      ))}
    </div>
  );
});
