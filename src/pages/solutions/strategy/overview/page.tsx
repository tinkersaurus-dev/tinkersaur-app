/**
 * Overview Index Route
 * Redirects to selected solution or shows empty state
 */

/* eslint-disable react-refresh/only-export-components */
import { redirect } from 'react-router';
import { getSelectedSolutionId } from '@/app/model/stores/solution';
import { MainLayout } from '@/app/layouts/MainLayout';
import { PageHeader, PageContent } from '~/core/components';
import { Empty, Button } from '@/shared/ui';
import { FiPlus } from 'react-icons/fi';
import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router';
import { CreateSolutionModal } from '@/widgets/solution-selector';
import { useSolutionStore } from '@/app/model/stores/solution';

export function clientLoader() {
  const solutionId = getSelectedSolutionId();

  if (solutionId) {
    return redirect(`/solutions/strategy/overview/${solutionId}`);
  }

  return null;
}

export default function OverviewIndex() {
  const navigate = useNavigate();
  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);
  const selectedSolution = useSolutionStore((state) => state.selectedSolution);

  // Redirect to selected solution via effect (not during render)
  useEffect(() => {
    if (selectedSolution?.solutionId) {
      navigate(`/solutions/strategy/overview/${selectedSolution.solutionId}`, { replace: true });
    }
  }, [selectedSolution?.solutionId, navigate]);

  const handleCreateSuccess = (solution: { id: string }) => {
    setIsCreateModalOpen(false);
    navigate(`/solutions/strategy/overview/${solution.id}`);
  };

  return (
    <MainLayout>
      <PageHeader title="Overview" />
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
