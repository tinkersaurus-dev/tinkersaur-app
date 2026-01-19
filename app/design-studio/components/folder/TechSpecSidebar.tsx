/**
 * Technical Specification Sidebar Component
 *
 * Displays a vertical list of specification section titles for navigation.
 */

import type { TechSpecSection } from '~/core/api/llm';
import { TECH_SPEC_SECTION_LABELS } from '~/core/api/llm';

export interface TechSpecSidebarProps {
  sections: TechSpecSection[];
  selectedId: string | null;
  onSelect: (id: string) => void;
}

export function TechSpecSidebar({ sections, selectedId, onSelect }: TechSpecSidebarProps) {
  if (sections.length === 0) {
    return null;
  }

  return (
    <div className="w-56 border-r border-[var(--border)] bg-[var(--surface)] flex flex-col overflow-hidden">
      <div className="px-3 py-2 text-xs font-medium text-[var(--text-muted)] border-b border-[var(--border)]">
        Sections ({sections.length})
      </div>
      <div className="flex-1 overflow-auto">
        {sections.map((section) => (
          <div
            key={section.id}
            onClick={() => onSelect(section.id)}
            className={`
              px-3 py-2 cursor-pointer text-sm transition-all
              ${
                selectedId === section.id
                  ? 'bg-[color-mix(in_srgb,var(--primary)_10%,var(--bg))] text-[var(--primary)] border-l-2 border-[var(--primary)]'
                  : 'text-[var(--text)] hover:bg-[var(--bg-light)] border-l-2 border-transparent'
              }
            `}
          >
            <div className="font-medium truncate text-xs">{section.title}</div>
            <div className="text-xs text-[var(--text-muted)] truncate mt-0.5">
              {TECH_SPEC_SECTION_LABELS[section.sectionType] || section.sectionType}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
