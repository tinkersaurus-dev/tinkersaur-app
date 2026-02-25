/**
 * SolutionSelectorModal Component
 * Unified modal container with sliding views for selecting or creating solutions
 */

import { useState, useCallback } from 'react';
import { Modal } from '@/shared/ui';
import type { Solution } from '@/entities/solution';
import { useSolutionsQuery } from '@/entities/solution';
import { useAuthStore } from '@/shared/auth';
import { SolutionSelectorView } from './SolutionSelectorView';
import { CreateSolutionView } from './CreateSolutionView';

type ModalView = 'selector' | 'create';

interface SolutionSelectorModalProps {
  open: boolean;
  onClose: () => void;
  onSelect: (solution: Solution) => void;
  /** Start directly in create view */
  initialView?: ModalView;
}

export function SolutionSelectorModal({
  open,
  onClose,
  onSelect,
  initialView = 'selector',
}: SolutionSelectorModalProps) {
  const [currentView, setCurrentView] = useState<ModalView>(initialView);
  const [filter, setFilter] = useState('');

  const selectedTeam = useAuthStore((state) => state.selectedTeam);
  const teamId = selectedTeam?.teamId;
  const { data: solutions = [], isLoading } = useSolutionsQuery(teamId);

  // Navigate to create view (slide left)
  const handleCreateClick = useCallback(() => {
    setCurrentView('create');
  }, []);

  // Navigate back to selector view (slide right)
  const handleBackToSelector = useCallback(() => {
    setCurrentView('selector');
  }, []);

  // Handle solution selection
  const handleSolutionSelect = useCallback(
    (solution: Solution) => {
      onSelect(solution);
      onClose();
      setFilter('');
      setCurrentView(initialView);
    },
    [onSelect, onClose, initialView]
  );

  // Handle successful creation
  const handleCreateSuccess = useCallback(
    (solution: Solution) => {
      onSelect(solution);
      onClose();
      setFilter('');
      setCurrentView(initialView);
    },
    [onSelect, onClose, initialView]
  );

  // Handle modal close
  const handleClose = useCallback(() => {
    onClose();
    setFilter('');
    setCurrentView(initialView);
  }, [onClose, initialView]);

  const title = currentView === 'selector' ? 'Select Solution' : 'Create Solution';

  return (
    <Modal
      title={title}
      open={open}
      onCancel={handleClose}
      footer={null}
      width={900}
    >
      <div className="slide-container mt-4" style={{ minHeight: '420px' }}>
        {/* Selector View */}
        <div
          className={`slide-view ${
            currentView === 'selector' ? 'slide-view-center' : 'slide-view-left'
          }`}
        >
          <SolutionSelectorView
            solutions={solutions}
            isLoading={isLoading}
            hasTeam={!!teamId}
            filter={filter}
            onFilterChange={setFilter}
            onSelect={handleSolutionSelect}
            onCreateClick={handleCreateClick}
          />
        </div>

        {/* Create View */}
        <div
          className={`slide-view ${
            currentView === 'create' ? 'slide-view-center' : 'slide-view-right'
          }`}
        >
          <CreateSolutionView
            onCancel={handleBackToSelector}
            onSuccess={handleCreateSuccess}
          />
        </div>
      </div>
    </Modal>
  );
}
