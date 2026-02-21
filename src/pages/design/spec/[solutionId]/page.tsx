/**
 * Design Studio Route
 * Main design studio page with sidebar tree and tabbed content area
 * Lazy loading architecture: only loads DesignWorks (metadata) upfront,
 * content is loaded on-demand when user opens it
 */

import { useEffect } from 'react';
import { useParams, useNavigate } from 'react-router';
import { useSolutionQuery, useSolutionStore } from '@/entities/solution';
import { DesignStudioContent } from '@/widgets/studio-content';

export default function StudioPage() {
  const { solutionId } = useParams();
  const navigate = useNavigate();
  const selectedSolution = useSolutionStore((state) => state.selectedSolution);

  // Use TanStack Query for solution data
  const { data: solution, isLoading: loadingSolution, isError } = useSolutionQuery(solutionId);

  // Redirect to new solution when selected solution changes
  useEffect(() => {
    if (selectedSolution?.solutionId && selectedSolution.solutionId !== solutionId) {
      navigate(`/design/spec/${selectedSolution.solutionId}`, { replace: true });
    }
  }, [selectedSolution?.solutionId, solutionId, navigate]);

  if (loadingSolution) {
    return (
      <div className="flex items-center justify-center h-full">
        <div className="text-[var(--text-muted)]">Loading...</div>
      </div>
    );
  }

  if (isError || !solution) {
    return (
      <div className="flex items-center justify-center h-full">
        <div className="text-[var(--text-muted)]">Solution not found (id: {solutionId})</div>
      </div>
    );
  }

  return <DesignStudioContent solutionId={solutionId!} />;
}
