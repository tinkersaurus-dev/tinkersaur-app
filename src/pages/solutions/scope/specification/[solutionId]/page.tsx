/**
 * Specification Detail Page
 * Displays the latest Delivered version specification for each use case in a solution
 * Split-panel layout: list on left, specification viewer on right
 */

import { useState, useEffect, useMemo } from 'react';
import { useParams, useNavigate, useLoaderData } from 'react-router';
import { HydrationBoundary } from '@tanstack/react-query';
import type { LoaderFunctionArgs } from 'react-router';
import { PageHeader, PageContent } from '@/shared/ui';
import { useSolutionQuery } from '@/entities/solution';
import { useSolutionStore } from '@/app/model/stores/solution';
import {
  useDeliveredSpecifications,
  SpecificationList,
  SpecificationViewerPanel,
} from '@/features/specification-viewer';
import type { DeliveredSpecification } from '@/features/specification-viewer';
import { loadSpecificationPage } from './loader';
import type { SpecificationLoaderData } from './loader';

// Loader function for SSR data fetching
export async function loader({ params }: LoaderFunctionArgs) {
  const solutionId = params.solutionId;
  if (!solutionId) {
    throw new Response('Solution ID required', { status: 400 });
  }
  return loadSpecificationPage(solutionId);
}

function SpecificationContent() {
  const { solutionId } = useParams();
  const navigate = useNavigate();
  // Track the user's explicit selection by version ID (null means use auto-select)
  const [selectedVersionId, setSelectedVersionId] = useState<string | null>(null);

  // Solution store for auto-select and team change detection
  const selectSolution = useSolutionStore((state) => state.selectSolution);
  const selectedSolution = useSolutionStore((state) => state.selectedSolution);

  // TanStack Query hooks
  const { data: solution, isLoading: solutionLoading, isError } = useSolutionQuery(solutionId);

  // Delivered specifications hook
  const { specifications, isLoading, hasUseCases } = useDeliveredSpecifications(solutionId);

  // Compute effective selected spec: user's selection if valid, otherwise first item
  const selectedSpec = useMemo(() => {
    if (specifications.length === 0) return null;

    // If user has selected something, try to find it
    if (selectedVersionId) {
      const found = specifications.find(
        (spec) => spec.latestDeliveredVersion.id === selectedVersionId
      );
      if (found) return found;
    }

    // Default to first item
    return specifications[0];
  }, [specifications, selectedVersionId]);

  // Handler for user selection
  const handleSelectSpec = (spec: DeliveredSpecification) => {
    setSelectedVersionId(spec.latestDeliveredVersion.id);
  };

  // Auto-select solution when viewing it
  useEffect(() => {
    if (solution) {
      selectSolution(solution);
    }
  }, [solution, selectSolution]);

  // Redirect to empty state when solution is cleared (e.g., team change)
  useEffect(() => {
    if (solutionId && !selectedSolution) {
      navigate('/solutions/scope/specification', { replace: true });
    }
  }, [selectedSolution, solutionId, navigate]);

  // Handle loading state
  if (solutionLoading) {
    return (
      <PageContent>
        <div className="text-center py-8 text-[var(--text-muted)]">Loading...</div>
      </PageContent>
    );
  }

  // Handle error or not found state
  if (isError || !solution) {
    return (
      <PageContent>
        <div className="text-center py-8 text-[var(--text-muted)]">Solution not found</div>
      </PageContent>
    );
  }

  return (
    <>
      <PageHeader
        titlePrefix={solution.type.charAt(0).toUpperCase() + solution.type.slice(1) + ': '}
        title={solution.name}
      />

      <PageContent>
        <div className="pt-4 h-[calc(90vh-160px)]">
          <div className="grid grid-cols-2 gap-4 h-full">
            {/* Left: Specification List */}
            <div className="h-full overflow-auto">
              <SpecificationList
                specifications={specifications}
                loading={isLoading}
                selectedSpec={selectedSpec}
                onSelectSpec={handleSelectSpec}
                hasUseCases={hasUseCases}
              />
            </div>

            {/* Right: Specification Viewer Panel */}
            <div className="h-full overflow-hidden">
              <SpecificationViewerPanel specification={selectedSpec} />
            </div>
          </div>
        </div>
      </PageContent>
    </>
  );
}

export default function SpecificationPage() {
  const { dehydratedState } = useLoaderData<SpecificationLoaderData>();

  return (
    <HydrationBoundary state={dehydratedState}>
      <SpecificationContent />
    </HydrationBoundary>
  );
}
