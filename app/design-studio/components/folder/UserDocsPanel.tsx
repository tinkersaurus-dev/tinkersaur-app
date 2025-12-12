/**
 * User Documentation Panel Component
 *
 * Displays a sidebar list of documents with the selected document
 * shown in the main content area. Supports operations like regenerate,
 * delete, edit, and copy.
 */

import type { UserDocument } from '../../lib/llm/types';
import { userDocumentToMarkdown } from '../../lib/llm/types';
import { UserDocCard } from './UserDocCard';
import { UserDocSidebar } from './UserDocSidebar';
import { DocOperationModal } from './DocOperationModal';
import { regenerateUserDocument } from '../../lib/llm/user-docs-generator-api';
import { ListPanel, type ListPanelModalProps } from './ListPanel';

export interface UserDocsPanelProps {
  initialDocuments: UserDocument[];
  folderContent: string;
  onDocumentsChange?: (documents: UserDocument[]) => void;
}

export function UserDocsPanel({
  initialDocuments,
  folderContent,
  onDocumentsChange,
}: UserDocsPanelProps) {
  return (
    <ListPanel<UserDocument>
      initialItems={initialDocuments}
      folderContent={folderContent}
      onItemsChange={onDocumentsChange}
      renderSidebar={({ items, selectedId, onSelect }) => (
        <UserDocSidebar
          documents={items}
          selectedId={selectedId}
          onSelect={onSelect}
        />
      )}
      renderCard={(document) => <UserDocCard document={document} />}
      renderModal={(props: ListPanelModalProps<UserDocument>) => (
        <DocOperationModal
          open={props.open}
          operationType={props.operationType}
          document={props.item}
          onConfirm={props.onConfirm}
          onCancel={props.onCancel}
          isLoading={props.isLoading}
          error={props.error}
        />
      )}
      emptyMessage="No documents yet. Click &quot;Generate&quot; to create documentation from the folder content."
      noSelectionMessage="Select a document from the sidebar to view it."
      toMarkdown={userDocumentToMarkdown}
      regenerate={regenerateUserDocument}
    />
  );
}
