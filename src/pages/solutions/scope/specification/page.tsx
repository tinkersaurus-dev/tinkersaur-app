/**
 * Specification Index Route
 * Redirects to selected solution or shows empty state
 */

/* eslint-disable react-refresh/only-export-components */
import { redirect } from 'react-router';
import { getSelectedSolutionId } from '@/app/model/stores/solution';
import { PageHeader, PageContent, Spinner } from '@/shared/ui';
import { Empty, Button } from '@/shared/ui';
import { FiPlus } from 'react-icons/fi';
import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router';
import { SolutionSelectorModal } from '@/widgets/solution-selector';
import { useSolutionStore } from '@/app/model/stores/solution';

export function clientLoader() {
  const solutionId = getSelectedSolutionId();

  if (solutionId) {
    return redirect(`/solutions/scope/specification/${solutionId}`);
  }

  return null;
}

export function HydrateFallback() {
  return (
    <div className="flex items-center justify-center h-screen text-[var(--text-muted)]">
      <Spinner size="lg" className="mr-3" />
      Loading...
    </div>
  );
}

export default function SpecificationIndex() {
  const navigate = useNavigate();
  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);
  const selectedSolution = useSolutionStore((state) => state.selectedSolution);

  // Redirect to selected solution via effect (not during render)
  useEffect(() => {
    if (selectedSolution?.solutionId) {
      navigate(`/solutions/scope/specification/${selectedSolution.solutionId}`, { replace: true });
    }
  }, [selectedSolution?.solutionId, navigate]);

  const handleCreateSuccess = (solution: { id: string }) => {
    setIsCreateModalOpen(false);
    navigate(`/solutions/scope/specification/${solution.id}`);
  };

  return (
    <>
      <PageHeader title="Specification" />
      <PageContent>
        <div className="flex flex-col items-center justify-center py-16">
          <Empty description="No solution selected" />
          <p className="text-[var(--text-muted)] mt-4 mb-6 text-center max-w-md">
            Select a solution from the sidebar or create a new one to view specifications.
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

      <SolutionSelectorModal
        open={isCreateModalOpen}
        onClose={() => setIsCreateModalOpen(false)}
        onSelect={handleCreateSuccess}
        initialView="create"
      />
    </>
  );
}
