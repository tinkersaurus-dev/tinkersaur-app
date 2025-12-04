/**
 * Technical Specification Panel Component
 *
 * Displays a sidebar list of specification sections with the selected section
 * shown in the main content area. Supports operations like regenerate,
 * delete, edit, and copy.
 */

import { useState, useCallback, useEffect } from 'react';
import { LuTrash2, LuRefreshCw, LuPencil, LuCopy } from 'react-icons/lu';
import { Button } from '~/core/components/ui/Button';
import type { TechSpecSection } from '../../lib/llm/types';
import { techSpecSectionToMarkdown } from '../../lib/llm/types';
import { TechSpecCard } from './TechSpecCard';
import { TechSpecSidebar } from './TechSpecSidebar';
import { TechSpecOperationModal, type TechSpecOperationType } from './TechSpecOperationModal';
import { regenerateTechSpecSection } from '../../lib/llm/tech-spec-generator-api';

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
  const [sections, setSections] = useState<TechSpecSection[]>(initialSections);
  const [selectedId, setSelectedId] = useState<string | null>(
    initialSections.length > 0 ? initialSections[0].id : null
  );

  // Sync when initialSections changes
  useEffect(() => {
    setSections(initialSections);
    setSelectedId(initialSections.length > 0 ? initialSections[0].id : null);
  }, [initialSections]);

  // Modal state
  const [modalOpen, setModalOpen] = useState(false);
  const [operationType, setOperationType] = useState<TechSpecOperationType>('regenerate');
  const [isOperating, setIsOperating] = useState(false);
  const [operationError, setOperationError] = useState<string | null>(null);

  const selectedSection = sections.find((s) => s.id === selectedId) || null;

  const updateSections = useCallback(
    (newSections: TechSpecSection[]) => {
      setSections(newSections);
      onSectionsChange?.(newSections);
    },
    [onSectionsChange]
  );

  // Handlers
  const handleDelete = useCallback(() => {
    if (!selectedId) return;
    const newSections = sections.filter((s) => s.id !== selectedId);
    const deletedIndex = sections.findIndex((s) => s.id === selectedId);
    const newSelectedId =
      newSections.length > 0
        ? newSections[Math.min(deletedIndex, newSections.length - 1)].id
        : null;
    updateSections(newSections);
    setSelectedId(newSelectedId);
  }, [sections, selectedId, updateSections]);

  const handleCopy = useCallback(async () => {
    if (!selectedSection) return;
    const markdown = techSpecSectionToMarkdown(selectedSection);
    await navigator.clipboard.writeText(markdown);
  }, [selectedSection]);

  const openOperationModal = useCallback((type: TechSpecOperationType) => {
    setOperationType(type);
    setOperationError(null);
    setModalOpen(true);
  }, []);

  const handleOperation = useCallback(
    async (instructions?: string, editedSection?: TechSpecSection) => {
      setIsOperating(true);
      setOperationError(null);

      try {
        if (operationType === 'edit' && editedSection) {
          // Local edit - no LLM call
          const newSections = sections.map((s) =>
            s.id === editedSection.id ? editedSection : s
          );
          updateSections(newSections);
          setModalOpen(false);
        } else if (operationType === 'regenerate' && selectedSection) {
          const regeneratedSection = await regenerateTechSpecSection(
            selectedSection,
            folderContent,
            instructions
          );
          const newSections = sections.map((s) =>
            s.id === selectedSection.id ? regeneratedSection : s
          );
          updateSections(newSections);
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
    [operationType, selectedSection, sections, folderContent, updateSections]
  );

  if (sections.length === 0) {
    return (
      <div className="flex items-center justify-center h-full text-[var(--text-muted)]">
        No specification yet. Click "Generate" to create a technical specification from the folder
        content.
      </div>
    );
  }

  return (
    <div className="flex h-full">
      {/* Sidebar */}
      <TechSpecSidebar
        sections={sections}
        selectedId={selectedId}
        onSelect={setSelectedId}
      />

      {/* Main Content */}
      <div className="flex-1 flex flex-col overflow-hidden">
        {/* Toolbar */}
        {selectedSection && (
          <div className="flex items-center gap-2 px-4 py-2 border-b border-[var(--border)] bg-[var(--surface)]">
            <Button
              variant="default"
              size="small"
              icon={<LuRefreshCw />}
              onClick={() => openOperationModal('regenerate')}
              title="Regenerate this section"
            >
              Regenerate
            </Button>
            <Button
              variant="default"
              size="small"
              icon={<LuPencil />}
              onClick={() => openOperationModal('edit')}
              title="Edit this section"
            >
              Edit
            </Button>
            <Button
              variant="default"
              size="small"
              icon={<LuTrash2 />}
              onClick={handleDelete}
              title="Delete this section"
            >
              Delete
            </Button>
            <Button
              variant="default"
              size="small"
              icon={<LuCopy />}
              onClick={handleCopy}
              className="ml-auto"
              title="Copy this section to clipboard"
            >
              Copy
            </Button>
          </div>
        )}

        {/* Section Content */}
        <div className="flex-1 overflow-auto p-4">
          {selectedSection ? (
            <TechSpecCard section={selectedSection} />
          ) : (
            <div className="flex items-center justify-center h-full text-[var(--text-muted)]">
              Select a section from the sidebar to view it.
            </div>
          )}
        </div>
      </div>

      {/* Operation Modal */}
      <TechSpecOperationModal
        open={modalOpen}
        operationType={operationType}
        section={selectedSection}
        onConfirm={handleOperation}
        onCancel={() => setModalOpen(false)}
        isLoading={isOperating}
        error={operationError}
      />
    </div>
  );
}
