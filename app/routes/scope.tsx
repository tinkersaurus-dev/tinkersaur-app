/**
 * Scope Index Route
 * Redirects to selected solution or shows empty state
 */

/* eslint-disable react-refresh/only-export-components */
import { redirect } from 'react-router';
import { getSelectedSolutionId } from '~/core/solution';
import { MainLayout } from '~/core/components/MainLayout';
import { PageHeader, PageContent } from '~/core/components';
import { Empty, Button } from '~/core/components/ui';
import { FiPlus } from 'react-icons/fi';
import { useState } from 'react';
import { useNavigate } from 'react-router';
import { CreateSolutionModal } from '~/core/components/CreateSolutionModal';
import { useSolutionStore } from '~/core/solution';

export function clientLoader() {
  const solutionId = getSelectedSolutionId();

  if (solutionId) {
    return redirect(`/solution/scope/${solutionId}`);
  }

  return null;
}

export default function ScopeIndex() {
  const navigate = useNavigate();
  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);
  const selectedSolution = useSolutionStore((state) => state.selectedSolution);

  // If a solution is selected, redirect to it
  if (selectedSolution?.solutionId) {
    navigate(`/solution/scope/${selectedSolution.solutionId}`, { replace: true });
    return null;
  }

  const handleCreateSuccess = (solution: { id: string }) => {
    setIsCreateModalOpen(false);
    navigate(`/solution/scope/${solution.id}`);
  };

  return (
    <MainLayout>
      <PageHeader title="Scope" />
      <PageContent>
        <div className="flex flex-col items-center justify-center py-16">
          <Empty description="No solution selected" />
          <p className="text-[var(--text-muted)] mt-4 mb-6 text-center max-w-md">
            Select a solution from the sidebar or create a new one to get started.
          </p>
          <Button
            variant="primary"
            icon={<FiPlus />}
            onClick={() => setIsCreateModalOpen(true)}
          >
            Create Solution
          </Button>
        </div>
      </PageContent>

      <CreateSolutionModal
        open={isCreateModalOpen}
        onClose={() => setIsCreateModalOpen(false)}
        onSuccess={handleCreateSuccess}
      />
    </MainLayout>
  );
}
