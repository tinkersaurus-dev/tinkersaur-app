/**
 * Spec Index Route
 * Redirects to selected solution's Design Studio or shows empty state
 */

import { useEffect } from 'react';
import { useNavigate } from 'react-router';
import { MainLayout } from '~/core/components/MainLayout';
import { useSolutionStore } from '~/core/solution';
import { FiPenTool } from 'react-icons/fi';

export default function SpecIndex() {
  const navigate = useNavigate();
  const selectedSolution = useSolutionStore((state) => state.selectedSolution);

  // Redirect to Design Studio if a solution is selected
  useEffect(() => {
    if (selectedSolution?.solutionId) {
      navigate(`/design/spec/${selectedSolution.solutionId}`, { replace: true });
    }
  }, [selectedSolution?.solutionId, navigate]);

  // Show empty state if no solution selected
  return (
    <MainLayout>
      <div className="h-full flex items-center justify-center">
        <div className="text-center max-w-md">
          <div className="flex justify-center mb-4">
            <div className="p-4 rounded-full bg-[var(--bg-light)]">
              <FiPenTool size={32} className="text-[var(--text-muted)]" />
            </div>
          </div>
          <h1 className="text-xl font-semibold text-[var(--text)] mb-2">Design Studio</h1>
          <p className="text-[var(--text-muted)]">
            Select a solution to open the Design Studio where you can create diagrams, interfaces,
            and documentation.
          </p>
        </div>
      </div>
    </MainLayout>
  );
}
