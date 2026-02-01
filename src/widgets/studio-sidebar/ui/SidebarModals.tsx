/**
 * SidebarModals Component
 * Renders the CreateDiagramModal and LinkUseCaseModal for the sidebar.
 */

import { CreateDiagramModal, LinkUseCaseModal } from '@/features/diagram-management';
import type { SidebarModalsProps } from '../model/types';

export function SidebarModals({
  solutionId,
  teamId,
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
        teamId={teamId}
        onClose={onCloseLinkUseCaseModal}
        onLink={onLinkUseCase}
      />
    </>
  );
}
