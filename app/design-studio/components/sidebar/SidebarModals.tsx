/**
 * SidebarModals Component
 * Renders the CreateDiagramModal and LinkUseCaseModal for the sidebar.
 */

import { CreateDiagramModal } from '../CreateDiagramModal';
import { LinkUseCaseModal } from '../LinkUseCaseModal';
import type { SidebarModalsProps } from './types';

export function SidebarModals({
  solutionId,
  modalState,
  onCloseDiagramModal,
  onCloseLinkUseCaseModal,
  onCreateDiagram,
  onLinkUseCase,
  getCurrentUseCaseId,
}: SidebarModalsProps) {
  return (
    <>
      <CreateDiagramModal
        open={modalState.createDiagramModalOpen}
        designWorkId={modalState.selectedDesignWorkId}
        onClose={onCloseDiagramModal}
        onCreate={onCreateDiagram}
      />

      <LinkUseCaseModal
        open={modalState.linkUseCaseModalOpen}
        designWorkId={modalState.linkUseCaseFolderId}
        currentUseCaseId={getCurrentUseCaseId(modalState.linkUseCaseFolderId)}
        solutionId={solutionId}
        onClose={onCloseLinkUseCaseModal}
        onLink={onLinkUseCase}
      />
    </>
  );
}
