/**
 * User Documentation Panel Component
 *
 * Displays a sidebar list of documents with the selected document
 * shown in the main content area. Supports operations like regenerate,
 * delete, edit, and copy.
 */

import { useState, useCallback, useEffect } from 'react';
import { LuTrash2, LuRefreshCw, LuPencil, LuCopy } from 'react-icons/lu';
import { Button } from '~/core/components/ui/Button';
import type { UserDocument } from '../../lib/llm/types';
import { userDocumentToMarkdown } from '../../lib/llm/types';
import { UserDocCard } from './UserDocCard';
import { UserDocSidebar } from './UserDocSidebar';
import { DocOperationModal, type DocOperationType } from './DocOperationModal';
import { regenerateUserDocument } from '../../lib/llm/user-docs-generator-api';

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
  const [documents, setDocuments] = useState<UserDocument[]>(initialDocuments);
  const [selectedId, setSelectedId] = useState<string | null>(
    initialDocuments.length > 0 ? initialDocuments[0].id : null
  );

  // Sync when initialDocuments changes
  useEffect(() => {
    setDocuments(initialDocuments);
    setSelectedId(initialDocuments.length > 0 ? initialDocuments[0].id : null);
  }, [initialDocuments]);

  // Modal state
  const [modalOpen, setModalOpen] = useState(false);
  const [operationType, setOperationType] = useState<DocOperationType>('regenerate');
  const [isOperating, setIsOperating] = useState(false);
  const [operationError, setOperationError] = useState<string | null>(null);

  const selectedDocument = documents.find((d) => d.id === selectedId) || null;

  const updateDocuments = useCallback(
    (newDocs: UserDocument[]) => {
      setDocuments(newDocs);
      onDocumentsChange?.(newDocs);
    },
    [onDocumentsChange]
  );

  // Handlers
  const handleDelete = useCallback(() => {
    if (!selectedId) return;
    const newDocs = documents.filter((d) => d.id !== selectedId);
    const deletedIndex = documents.findIndex((d) => d.id === selectedId);
    const newSelectedId =
      newDocs.length > 0
        ? newDocs[Math.min(deletedIndex, newDocs.length - 1)].id
        : null;
    updateDocuments(newDocs);
    setSelectedId(newSelectedId);
  }, [documents, selectedId, updateDocuments]);

  const handleCopy = useCallback(async () => {
    if (!selectedDocument) return;
    const markdown = userDocumentToMarkdown(selectedDocument);
    await navigator.clipboard.writeText(markdown);
  }, [selectedDocument]);

  const openOperationModal = useCallback((type: DocOperationType) => {
    setOperationType(type);
    setOperationError(null);
    setModalOpen(true);
  }, []);

  const handleOperation = useCallback(
    async (instructions?: string, editedDocument?: UserDocument) => {
      setIsOperating(true);
      setOperationError(null);

      try {
        if (operationType === 'edit' && editedDocument) {
          // Local edit - no LLM call
          const newDocs = documents.map((d) =>
            d.id === editedDocument.id ? editedDocument : d
          );
          updateDocuments(newDocs);
          setModalOpen(false);
        } else if (operationType === 'regenerate' && selectedDocument) {
          const regeneratedDoc = await regenerateUserDocument(
            selectedDocument,
            folderContent,
            instructions
          );
          const newDocs = documents.map((d) =>
            d.id === selectedDocument.id ? regeneratedDoc : d
          );
          updateDocuments(newDocs);
          setModalOpen(false);
        }
      } catch (error) {
        setOperationError(
          error instanceof Error ? error.message : 'Operation failed'
        );
      } finally {
        setIsOperating(false);
      }
    },
    [operationType, selectedDocument, documents, folderContent, updateDocuments]
  );

  if (documents.length === 0) {
    return (
      <div className="flex items-center justify-center h-full text-[var(--text-muted)]">
        No documents yet. Click "Generate" to create documentation from the folder
        content.
      </div>
    );
  }

  return (
    <div className="flex h-full">
      {/* Sidebar */}
      <UserDocSidebar
        documents={documents}
        selectedId={selectedId}
        onSelect={setSelectedId}
      />

      {/* Main Content */}
      <div className="flex-1 flex flex-col overflow-hidden">
        {/* Toolbar */}
        {selectedDocument && (
          <div className="flex items-center gap-2 px-4 py-2 border-b border-[var(--border)] bg-[var(--surface)]">
            <Button
              variant="default"
              size="small"
              icon={<LuRefreshCw />}
              onClick={() => openOperationModal('regenerate')}
              title="Regenerate this document"
            >
              Regenerate
            </Button>
            <Button
              variant="default"
              size="small"
              icon={<LuPencil />}
              onClick={() => openOperationModal('edit')}
              title="Edit this document"
            >
              Edit
            </Button>
            <Button
              variant="default"
              size="small"
              icon={<LuTrash2 />}
              onClick={handleDelete}
              title="Delete this document"
            >
              Delete
            </Button>
            <Button
              variant="default"
              size="small"
              icon={<LuCopy />}
              onClick={handleCopy}
              className="ml-auto"
              title="Copy this document to clipboard"
            >
              Copy
            </Button>
          </div>
        )}

        {/* Document Content */}
        <div className="flex-1 overflow-auto p-4">
          {selectedDocument ? (
            <UserDocCard document={selectedDocument} />
          ) : (
            <div className="flex items-center justify-center h-full text-[var(--text-muted)]">
              Select a document from the sidebar to view it.
            </div>
          )}
        </div>
      </div>

      {/* Operation Modal */}
      <DocOperationModal
        open={modalOpen}
        operationType={operationType}
        document={selectedDocument}
        onConfirm={handleOperation}
        onCancel={() => setModalOpen(false)}
        isLoading={isOperating}
        error={operationError}
      />
    </div>
  );
}
