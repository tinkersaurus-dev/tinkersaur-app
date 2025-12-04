/**
 * User Documentation Sidebar Component
 *
 * Displays a vertical list of document titles for navigation.
 */

import type { UserDocument } from '../../lib/llm/types';

export interface UserDocSidebarProps {
  documents: UserDocument[];
  selectedId: string | null;
  onSelect: (id: string) => void;
}

export function UserDocSidebar({ documents, selectedId, onSelect }: UserDocSidebarProps) {
  if (documents.length === 0) {
    return null;
  }

  return (
    <div className="w-56 border-r border-[var(--border)] bg-[var(--surface)] flex flex-col overflow-hidden">
      <div className="px-3 py-2 text-xs font-medium text-[var(--text-muted)] border-b border-[var(--border)]">
        Documents ({documents.length})
      </div>
      <div className="flex-1 overflow-auto">
        {documents.map((doc) => (
          <div
            key={doc.id}
            onClick={() => onSelect(doc.id)}
            className={`
              px-3 py-2 cursor-pointer text-sm transition-all
              ${
                selectedId === doc.id
                  ? 'bg-[color-mix(in_srgb,var(--primary)_10%,var(--bg))] text-[var(--primary)] border-l-2 border-[var(--primary)]'
                  : 'text-[var(--text)] hover:bg-[var(--bg-light)] border-l-2 border-transparent'
              }
            `}
          >
            <div className="font-medium truncate text-xs">{doc.title}</div>
            <div className="text-[10px] text-[var(--text-muted)] truncate mt-0.5">
              {doc.steps.length} step{doc.steps.length !== 1 ? 's' : ''}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
