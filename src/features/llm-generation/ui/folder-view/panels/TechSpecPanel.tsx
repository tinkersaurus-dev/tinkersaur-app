/**
 * Technical Specification Panel Component
 *
 * Displays a sidebar list of specification sections with the selected section
 * shown in the main content area. Supports operations like regenerate,
 * delete, edit, and copy.
 */

import { useCallback } from 'react';
import { useAuthStore } from '@/shared/auth';
import {
  regenerateTechSpecSection,
  techSpecSectionToMarkdown,
  type TechSpecSection,
} from '@/features/llm-generation';
import { TechSpecCard } from '../cards/TechSpecCard';
import { TechSpecSidebar } from '../sidebars/TechSpecSidebar';
import { TechSpecOperationModal } from '../modals/TechSpecOperationModal';
import { ListPanel, type ListPanelModalProps } from './ListPanel';

export interface TechSpecPanelProps {
  initialSections: TechSpecSection[];
  folderContent: string;
  onSectionsChange?: (sections: TechSpecSection[]) => void;
}

export function TechSpecPanel({
  initialSections,
  folderContent,
  onSectionsChange,
}: TechSpecPanelProps) {
  const teamId = useAuthStore((state) => state.selectedTeam?.teamId ?? '');

  const handleRegenerate = useCallback(
    (section: TechSpecSection, context: string, instructions?: string) =>
      regenerateTechSpecSection(section, context, teamId, instructions),
    [teamId]
  );

  return (
    <ListPanel<TechSpecSection>
      initialItems={initialSections}
      folderContent={folderContent}
      onItemsChange={onSectionsChange}
      renderSidebar={({ items, selectedId, onSelect }) => (
        <TechSpecSidebar
          sections={items}
          selectedId={selectedId}
          onSelect={onSelect}
        />
      )}
      renderCard={(section) => <TechSpecCard section={section} />}
      renderModal={(props: ListPanelModalProps<TechSpecSection>) => (
        <TechSpecOperationModal
          open={props.open}
          operationType={props.operationType}
          section={props.item}
          onConfirm={props.onConfirm}
          onCancel={props.onCancel}
          isLoading={props.isLoading}
          error={props.error}
        />
      )}
      emptyMessage="No specification yet. Click &quot;Generate&quot; to create a technical specification from the folder content."
      noSelectionMessage="Select a section from the sidebar to view it."
      toMarkdown={techSpecSectionToMarkdown}
      regenerate={handleRegenerate}
    />
  );
}
