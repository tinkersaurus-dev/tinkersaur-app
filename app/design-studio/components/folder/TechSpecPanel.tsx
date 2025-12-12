/**
 * Technical Specification Panel Component
 *
 * Displays a sidebar list of specification sections with the selected section
 * shown in the main content area. Supports operations like regenerate,
 * delete, edit, and copy.
 */

import type { TechSpecSection } from '../../lib/llm/types';
import { techSpecSectionToMarkdown } from '../../lib/llm/types';
import { TechSpecCard } from './TechSpecCard';
import { TechSpecSidebar } from './TechSpecSidebar';
import { TechSpecOperationModal } from './TechSpecOperationModal';
import { regenerateTechSpecSection } from '../../lib/llm/tech-spec-generator-api';
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
      regenerate={regenerateTechSpecSection}
    />
  );
}
