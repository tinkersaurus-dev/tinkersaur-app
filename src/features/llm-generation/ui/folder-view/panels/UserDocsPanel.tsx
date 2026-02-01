/**
 * User Documentation Panel Component
 *
 * Displays a sidebar list of documents with the selected document
 * shown in the main content area. Supports operations like regenerate,
 * delete, edit, and copy.
 */

import { useCallback } from 'react';
import { useAuthStore } from '@/features/auth';
import {
  regenerateUserDocument,
  userDocumentToMarkdown,
  type UserDocument,
} from '@/features/llm-generation';
import { UserDocCard } from '../cards/UserDocCard';
import { UserDocSidebar } from '../sidebars/UserDocSidebar';
import { DocOperationModal } from '../modals/DocOperationModal';
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
  const teamId = useAuthStore((state) => state.selectedTeam?.teamId ?? '');

  const handleRegenerate = useCallback(
    (document: UserDocument, context: string, instructions?: string) =>
      regenerateUserDocument(document, context, teamId, instructions),
    [teamId]
  );

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
      regenerate={handleRegenerate}
    />
  );
}
